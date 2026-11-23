import { test, expect } from "@playwright/test";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
const variants=['gpu','inference','operations'] as const;

for(const width of[900,1440]) {
  test(`Solutions diagrams open and reverse without moving text or traveling dots at ${width}px`,async({page})=>{
    await page.emulateMedia({reducedMotion:'no-preference'});
    await page.setViewportSize({width,height:1000});
    await page.goto('/solutions');
    await page.evaluate(()=>document.fonts.ready);
    for(const variant of variants) {
      const section=page.locator('.service-detail').filter({has:page.locator(`[id="service-${variant}-title"]`)});
      const slot=section.locator('.service-artwork-slot');
      const originalTop=await slot.evaluate(e=>e.getBoundingClientRect().top+scrollY);
      await page.evaluate(y=>scrollTo({top:Math.max(0,y-900),behavior:'instant'}),originalTop);
      const motion=page.locator(`.service-motion[data-service="${variant}"]`);
      await expect(motion).toHaveAttribute('data-motion-state',/ready|scrolling|complete/);
      await expect.poll(()=>motion.getAttribute('data-scroll-progress')).toBe('0.000');
      const source=readFileSync(resolve(`src/assets/service-${variant}-diagram.svg`),'utf8');
      const expected=[...source.matchAll(/<path\b[^>]*?\sd="([^"]*)"/g)].map(m=>m[1]);
      expect(await motion.locator('path').evaluateAll(ps=>ps.map(p=>p.getAttribute('d')))).toEqual(expected);
      const sample=()=>motion.evaluate(e=>({
        middle:(e.querySelector('[data-plane="middle"]') as SVGGElement).getCTM()?.f,
        lower:(e.querySelector('[data-plane="lower"]') as SVGGElement).getCTM()?.f,
        upper:(e.querySelector('[data-plane="upper"]') as SVGGElement).getCTM()?.f,
        markerTransforms:[...e.querySelectorAll('path[fill]:not([data-label])')].map(p=>({d:p.getAttribute('d'),fill:p.getAttribute('fill'),transform:p.getAttribute('transform'),style:(p as SVGPathElement).style.transform})),
      }));
      const annotationOpacity=()=>motion.locator('[data-reveal="true"]').evaluateAll(ps=>ps.map(p=>getComputedStyle(p).opacity));
      const closed=await sample();
      expect(await annotationOpacity()).toEqual(Array(12).fill('0'));
      const textTop=await section.locator('h2').evaluate(e=>e.getBoundingClientRect().top+scrollY);
      await page.evaluate(y=>scrollTo({top:y-450,behavior:'instant'}),originalTop);
      await expect.poll(async()=>Number(await motion.getAttribute('data-scroll-progress'))).toBeGreaterThan(.45);
      const halfway=await sample();
      const clipped=await motion.locator('svg').evaluate(svgElement=>{
        const svg=svgElement as SVGSVGElement;
        const inverse=svg.getCTM()!.inverse();
        return [...svg.querySelectorAll('path')].filter(path=>{
          const box=path.getBBox();const matrix=inverse.multiply(path.getCTM()!);
          const corners=[[box.x,box.y],[box.x+box.width,box.y],[box.x,box.y+box.height],[box.x+box.width,box.y+box.height]].map(([x,y])=>new DOMPoint(x,y).matrixTransform(matrix));
          return corners.some(p=>p.x < -1 || p.y < -1 || p.x > svg.viewBox.baseVal.width+1 || p.y > svg.viewBox.baseVal.height+1);
        }).map(path=>path.dataset.sourceIndex);
      });
      expect(clipped).toEqual([]);
      expect(halfway.middle).not.toBe(closed.middle);
      await page.evaluate(y=>scrollTo({top:y-60,behavior:'instant'}),originalTop);
      await expect(motion).toHaveAttribute('data-scroll-progress','1.000');
      const opened=await sample();
      expect(await annotationOpacity()).toEqual(Array(12).fill('1'));
      expect(opened.upper).toBe(closed.upper);
      expect(opened.markerTransforms).toEqual(closed.markerTransforms);
      expect(Math.abs(await section.locator('h2').evaluate(e=>e.getBoundingClientRect().top+scrollY)-textTop)).toBeLessThan(1);
      expect(await motion.locator('path').evaluateAll(ps=>ps.map(p=>p.getAttribute('d')))).toEqual(expected);
      await page.evaluate(y=>scrollTo({top:y-900,behavior:'instant'}),originalTop);
      await expect(motion).toHaveAttribute('data-scroll-progress','0.000');
      expect((await sample()).middle).toBe(closed.middle);
      expect(await annotationOpacity()).toEqual(Array(12).fill('0'));
    }
  });
}

test('Solutions reduced motion and mobile retain static artwork without loading service animation chunks',async({page})=>{
  const requests:string[]=[];
  page.on('request',r=>requests.push(r.url()));
  await page.setViewportSize({width:1440,height:1000});
  await page.goto('/solutions');
  await page.locator('.service-detail').last().scrollIntoViewIfNeeded();
  await expect(page.locator('.service-motion')).toHaveCount(0);
  expect(requests.filter(url=>/ServiceArtwork/.test(url))).toEqual([]);
  await page.emulateMedia({reducedMotion:'no-preference'});
  await page.setViewportSize({width:414,height:1000});
  await expect(page.locator('.service-detail-artwork').first()).toBeHidden();
  await expect(page.locator('.service-motion')).toHaveCount(0);
});

test('service artwork is deferred, returns to static on preference change, and has no idle updates',async({page})=>{
  await page.emulateMedia({reducedMotion:'no-preference'});
  await page.setViewportSize({width:1440,height:1000});
  await page.goto('/solutions');
  await expect(page.locator('.service-motion')).toHaveCount(0);
  await page.locator('.service-detail-artwork').first().scrollIntoViewIfNeeded();
  const motion=page.locator('.service-motion').first();
  await expect(motion).toBeAttached();
  await expect.poll(()=>motion.getAttribute('data-scroll-progress')).not.toBeNull();
  await page.waitForTimeout(400);
  const mutations=await motion.evaluate(async e=>{
    let changes=0;const observer=new MutationObserver(records=>changes+=records.length);
    observer.observe(e,{attributes:true,subtree:true});
    await new Promise(resolve=>setTimeout(resolve,350));observer.disconnect();return changes;
  });
  expect(mutations).toBe(0);
  await page.emulateMedia({reducedMotion:'reduce'});
  await expect(page.locator('.service-motion')).toHaveCount(0);
  await expect(page.locator('.service-artwork-slot .svg-artwork').first()).toBeVisible();
});
