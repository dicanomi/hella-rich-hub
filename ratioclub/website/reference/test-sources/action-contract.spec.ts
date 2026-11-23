import {test,expect} from '@playwright/test';
for(const width of[320,414,600,601,900,1100,1440,1920])test(`CTA typography and boxed padding share one contract at ${width}`,async({page})=>{
 await page.setViewportSize({width,height:1100});const styles=new Set<string>();const boxes=new Set<string>();
 for(const route of['/','/solutions','/about','/contact','/privacy-notice','/terms-and-conditions','/missing']){
  await page.goto(route);await page.evaluate(()=>document.fonts.ready);
  if(route==='/privacy-notice')await page.locator('.site-footer .privacy-trigger').click();
  for(const action of await page.locator('.primary-action,.conversion-action,.text-action,.solution-card-action').all()){
   if(!await action.isVisible())continue;
   const m=await action.evaluate(e=>{const s=getComputedStyle(e);return{type:[s.fontFamily,s.fontSize,s.fontWeight,s.lineHeight,s.letterSpacing,s.textTransform],box:[s.paddingTop,s.paddingRight,s.paddingBottom,s.paddingLeft],boxed:e.matches('.primary-action,.conversion-action')};});
   expect(m.type[1]).toBe('16px');expect(m.type[2]).toBe('600');styles.add(JSON.stringify(m.type));
   if(m.boxed){boxes.add(JSON.stringify(m.box));expect(new Set(m.box).size).toBe(1);expect(parseFloat(m.box[0])).toBeGreaterThanOrEqual(14);}
  }
  for(const nav of await page.locator('.navigation-button').all())await expect(nav).toHaveCSS('font-weight','400');
  expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBe(width);
 }
 expect(styles.size).toBe(1);expect(boxes.size).toBe(1);
});
