import {test,expect} from '@playwright/test';
for(const width of [320,414,601,900,1440,1920])test(`Solutions Figma grid, spacing and CTA padding at ${width}`,async({page})=>{
 await page.setViewportSize({width,height:1000});await page.goto('/solutions');await page.evaluate(()=>document.fonts.ready);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBe(width);
 for(const action of await page.locator('.solutions-introduction .primary-action,.solutions-scoping-actions>div>.primary-action,.solutions-page .conversion-action').all()){
  if(!await action.isVisible())continue;
  const m=await action.evaluate(e=>{const r=e.getBoundingClientRect(),label=e.querySelector('span')!.getBoundingClientRect(),arrow=e.querySelector('.action-arrow')!.getBoundingClientRect(),s=getComputedStyle(e);return{left:label.left-r.left,right:r.right-arrow.right,padding:parseFloat(s.paddingLeft),rightPadding:parseFloat(s.paddingRight)};});
  expect(m.padding).toBeCloseTo(m.rightPadding,1);expect(m.left).toBeCloseTo(m.padding,1);expect(m.right).toBeCloseTo(m.padding,1);
 }
 if(width<=600){for(const section of await page.locator('.service-detail').all())await expect(section).toHaveCSS('padding-top','40px');}
 else{
  const x=await page.evaluate(()=>({intro:document.querySelector('.solutions-introduction-detail')!.getBoundingClientRect().left,service:document.querySelector('.service-detail-copy')!.getBoundingClientRect().left}));
  expect(Math.abs(x.intro-x.service)).toBeLessThan(1);
 }
 if(width===1440){
  const gap=await page.locator('.solutions-scoping-actions>div>p').first().evaluate(e=>e.nextElementSibling!.getBoundingClientRect().top-e.getBoundingClientRect().bottom);expect(gap).toBeCloseTo(20,0);
  const heading=await page.locator('.solutions-comparison .section-heading h2').boundingBox();expect(heading!.width).toBeCloseTo(660,0);
 }
});
for(const width of [320,414,1440])test(`Copyright Steel tint color and unclipped text at ${width}`,async({page})=>{
 await page.setViewportSize({width,height:1000});await page.goto('/solutions');await page.evaluate(()=>document.fonts.ready);
 const copyright=page.locator('.copyright');await expect(copyright).toHaveCSS('color','rgb(125, 135, 140)');
 expect(await copyright.evaluate(e=>{const r=e.getBoundingClientRect();const range=document.createRange();range.selectNodeContents(e);const text=range.getBoundingClientRect();return text.top>=r.top&&text.bottom<=r.bottom;})).toBe(true);
});
