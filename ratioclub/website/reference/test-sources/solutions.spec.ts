import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

for (const width of [414, 600, 601, 900, 1440, 1920]) {
  test(`Solutions preserves its composition at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1000 });
    const videos: string[] = [];
    page.on('request', request => { if (/\.mp4(?:\?|$)/.test(request.url())) videos.push(request.url()); });
    await page.goto('/solutions');
    await page.evaluate(() => document.fonts.ready);
    await expect(page.getByRole('heading', { name: 'Solutions', exact: true })).toBeVisible();
    await expect(page).toHaveTitle('Solutions — Ratioclub');
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(width);
    expect((await page.locator('.subpage-hero').boundingBox())!.height).toBeLessThan(1000);
    await expect(page.locator('video')).toHaveCount(0);
    expect(videos).toEqual([]);
    await expect(page.locator('.service-detail')).toHaveCount(3);
    for (const section of await page.locator('.service-detail').all()) {
      await expect(section.locator('li')).toHaveCount(4);
      if (width <= 600) await expect(section.locator('figure')).toBeHidden();
      else {
        await section.locator('figure').scrollIntoViewIfNeeded();
        const img = section.locator('img');
        await expect.poll(() => img.evaluate(e => (e as HTMLImageElement).naturalWidth)).toBeGreaterThan(0);
        const geometry = await section.locator('.svg-artwork').evaluate(e => { const r=e.getBoundingClientRect(); const i=e.querySelector('img')!; return { slot:r.width/r.height,source:Number(i.getAttribute('width'))/Number(i.getAttribute('height')) }; });
        expect(geometry.slot).toBeCloseTo(geometry.source, 2);
      }
    }
    await expect(page.getByText('Final Conversion & Scoping Banner', { exact: true })).toHaveCount(0);
    if (width <= 600) {
      const cells=await page.locator('.solutions-comparison-table tbody th').evaluateAll(elements => elements.map(e => e.getBoundingClientRect().width));
      expect(cells.every(w => w > width * .7)).toBe(true);
    }
  });
}

test('Solutions menu, local booking, direct refresh and history work', async ({ page }) => {
  await page.goto('/solutions');
  await page.getByRole('button', { name:'Open navigation' }).click();
  await expect(page.locator('#expanded-navigation')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('button', { name:'Open navigation' })).toBeFocused();
  await page.getByRole('link', { name:'Talk to FDE', exact:true }).click();
  await expect(page.getByRole('dialog',{name:'Contact',exact:true})).toBeVisible();
  await page.keyboard.press('Escape');
  await page.locator('.brand-link').click();
  await expect(page.getByRole('heading', { name:/Enterprise AWS/ })).toBeVisible();
  await page.goBack();
  await expect(page.getByRole('heading', { name:'Solutions', exact:true })).toBeVisible();
  await page.reload();
  await expect(page.getByRole('heading', { name:'Solutions', exact:true })).toBeVisible();
  await expect(page.locator('#page-transition-cover')).toHaveCount(0);
});

for (const width of [414,1440]) {
  test(`Solutions accessibility at ${width}px`, async ({ page }) => {
    await page.setViewportSize({width,height:1000});
    await page.goto('/solutions');
    const result=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();
    expect(result.violations).toEqual([]);
  });
}

for (const width of [414, 600, 601, 900, 1440]) {
  test(`Solutions and Index share closed and open header geometry at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height:1000 });
    const measure = () => page.evaluate(() => Object.fromEntries(
      ['.site-header', '.header-row', '.brand-link', '.menu-toggle', '.expanded-navigation', '.expanded-navigation ul'].map(selector => {
        const element=document.querySelector(selector)!;
        const rect=element.getBoundingClientRect();
        return [selector, { x:rect.x, width:rect.width, height:rect.height }];
      })
    ));
    await page.goto('/');
    await page.evaluate(() => document.fonts.ready);
    const indexClosed=await measure();
    await page.getByRole('button',{name:'Open navigation'}).click();
    const indexOpen=await measure();
    await page.goto('/solutions');
    await page.evaluate(() => document.fonts.ready);
    expect(await measure()).toEqual(indexClosed);
    const header=await page.locator('.site-header').boundingBox();
    expect(header!.x).toBe(width > 600 ? 15 : 0);
    expect(header!.width).toBe(width > 600 ? width-30 : width);
    await page.getByRole('button',{name:'Open navigation'}).click();
    expect(await measure()).toEqual(indexOpen);
    await page.mouse.click(width / 2, 950);
    await expect(page.getByRole('button',{name:'Open navigation'})).toHaveAttribute('aria-expanded','false');
  });
}

test('shared CTA typography is identical on Index and Solutions through tablet widths', async ({ page }) => {
  for (const width of [414,601,900,1440]) {
    await page.setViewportSize({width,height:1000});
    const values=[];
    for (const route of ['/','/solutions']) {
      await page.goto(route);
      values.push(await page.locator(route==='/'?'.hero-copy .primary-action:not(.dialog-close)':'.solutions-introduction-action .primary-action:not(.dialog-close)').evaluate(e=>{
        const s=getComputedStyle(e);return {font:s.font,tracking:s.letterSpacing,padding:s.padding,color:s.color,background:s.backgroundColor};
      }));
    }
    expect(values[1]).toEqual(values[0]);
  }
  await page.getByRole('link',{name:'Request Collaboration',exact:true}).click();
  await expect(page.getByRole('dialog',{name:'Contact',exact:true})).toBeVisible();
  await expect(page.getByRole('heading',{name:'Contact',exact:true})).toBeVisible();
});

for(const width of [414,520,600]) {
  test(`Solutions introduction CTA keeps content padding at ${width}px`,async({page})=>{
    await page.setViewportSize({width,height:1000});await page.goto('/solutions');
    const fill=await page.locator('.subpage-introduction-action').evaluate(e=>{const button=e.querySelector('.primary-action')!,box=button.getBoundingClientRect(),label=button.querySelector('span')!.getBoundingClientRect(),arrow=button.querySelector('.action-arrow')!.getBoundingClientRect(),s=getComputedStyle(button);return {slot:e.getBoundingClientRect().width,button:box.width,left:label.left-box.left,right:box.right-arrow.right,pad:parseFloat(s.paddingLeft)};});
    expect(fill.button).toBeLessThanOrEqual(fill.slot);expect(fill.left).toBeCloseTo(fill.pad,1);expect(fill.right).toBeCloseTo(fill.pad,1);
  });
}

test('production HTML discovers all three brand fonts before the application module',async({request})=>{
  const response=await request.get('/solutions');const html=await response.text();
  expect((html.match(/rel="preload"[^>]+as="font"/g)||[]).length).toBe(3);
  expect(html.indexOf('rel="preload"')).toBeLessThan(html.indexOf('type="module"'));
});

for(const width of [900,1440,1920])test(`Solutions introduction matches approved desktop line breaks at ${width}`,async({page})=>{
 await page.setViewportSize({width,height:1000});await page.goto('/solutions');await page.evaluate(()=>document.fonts.ready);
 const lines=await page.locator('#solutions-introduction-title').evaluate(el=>{
  const walker=document.createTreeWalker(el,NodeFilter.SHOW_TEXT);const rows=new Map<number,string[]>();
  while(walker.nextNode()){const node=walker.currentNode;for(const match of node.textContent!.matchAll(/\S+/g)){const range=document.createRange();range.setStart(node,match.index!);range.setEnd(node,match.index!+match[0].length);const top=Math.round(range.getBoundingClientRect().top);rows.set(top,[...(rows.get(top)||[]),match[0]]);}}
  return [...rows.values()].map(words=>words.join(' '));
 });
 expect(lines).toEqual(['Production AI','Infrastructure & Inference','Engineering on AWS']);
});

for(const width of [320,414,900,1440,1920])test(`Scoping buttons have balanced content padding at ${width}`,async({page})=>{
 await page.setViewportSize({width,height:1000});await page.goto('/solutions');await page.evaluate(()=>document.fonts.ready);
 for(const action of await page.locator('.solutions-scoping-actions>div>.primary-action').all()){
  const measured=await action.evaluate(e=>{const box=e.getBoundingClientRect(),label=e.querySelector('span')!.getBoundingClientRect(),arrow=e.querySelector('.action-arrow')!.getBoundingClientRect(),s=getComputedStyle(e);return {left:label.left-box.left,right:box.right-arrow.right,padding:parseFloat(s.paddingLeft),paddingRight:parseFloat(s.paddingRight)};});
  expect(measured.padding).toBeGreaterThanOrEqual(14);
  expect(measured.paddingRight).toBeCloseTo(measured.padding,1);
  expect(measured.left).toBeCloseTo(measured.padding,1);
  expect(measured.right).toBeCloseTo(measured.padding,1);
 }
 expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBe(width);
});
