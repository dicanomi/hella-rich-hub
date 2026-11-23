import {test,expect} from '@playwright/test';
for(const width of [601,768,900,1440,1920]) test(`Core Solutions shared text tracks at ${width}px`,async({page})=>{
 await page.setViewportSize({width,height:1000});await page.goto('/');await page.evaluate(()=>document.fonts.ready);
 const rows=await page.locator('.solution-card').evaluateAll(es=>es.map(e=>({caption:e.querySelector('figcaption')!.getBoundingClientRect().y,body:e.querySelector(':scope > p')!.getBoundingClientRect().y,action:e.querySelector('.solution-card-action>span')!.getBoundingClientRect().y})));
 for(const field of ['caption','body','action'] as const) expect(Math.max(...rows.map(r=>r[field]))-Math.min(...rows.map(r=>r[field]))).toBeLessThan(1);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBe(width);
});
test('About 3D studies rotate, coast and stop and are integrated on About',async({page})=>{
 await page.emulateMedia({reducedMotion:'no-preference'});await page.goto('/about-wireframe-review');
 await expect(page.locator('.wireframe-object')).toHaveCount(6);
 const object=page.locator('.wireframe-object').first();await object.scrollIntoViewIfNeeded();
 await page.waitForTimeout(100);const before=await object.locator('path').first().getAttribute('d');
 await object.locator('.wireframe-hover-area').hover();await page.waitForTimeout(350);
 expect(await object.locator('path').first().getAttribute('d')).not.toBe(before);
 await page.mouse.move(0,0);await expect(object).toHaveAttribute('data-animating','false',{timeout:3000});
 const stopped=await object.locator('path').first().getAttribute('d');await page.waitForTimeout(200);
 expect(await object.locator('path').first().getAttribute('d')).toBe(stopped);
 await page.goto('/about');await expect(page.locator('.wireframe-object--illustration')).toHaveCount(6);
});

for(const width of [768,900,1440,1920])test(`Solutions text and captions share both column edges at ${width}`,async({page})=>{
 await page.setViewportSize({width,height:1000});await page.goto('/solutions');await page.evaluate(()=>document.fonts.ready);
 const rows=await page.locator('.service-detail').evaluateAll(es=>es.map(e=>{
  const edges=(selector:string)=>{const r=e.querySelector(selector)!.getBoundingClientRect();return {left:r.left,right:r.right};};
  return {copy:edges('.service-detail-copy'),caption:edges('figcaption'),number:edges('.service-detail-number')};
 }));
 for(const edge of ['left','right'] as const){
  expect(Math.abs(rows[0].copy[edge]-rows[1].caption[edge])).toBeLessThan(1);
  expect(Math.abs(rows[2].copy[edge]-rows[1].caption[edge])).toBeLessThan(1);
  expect(Math.abs(rows[0].caption[edge]-rows[1].copy[edge])).toBeLessThan(1);
 }
 expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBe(width);
});

for(const width of [601,900,1440,1920])test(`Solutions comparison and CTA groups share a right-column grid at ${width}`,async({page})=>{
 await page.setViewportSize({width,height:1000});await page.goto('/solutions');await page.evaluate(()=>document.fonts.ready);
 const lefts=await page.locator('.solutions-comparison-table thead th:last-child,.solutions-comparison-table tbody td:last-child,.solutions-scoping-actions>div>p,.solutions-scoping-actions>div>.primary-action').evaluateAll(es=>es.map(e=>e.getBoundingClientRect().left));
 expect(Math.max(...lefts)-Math.min(...lefts)).toBeLessThan(1);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBe(width);
});
