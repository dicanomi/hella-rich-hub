import {test,expect} from '@playwright/test';
for(const width of [414,1440])test(`all six About objects rotate on scroll and retain hover at ${width}`,async({page})=>{
 test.setTimeout(90000);await page.setViewportSize({width,height:1000});await page.emulateMedia({reducedMotion:'no-preference'});await page.goto('/about');await page.mouse.move(0,0);
 const objects=page.locator('.about-feature-card .wireframe-object');await expect(objects).toHaveCount(6);
 for(const object of await objects.all()){
  await object.scrollIntoViewIfNeeded();await page.waitForTimeout(300);await expect(object).toHaveAttribute('data-animating','false');
  const card=object.locator('xpath=ancestor::article');const title=card.locator('h3');const position=()=>title.evaluate(e=>e.getBoundingClientRect().top+scrollY);const fixed=await position();
  const angle=async()=>Number(await object.getAttribute('data-angle')||0);const before=await angle();
  await page.evaluate(()=>scrollBy(0,70));await expect(object).toHaveAttribute('data-animating','true');await expect.poll(angle).toBeGreaterThan(before);await page.waitForTimeout(100);const coast=await angle();await page.waitForTimeout(120);expect(await angle()).toBeGreaterThan(coast);await expect(object).toHaveAttribute('data-animating','false');
  const open=await angle();await page.evaluate(()=>scrollBy(0,-70));await expect.poll(angle).toBeLessThan(open);await expect(object).toHaveAttribute('data-animating','false');
  expect(await position()).toBeCloseTo(fixed,1);
  const path=object.locator('path').first(),drawing=await path.getAttribute('d');await object.locator('.wireframe-hover-area').hover();await expect(path).not.toHaveAttribute('d',drawing!);await page.mouse.move(0,0);await expect(object).toHaveAttribute('data-animating','false');
 }
});
test('About objects stay static for reduced motion',async({page})=>{
 await page.goto('/about');const objects=page.locator('.about-feature-card .wireframe-object');await expect(objects).toHaveCount(6);
 for(const object of await objects.all()){
  await object.scrollIntoViewIfNeeded();const path=object.locator('path').first(),drawing=await path.getAttribute('d');await page.evaluate(()=>scrollBy(0,70));await object.locator('.wireframe-hover-area').hover();await expect(object).toHaveAttribute('data-animating','false');await expect(path).toHaveAttribute('d',drawing!);
 }
});
