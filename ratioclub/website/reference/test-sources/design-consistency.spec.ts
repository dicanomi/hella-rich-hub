import {test,expect} from '@playwright/test';
const expectedOrder=['Solutions','About Us','Contact','Privacy Notice','Terms & Conditions','RatioClub','GitHub','LinkedIn'];
const routes=['/','/solutions','/about','/contact','/terms-and-conditions','/privacy-notice','/missing-page'];
for(const width of [320,414,1440])for(const route of routes)test(`${route} design system at ${width}`,async({page})=>{
 await page.setViewportSize({width,height:1000});await page.goto(route);await page.evaluate(()=>document.fonts.ready);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBe(width);
 for(const action of await page.locator('.primary-action,.conversion-action,.text-action').all()){
  if(!await action.isVisible())continue;
  const style=await action.evaluate(e=>{const s=getComputedStyle(e);return {font:s.fontFamily,size:s.fontSize,caps:s.textTransform,radius:s.borderRadius,decoration:s.textDecorationLine,left:s.paddingLeft,right:s.paddingRight,edgeAligned:e.matches(".conversion-actions>.text-action")};});
  expect(style.font).toContain('Roboto Mono');expect(style.size).toBe('16px');expect(style.caps).toBe('uppercase');expect(style.radius).toBe('0px');if(style.edgeAligned)expect(style.right).toBe("0px");else expect(style.left).toBe(style.right);expect(parseFloat(style.left)).toBeGreaterThanOrEqual(14);expect(style.decoration).toBe('none');
 }
 await page.getByRole('button',{name:'Open navigation',exact:true}).click();
 const nav=page.locator('#expanded-navigation');
 await expect(nav.getByRole('link',{name:'RatioClub',exact:false})).toHaveAttribute('href','/');
 expect(await nav.locator('.navigation-button').allTextContents()).toEqual(expectedOrder);
 const styles=await nav.locator('.navigation-button').evaluateAll(es=>es.map(e=>{const s=getComputedStyle(e);return[s.fontFamily,s.fontSize,s.paddingLeft,s.paddingRight,s.backgroundColor,s.borderRadius].join('|');}));
 expect(new Set(styles).size).toBe(1);
 await page.keyboard.press('Escape');
 const footer=page.locator('.footer-content');
 if(await footer.count()){
  expect(await footer.locator('.navigation-button').allTextContents()).toEqual(expectedOrder);
  const gap=await page.evaluate(()=>{const footer=document.querySelector('.footer-content')!.getBoundingClientRect();return document.querySelector('.footer-wordmark')!.getBoundingClientRect().top-footer.bottom;});
  expect(gap).toBeGreaterThanOrEqual(-1);
  const styles=await footer.locator('.navigation-button').evaluateAll(es=>es.map(e=>{const s=getComputedStyle(e);return[s.fontFamily,s.fontSize,s.paddingLeft,s.paddingRight,s.backgroundColor,s.borderRadius].join('|');}));expect(new Set(styles).size).toBe(1);
 }
 const opener=page.locator('button[aria-haspopup="dialog"]').first();
 if(await opener.count()){
  await opener.click();const dialog=page.locator('.privacy-dialog[open]');await expect(dialog).toHaveCSS('border-radius','15px');
  const close=dialog.getByRole('button',{name:'Close',exact:true});await expect(close).toHaveCSS('color','rgb(247, 247, 247)');await expect(close).toHaveCSS('outline-style','none');
  const padding=await close.evaluate(e=>getComputedStyle(e).paddingLeft);
  expect(padding).toBe(await close.evaluate(e=>{const probe=document.createElement('div');probe.style.padding='var(--action-padding)';e.parentElement!.append(probe);const value=getComputedStyle(probe).paddingLeft;probe.remove();return value;}));
  await close.click();
 }
});
