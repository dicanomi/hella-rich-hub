import {test,expect} from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

for(const width of [320,414,900,1440])test(`Contact modal copy states, geometry and keyboard ${width}`,async({page})=>{
 await page.setViewportSize({width,height:1000});
 await page.addInitScript(()=>Object.defineProperty(navigator,'clipboard',{value:{writeText:async(value:string)=>{Object.assign(window,{copiedEmail:value});}}}));
 await page.goto('/about');await page.evaluate(()=>document.fonts.ready);
 const trigger=page.locator('footer [data-contact-modal]');await trigger.click();
 const modal=page.getByRole('dialog',{name:'Contact',exact:true});await expect(modal).toBeVisible();await expect(page).toHaveURL(/\/about$/);
 const fit=await modal.evaluate(e=>{const s=getComputedStyle(e);return{width:e.getBoundingClientRect().width,overflow:e.scrollWidth>e.clientWidth,bg:s.backgroundColor,radius:s.borderRadius};});
 expect(fit.width).toBe(width);expect(fit.overflow).toBe(false);expect(fit.bg).toBe('rgb(23, 31, 35)');expect(fit.radius).toBe('0px');
 const row=page.locator('.contact-copy-row'),before=await row.boundingBox();
 for(const name of ['Copy hello@ratioclub.com','Copy email address']){
  await modal.getByRole('button',{name,exact:true}).click();await expect(modal.getByRole('status')).toHaveText('Copied');
  expect(await page.evaluate(()=>(window as unknown as {copiedEmail:string}).copiedEmail)).toBe('hello@ratioclub.com');
  expect(await row.boundingBox()).toEqual(before);
 }
 for(let i=0;i<5;i++){await page.keyboard.press('Tab');expect(await page.evaluate(()=>Boolean(document.activeElement?.closest('.contact-dialog')))).toBe(true);}
 await page.keyboard.press('Escape');await expect(modal).not.toBeVisible();await expect(trigger).toBeFocused();
 await trigger.click();await expect(modal.getByRole('status')).toHaveText('');
 const violations=(await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze()).violations;expect(violations).toEqual([]);
});

test('all contact entry points open the dialog; Contact route remains available',async({page})=>{
 for(const route of ['/','/solutions','/about','/contact','/terms-and-conditions','/privacy-notice','/missing']){
  await page.goto(route);await page.evaluate(()=>document.fonts.ready);
  await expect(page.locator('a[href="/contact"]')).toHaveCount(0);
  for(const link of await page.locator('[data-contact-modal]:not(.expanded-navigation *)').all()){
   await link.click();await expect(page.getByRole('dialog',{name:'Contact',exact:true})).toBeVisible();
   await page.keyboard.press('Escape');
  }
  const menu=page.getByRole('button',{name:'Open navigation',exact:true});await menu.click();
  await page.locator('.expanded-navigation [data-contact-modal]').click();
  await expect(page.getByRole('dialog',{name:'Contact',exact:true})).toBeVisible();
  await expect(menu).toHaveAttribute('aria-expanded','false');await page.keyboard.press('Escape');await expect(menu).toBeFocused();
 }
 await page.goto('/contact');await expect(page.getByRole('heading',{name:'Contact',level:1})).toBeVisible();await expect(page.getByLabel('Message',{exact:true})).toBeVisible();
});

test('copy failure is honest and successful feedback expires',async({page})=>{
 await page.addInitScript(()=>{
  Object.defineProperty(navigator,'clipboard',{value:{writeText:async()=>{throw new Error('Denied');}}});
  document.execCommand=()=>false;
 });
 await page.goto('/');await page.locator('.hero-actions [data-contact-modal]').click();
 await page.getByRole('button',{name:'Copy email address',exact:true}).click();await expect(page.locator('.contact-copy-feedback')).toHaveText('Copy failed');
 await expect(page.locator('.contact-copy-feedback')).toHaveText('',{timeout:4000});
});

test('desktop backdrop dismisses both dialogs; inside clicks and drags do not',async({page})=>{
 await page.setViewportSize({width:1440,height:1200});await page.goto('/privacy-notice');
 for(const [triggerSelector,dialogSelector] of [['footer [data-contact-modal]','.contact-dialog'],['.legal-privacy-choices .privacy-trigger','.privacy-dialog']]){
  const trigger=page.locator(triggerSelector);await trigger.click();const modal=page.locator(dialogSelector);await expect(modal).toBeVisible();
  const box=(await modal.locator('.fullscreen-dialog-container').boundingBox())!;
  await page.mouse.click(box.x+5,box.y+5);await expect(modal).toBeVisible();
  await page.mouse.move(box.x+5,box.y+5);await page.mouse.down();await page.mouse.move(5,5);await page.mouse.up();await expect(modal).toBeVisible();
  await page.mouse.click(5,5);await expect(modal).not.toBeVisible();await expect(trigger).toBeFocused();
 }
 expect(await page.evaluate(()=>localStorage.getItem('ratioclub_privacy_v1'))).toBeNull();
});

for(const reducedMotion of ['no-preference','reduce'] as const)test(`both dialogs fade only and respect ${reducedMotion}`,async({page})=>{
 await page.emulateMedia({reducedMotion});await page.setViewportSize({width:1440,height:1200});await page.goto('/privacy-notice');
 for(const [triggerSelector,dialogSelector,closeSelector] of [['footer [data-contact-modal]','.contact-dialog','.contact-close'],['.legal-privacy-choices .privacy-trigger','.privacy-dialog','.privacy-close']]){
  await page.locator(triggerSelector).click();const modal=page.locator(dialogSelector);
  const info=await modal.evaluate(e=>({transform:getComputedStyle(e).transform,animations:e.getAnimations().map(a=>({duration:a.effect?.getTiming().duration,keys:(a.effect as KeyframeEffect).getKeyframes()}))}));
  expect(info.transform).toBe('none');
  if(reducedMotion==='reduce')expect(info.animations).toEqual([]);
  else{expect(info.animations.some(a=>a.duration===180)).toBe(true);expect(info.animations.every(a=>a.keys.every(k=>!('transform' in k)))).toBe(true);}
  await modal.locator(closeSelector).click();await expect(modal).not.toBeVisible();
 }
});

test('real Chromium clipboard receives the email',async({page,context,browserName})=>{
 test.skip(browserName!=='chromium','WebKit clipboard success/failure covered with controlled permissions above.');
 await context.grantPermissions(['clipboard-read','clipboard-write']);await page.goto('/');await page.locator('.hero-actions [data-contact-modal]').click();
 await page.getByRole('button',{name:'Copy email address',exact:true}).click();
 await expect(page.locator('.contact-copy-feedback')).toHaveText('Copied');
 expect(await page.evaluate(()=>navigator.clipboard.readText())).toBe('hello@ratioclub.com');
});
