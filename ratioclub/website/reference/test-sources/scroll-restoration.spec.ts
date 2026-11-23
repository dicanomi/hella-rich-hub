import {test,expect} from '@playwright/test';
for(const width of [375,1440]){
 for(const route of ['/','/solutions','/about','/contact','/privacy-notice','/terms-and-conditions','/not-a-page'])test(`refresh preserves reading position ${route} ${width}`,async({page})=>{
  await page.setViewportSize({width,height:800});
  await page.goto(route);await page.evaluate(async()=>{await document.fonts.ready;await new Promise<void>(resolve=>requestAnimationFrame(()=>requestAnimationFrame(()=>resolve())));});
  await page.evaluate(()=>scrollTo({top:Math.min(1400,(document.documentElement.scrollHeight-innerHeight)*.65),behavior:'instant'}));
  const before=await page.evaluate(()=>scrollY);expect(before).toBeGreaterThanOrEqual(0);
  await page.reload();await page.evaluate(async()=>{await document.fonts.ready;await new Promise<void>(resolve=>requestAnimationFrame(()=>requestAnimationFrame(()=>resolve())));});
  await expect.poll(()=>page.evaluate(()=>scrollY)).toBeGreaterThan(before-5);
  await page.waitForTimeout(300);
  expect(Math.abs(await page.evaluate(()=>scrollY)-before)).toBeLessThan(5);
 });
 test(`navigation, history and hash refresh ${width}`,async({page})=>{
  await page.setViewportSize({width,height:800});await page.goto('/');await page.evaluate(async()=>{await document.fonts.ready;await new Promise<void>(resolve=>requestAnimationFrame(()=>requestAnimationFrame(()=>resolve())));});
  await page.locator('.solution-overview-link').scrollIntoViewIfNeeded();
  const before=await page.evaluate(()=>scrollY);
  await page.locator('.solution-overview-link').click();
  await expect(page).toHaveURL(/\/solutions$/);await expect.poll(()=>page.evaluate(()=>scrollY)).toBe(0);
  await page.goBack();await expect.poll(()=>page.evaluate(()=>scrollY)).toBeGreaterThan(before-5);
  await page.goto('/solutions#service-inference-title');await page.evaluate(async()=>{await document.fonts.ready;await new Promise<void>(resolve=>requestAnimationFrame(()=>requestAnimationFrame(()=>resolve())));});
  await expect.poll(()=>page.locator('#service-inference-title').evaluate(e=>Math.abs(e.getBoundingClientRect().top))).toBeLessThan(26);
  await page.evaluate(()=>scrollBy({top:400,behavior:'instant'}));const hashPosition=await page.evaluate(()=>scrollY);
  await page.reload();await page.evaluate(async()=>{await document.fonts.ready;await new Promise<void>(resolve=>requestAnimationFrame(()=>requestAnimationFrame(()=>resolve())));});
  await expect.poll(()=>page.evaluate(()=>scrollY)).toBeGreaterThan(hashPosition-5);
  await page.waitForTimeout(300);expect(Math.abs(await page.evaluate(()=>scrollY)-hashPosition)).toBeLessThan(5);
 });
}
