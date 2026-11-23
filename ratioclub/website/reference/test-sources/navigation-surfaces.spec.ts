import {test,expect} from '@playwright/test';
for(const width of[320,414,768,900,1440])test(`shared navigation surfaces follow Figma at ${width}`,async({page})=>{
 await page.setViewportSize({width,height:1000});
 for(const route of['/','/solutions','/about','/contact','/privacy-notice','/terms-and-conditions','/missing']){
  await page.goto(route);const toggle=page.getByRole('button',{name:'Open navigation'});
  await expect(toggle).toHaveCSS('width','44px');await expect(toggle).toHaveCSS('height','44px');await expect(toggle).toHaveCSS('border-radius','4px');
  for(const state of['closed','open']){
   if(state==='open')await toggle.click();
   const control=page.locator('.menu-toggle');const s=await control.evaluate(e=>{const s=getComputedStyle(e);return {fill:s.backgroundImage,shadow:s.boxShadow};});expect(s.fill).toContain('linear-gradient');expect(s.fill).toContain('rgb(3, 5, 5)');expect(s.shadow).toContain('inset');
   if(state==='open'){
    await expect(control).toHaveAttribute('aria-label','Close navigation');await expect(control).toHaveAttribute('aria-expanded','true');
    const menu=page.locator('#expanded-navigation');await expect(menu).toBeVisible();await expect(page.locator('.header-row')).toHaveCSS('background-color','rgb(23, 31, 35)');
    await expect(menu).toHaveCSS('background-image','none');await expect(menu).toHaveCSS('background-color','rgb(23, 31, 35)');
    await page.keyboard.press('Escape');await expect(control).toBeFocused();await expect(control).toHaveAttribute('aria-expanded','false');
   }
  }
  if(route!=='/'&&route!=='/missing')await expect(page.locator('.site-header')).toHaveCSS('background-color','rgb(23, 31, 35)');
 }
});
