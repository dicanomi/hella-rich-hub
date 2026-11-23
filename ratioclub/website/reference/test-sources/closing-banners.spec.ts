import {test,expect} from '@playwright/test';
for(const route of ['/','/solutions','/about'])test(`closing banner keeps its content and sizing through resize on ${route}`,async({page})=>{
 await page.setViewportSize({width:1440,height:1000});await page.goto(route);await page.evaluate(()=>document.fonts.ready);
 const banner=page.locator('.conversion-banner');await expect(banner).toHaveCount(1);
 const copy=async()=>({heading:await banner.locator('h2').textContent(),body:await banner.locator('.conversion-copy p').textContent(),actions:await banner.locator('a').allTextContents()});
 const original=await copy();
 if(route==='/about'){expect(original.heading).toBe('Ready to Scale Reliable, Cost-Effective AI on AWS?');expect(original.actions).toEqual(['Book an Infrastructure Audit','Connect with Alliance Team']);}
 else{expect(original.heading).toBe('Deploy Production AI on AWS with Guaranteed Velocity');expect(original.actions).toEqual(['COME SAY HI!']);}
 for(const width of [320,414,600,601,768,900,1024,1100,1101,1440,1920]){
  await page.setViewportSize({width,height:1000});await expect(banner).toHaveCount(1);expect(await copy()).toEqual(original);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBe(width);
  const heading=banner.locator('h2');
  if(width>600)expect(await heading.evaluate(el=>{const r=document.createRange();r.selectNodeContents(el);return new Set([...r.getClientRects()].map(r=>Math.round(r.top))).size;})).toBe(2);
  for(const action of await banner.locator('a').all()){
   await expect(action).toHaveAttribute('href','#contact');
   const m=await action.evaluate(el=>{const b=el.getBoundingClientRect(),s=getComputedStyle(el),label=el.firstElementChild!,arrow=el.lastElementChild!,r=document.createRange();r.selectNodeContents(label);return {left:label.getBoundingClientRect().left-b.left,right:b.right-arrow.getBoundingClientRect().right,pad:parseFloat(s.paddingLeft),rightPad:parseFloat(s.paddingRight),font:s.fontFamily,size:s.fontSize,caps:s.textTransform,radius:s.borderRadius,lines:new Set([...r.getClientRects()].map(r=>Math.round(r.top))).size};});
   expect(m.font).toContain('Roboto Mono');expect(m.size).toBe('16px');expect(m.caps).toBe('uppercase');expect(m.radius).toBe('0px');
   expect(Math.abs(m.left-m.pad)).toBeLessThan(1);expect(Math.abs(m.right-m.rightPad)).toBeLessThan(1);
   if(width>600)expect(m.lines).toBe(1);
  }
  if(route==='/about'){
   const edges=await banner.locator('.conversion-actions').evaluate(el=>({box:el.querySelector('.conversion-action')!.getBoundingClientRect().right,arrow:el.querySelector('.text-action .action-arrow')!.getBoundingClientRect().right}));expect(Math.abs(edges.box-edges.arrow)).toBeLessThan(1);
  }
  // Also cover direct/refresh rendering, rather than resize behavior alone.
  await page.reload();await page.evaluate(()=>document.fonts.ready);expect(await copy()).toEqual(original);
 }
 if(route==='/solutions'){
  await expect(page.locator('#solutions-scoping-title')).toHaveText('Ready to Validate and Scale Your AI Workloads on AWS?');
  await expect(page.locator('.solutions-scoping-actions a')).toHaveText(['Talk to FDE','Request Collaboration']);
 }
});
