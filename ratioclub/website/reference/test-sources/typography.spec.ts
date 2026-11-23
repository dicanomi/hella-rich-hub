import {test,expect} from '@playwright/test';
for(const route of ['/','/solutions','/about']) {
 test(`body copy protects final pairs across widths on ${route}`,async({page})=>{
  for(const width of [414,600,601,768,900,1100,1440,1920]) {
   await page.setViewportSize({width,height:1000});await page.goto(route);await page.evaluate(()=>document.fonts.ready);
   await expect(page.locator('.text-tail').first()).toBeAttached();
   expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBe(width);
   await expect(page.locator('h1 .text-tail,h2 .text-tail,h3 .text-tail')).toHaveCount(0);
   const result=await page.locator('.text-tail').evaluateAll(es=>es.filter(e=>{
    const rect=e.getBoundingClientRect();return rect.width>0&&rect.width>e.parentElement!.getBoundingClientRect().width+1;
   }).map(e=>e.textContent));
   expect(result).toEqual([]);
  }
 });
}
