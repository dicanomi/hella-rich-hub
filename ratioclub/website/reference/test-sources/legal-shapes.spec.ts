import {test,expect} from '@playwright/test';
for(const width of[375,600,900,1440])test(`legal shapes shuffle, static text and shared H1 ${width}`,async({page})=>{
 await page.setViewportSize({width,height:1000});await page.goto('/');const h1=await page.locator('h1').evaluate(e=>{const s=getComputedStyle(e);return[s.fontSize,s.fontWeight,s.lineHeight];});
 let previous='';
 for(const route of['/privacy-notice','/terms-and-conditions','/privacy-notice']){
  await page.goto(route);const row=page.locator('.legal-shape-row');await expect(row.locator('[data-shape]')).toHaveCount(3);
  const order=await row.locator('[data-shape]').evaluateAll(es=>es.map(e=>e.getAttribute('data-shape')));expect([...order].sort()).toEqual(['cubes','sphere','torus']);expect(order.join(',')).not.toBe(previous);previous=order.join(',');
  const ys=await row.locator('.legal-shape-slot').evaluateAll(es=>es.map(e=>e.getBoundingClientRect().top));expect(new Set(ys).size).toBe(1);
  expect(await page.locator('h1').evaluate(e=>{const s=getComputedStyle(e);return[s.fontSize,s.fontWeight,s.lineHeight];})).toEqual(h1);
  await expect(page.locator('.legal-letter-layer')).toHaveCount(0);await expect(page.locator('h1')).toHaveCSS('opacity','1');await expect(page.locator('.legal-reading-effective')).toHaveText('Effective date: awaiting approval');
  await expect(page.locator('.legal-reading-document')).toContainText('All wording is provisional');expect(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth)).toBe(false);
 }
});
test('legal wireframes use hover and scroll motion and honor reduced motion',async({page})=>{
 await page.setViewportSize({width:1440,height:1000});await page.emulateMedia({reducedMotion:'no-preference'});await page.goto('/privacy-notice');
 const shape=page.locator('.legal-shape-row [data-shape="torus"]'),path=shape.locator('path').first(),initial=await path.getAttribute('d');
 await shape.hover();await expect.poll(()=>path.getAttribute('d')).not.toBe(initial);await page.mouse.move(0,0);await page.waitForTimeout(800);
 const beforeScroll=await path.getAttribute('d');await page.mouse.wheel(0,150);await expect.poll(()=>path.getAttribute('d')).not.toBe(beforeScroll);
 await page.emulateMedia({reducedMotion:'reduce'});await page.waitForTimeout(100);const stopped=await path.getAttribute('d');await shape.hover();await page.mouse.wheel(0,50);await page.waitForTimeout(250);expect(await path.getAttribute('d')).toBe(stopped);
});
