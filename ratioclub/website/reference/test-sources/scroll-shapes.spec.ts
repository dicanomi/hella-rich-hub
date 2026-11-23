import {test,expect} from '@playwright/test';
for(const width of [414,1440])test(`feature shapes follow scroll direction and coast at ${width}`,async({page})=>{
 test.setTimeout(60000);await page.setViewportSize({width,height:1000});await page.emulateMedia({reducedMotion:'no-preference'});await page.goto('/');await page.mouse.move(0,0);
 const objects=page.locator('.feature-card .wireframe-object');await expect(objects).toHaveCount(4);
 for(const object of await objects.all()){
  await object.scrollIntoViewIfNeeded();await page.waitForTimeout(300);await expect(object).toHaveAttribute('data-animating','false');
  const card=object.locator('xpath=ancestor::article');const textTop=await card.locator('h3').evaluate(e=>e.getBoundingClientRect().top+scrollY);
  const angle=async()=>Number(await object.getAttribute('data-angle')||0);
  const before=await angle();await page.evaluate(()=>scrollBy(0,70));await expect(object).toHaveAttribute('data-animating','true');
  await expect.poll(angle).toBeGreaterThan(before);await page.waitForTimeout(100);const coast=await angle();await page.waitForTimeout(120);expect(await angle()).toBeGreaterThan(coast);
  await expect(object).toHaveAttribute('data-animating','false');const forward=await angle();
  await page.evaluate(()=>scrollBy(0,-70));await expect(object).toHaveAttribute('data-animating','true');await expect.poll(angle).toBeLessThan(forward);await expect(object).toHaveAttribute('data-animating','false');
  expect(await card.locator('h3').evaluate(e=>e.getBoundingClientRect().top+scrollY)).toBeCloseTo(textTop,1);
 }
});
test('reduced motion keeps scroll shapes static and offscreen motion stops',async({page})=>{
 await page.goto('/');const object=page.locator('.feature-card .wireframe-object').first();await object.scrollIntoViewIfNeeded();const path=object.locator('path').first();const initial=await path.getAttribute('d');
 await page.evaluate(()=>scrollBy(0,80));await page.waitForTimeout(250);await expect(path).toHaveAttribute('d',initial!);await expect(object).toHaveAttribute('data-animating','false');
 await page.emulateMedia({reducedMotion:'no-preference'});await page.waitForTimeout(300);await page.evaluate(()=>scrollBy(0,-60));await expect(object).toHaveAttribute('data-animating','true');
 await page.evaluate(()=>scrollTo(0,0));await expect(object).toHaveAttribute('data-animating','false');
});
