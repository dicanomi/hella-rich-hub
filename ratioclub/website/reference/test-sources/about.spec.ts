import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

for (const width of [414,600,601,900,1440,1920]) {
  test(`About composition and shared header at ${width}px`, async ({page}) => {
    await page.setViewportSize({width,height:1000});
    await page.goto('/solutions');
    await page.evaluate(()=>document.fonts.ready);
    const measure=()=>page.locator('.header-row').evaluate(e=>{const r=e.getBoundingClientRect();return {x:r.x,width:r.width,height:r.height};});
    const shared=await measure();
    await page.goto('/about');
    await page.evaluate(()=>document.fonts.ready);
    await expect(page).toHaveTitle('About Us — Ratioclub');
    expect(await measure()).toEqual(shared);
    expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBe(width);
    await expect(page.locator('video')).toHaveCount(0);
    await expect(page.locator('.about-feature-card')).toHaveCount(6);
    for(const grid of await page.locator('.about-card-grid').all()) {
      const boxes=await grid.locator('article').evaluateAll(es=>es.map(e=>{const r=e.getBoundingClientRect();return {x:r.x,y:r.y};}));
      if(width>600) expect(new Set(boxes.map(b=>b.y)).size).toBe(1);
      else expect(new Set(boxes.map(b=>b.x)).size).toBe(1);
    }
    await page.getByRole('button',{name:'Open navigation'}).click();
    await expect(page.locator('#expanded-navigation')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.getByRole('button',{name:'Open navigation'})).toBeFocused();
    await page.locator('.about-introduction-action .primary-action:not(.dialog-close)').click();
    await expect(page.getByRole('dialog',{name:'Contact',exact:true})).toBeVisible();
    await page.keyboard.press('Escape');
    await page.reload();
    await expect(page.getByRole('heading',{name:'About Us',exact:true})).toBeVisible();
    await expect(page.locator('#page-transition-cover')).toHaveCount(0);
  });
}
for(const width of [414,1440]) {
  test(`About accessibility at ${width}px`,async({page})=>{
    await page.setViewportSize({width,height:1000});
    await page.goto('/about');
    const results=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();
    expect(results.violations).toEqual([]);
  });
}

for(const width of [414,600,601,768,900,1100,1440,1920]) {
 test(`About 3D sizes and text tracks at ${width}px`,async({page})=>{
  await page.setViewportSize({width,height:1000});await page.goto('/about');await page.evaluate(()=>document.fonts.ready);
  await expect(page.locator('.wireframe-object--illustration')).toHaveCount(6);
  for(const grid of await page.locator('.about-card-grid').all()) {
   const cards=await grid.locator('article').evaluateAll(es=>es.map(e=>{
    const svg=e.querySelector('svg')!, box=svg.getBoundingClientRect(),r=svg.getBBox();
    return {heading:e.querySelector('h3')!.getBoundingClientRect().y,copy:e.querySelector(':scope>p')!.getBoundingClientRect().y,width:box.width,inside:r.x>=0&&r.y>=0&&r.x+r.width<=320&&r.y+r.height<=320};
   }));
   expect(cards.every(c=>c.inside&&c.width>100)).toBe(true);
   expect(Math.max(...cards.map(c=>c.width))-Math.min(...cards.map(c=>c.width))).toBeLessThan(1);
   if(width>600) for(const key of ['heading','copy'] as const) expect(Math.max(...cards.map(c=>c[key]))-Math.min(...cards.map(c=>c[key]))).toBeLessThan(1);
  }
  expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBe(width);
  const paths=await page.locator('.wireframe-object').evaluateAll(es=>es.map(e=>e.querySelector('path')!.getAttribute('d')));
  expect(new Set(paths).size).toBe(6);
 });
}
