import {test,expect} from '@playwright/test';
for(const width of [320,375,414,900,1440])test(`full-screen dialogs preserve controls and scrolling ${width}`,async({page})=>{
 await page.setViewportSize({width,height:568});
 await page.addInitScript(()=>Object.defineProperty(navigator,'clipboard',{value:{writeText:async()=>{}}}));
 await page.goto('/privacy-notice');const url=page.url();
 for(const [triggerSelector,dialogSelector] of [['footer [data-contact-modal]','.contact-dialog'],['footer .privacy-trigger','.privacy-dialog']]){
  const trigger=page.locator(triggerSelector);await trigger.click();const modal=page.locator(dialogSelector);await expect(modal).toBeVisible();await expect(page).toHaveURL(url);
  const fit=await modal.evaluate(e=>{const r=e.getBoundingClientRect(),c=e.querySelector('.fullscreen-dialog-container')!.getBoundingClientRect();return{x:r.x,y:r.y,w:r.width,h:r.height,viewport:[innerWidth,innerHeight],overflow:e.scrollWidth>e.clientWidth,radius:getComputedStyle(e).borderRadius,center:Math.abs(c.left+(c.width/2)-innerWidth/2)};});
  expect(fit.x).toBe(0);expect(fit.y).toBe(0);expect(fit.w).toBe(fit.viewport[0]);expect(fit.h).toBe(fit.viewport[1]);expect(fit.overflow).toBe(false);expect(fit.radius).toBe('0px');expect(fit.center).toBeLessThan(1);
  await page.mouse.click(2,2);
  if(width>600){await expect(modal).not.toBeVisible();await trigger.click();}else await expect(modal).toBeVisible();
  if(dialogSelector==='.contact-dialog'){
   await modal.getByRole('button',{name:'Copy email address',exact:true}).click();await expect(modal.getByRole('status')).toHaveText('Copied');
   await modal.getByRole('button',{name:'Close',exact:true}).click();
  }else{
   await modal.getByRole('switch',{name:'Analytics',exact:true}).check();await modal.getByRole('button',{name:'Save choices',exact:true}).click();
   expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('ratioclub_privacy_v1')!).analytics)).toBe(true);
  }
  await expect(modal).not.toBeVisible();await expect(trigger).toBeFocused();
  await trigger.click();await page.keyboard.press('Escape');await expect(modal).not.toBeVisible();await expect(trigger).toBeFocused();
 }
});
