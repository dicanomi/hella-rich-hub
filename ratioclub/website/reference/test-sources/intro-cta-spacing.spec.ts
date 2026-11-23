import {test,expect} from '@playwright/test';
for(const width of [320,414,600,601,768,900,1440,1920])test(`About and Solutions use the same paragraph-to-action gap at ${width}`,async({page})=>{
 await page.setViewportSize({width,height:1000});const gaps:number[]=[];
 for(const route of ['/about','/solutions']){
  await page.goto(route);await page.evaluate(()=>document.fonts.ready);
  const result=await page.locator('.subpage-introduction-columns').evaluate(el=>{
   const ps=Array.from(el.querySelectorAll(':scope > p')).map(p=>p.getBoundingClientRect());const button=el.querySelector('.subpage-introduction-action')!.getBoundingClientRect();
   return {actual:button.top-Math.max(...ps.map(p=>p.bottom)),gap:parseFloat(getComputedStyle(el).rowGap)};
  });
  expect(Math.abs(result.actual-result.gap)).toBeLessThan(1);gaps.push(result.gap);
 }
 expect(gaps[0]).toBeCloseTo(gaps[1],1);
});
