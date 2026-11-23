import {test,expect} from '@playwright/test';
for(const width of [375,900,1440])for(const reducedMotion of ['no-preference','reduce'] as const)test(`header turn ${width} ${reducedMotion}`,async({page})=>{
 await page.setViewportSize({width,height:1000});await page.emulateMedia({reducedMotion});
 for(const route of ['/solutions','/about','/contact']){
  await page.goto(route);
  const image=page.locator('.subpage-hero-artwork img');
  await image.evaluate(async(e:HTMLImageElement)=>{e.loading='eager';await e.decode();});
  if(width<=600){await expect(image).toBeHidden();continue;}
  const target=page.locator('.subpage-hero-artwork .svg-artwork');
  if(reducedMotion==='reduce')await expect(target).toHaveCSS('transform','none');
  else {
   await expect.poll(()=>target.evaluate(e=>getComputedStyle(e).transform)).not.toBe('none');
   const first=await target.evaluate(e=>getComputedStyle(e).transform);
   await page.waitForTimeout(250);
   expect(await target.evaluate(e=>getComputedStyle(e).transform)).not.toBe(first);
   await expect(target).toHaveCSS('transform','none',{timeout:2200});
   await page.waitForTimeout(150);await expect(target).toHaveCSS('transform','none');
  }
  expect(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth)).toBe(false);
 }
 if(reducedMotion==='no-preference'&&width>600){
  await page.locator('footer a[href="/about"]').click();
  await expect.poll(()=>page.locator('.subpage-hero-artwork .svg-artwork').evaluate(e=>getComputedStyle(e).transform)).not.toBe('none');
 }
});
