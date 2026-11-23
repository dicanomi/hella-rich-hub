import {test,expect} from '@playwright/test';
const key='ratioclub_privacy_v1';
for(const width of[375,1440])test(`optional preference switches save, reject and discard without tracking ${width}`,async({page})=>{
 await page.setViewportSize({width,height:1000});const posts:string[]=[],external:string[]=[];
 page.on('request',r=>{if(r.method()==='POST')posts.push(r.url());if(!r.url().startsWith('http://127.0.0.1:5191/')&&!r.url().startsWith('data:'))external.push(r.url());});
 await page.goto('/privacy-notice');const trigger=page.locator('.legal-privacy-choices .privacy-trigger');await trigger.click();
 const modal=page.getByRole('dialog',{name:'Privacy Choices'}),analytics=modal.getByRole('switch',{name:'Analytics',exact:true}),marketing=modal.getByRole('switch',{name:'Marketing and sharing',exact:true});
 await expect(modal.getByRole('switch',{name:'Strictly necessary'})).toBeDisabled();
 await expect(analytics).toBeEnabled();await expect(marketing).toBeEnabled();await expect(analytics).not.toBeChecked();await expect(marketing).not.toBeChecked();
 await analytics.focus();await page.keyboard.press('Space');await expect(analytics).toBeChecked();await marketing.check();
 expect(await page.evaluate(k=>localStorage.getItem(k),key)).toBeNull();
 await modal.getByRole('button',{name:'Save choices',exact:true}).click();await expect(modal).not.toBeVisible();
 expect(await page.evaluate(k=>JSON.parse(localStorage.getItem(k)!),key)).toMatchObject({version:1,necessary:true,analytics:true,marketing:true});
 await page.reload();await trigger.click();await expect(analytics).toBeChecked();await expect(marketing).toBeChecked();
 await analytics.uncheck();await page.keyboard.press('Escape');await expect(modal).not.toBeVisible();await trigger.click();await expect(analytics).toBeChecked();
 await modal.getByRole('button',{name:'Reject optional',exact:true}).click();await expect(modal).not.toBeVisible();await trigger.click();await expect(analytics).not.toBeChecked();await expect(marketing).not.toBeChecked();
 expect(await page.evaluate(k=>JSON.parse(localStorage.getItem(k)!),key)).toMatchObject({necessary:true,analytics:false,marketing:false});
 expect(posts).toEqual([]);expect(external).toEqual([]);expect(await page.context().cookies()).toEqual([]);
});

test('GPC overrides a saved marketing preference; DNT overrides both',async({page})=>{
 await page.addInitScript(({key})=>{
  localStorage.setItem(key,JSON.stringify({version:1,necessary:true,analytics:true,marketing:true,gpc:false,dnt:false,timestamp:new Date().toISOString(),expiresAt:new Date(Date.now()+86400000).toISOString()}));
  Object.defineProperty(navigator,'globalPrivacyControl',{value:true,configurable:true});
 },{key});
 await page.goto('/privacy-notice');const trigger=page.locator('.legal-privacy-choices .privacy-trigger');await trigger.click();
 const modal=page.getByRole('dialog',{name:'Privacy Choices'}),analytics=modal.getByRole('switch',{name:'Analytics',exact:true}),marketing=modal.getByRole('switch',{name:'Marketing and sharing',exact:true});
 await expect(analytics).toBeChecked();await expect(marketing).not.toBeChecked();await expect(marketing).toBeDisabled();
 await modal.getByRole('button',{name:'Save choices',exact:true}).click();await expect(modal).not.toBeVisible();
 expect(await page.evaluate(k=>JSON.parse(localStorage.getItem(k)!),key)).toMatchObject({analytics:true,marketing:false,gpc:true});
 await page.evaluate(()=>Object.defineProperty(navigator,'doNotTrack',{value:'1',configurable:true}));await trigger.click();
 await expect(analytics).not.toBeChecked();await expect(analytics).toBeDisabled();await expect(marketing).not.toBeChecked();await expect(marketing).toBeDisabled();
});

test('storage failure keeps the modal open with an honest error',async({page})=>{
 await page.addInitScript(()=>{Storage.prototype.setItem=()=>{throw new Error('Storage unavailable');};});
 await page.goto('/privacy-notice');await page.locator('.legal-privacy-choices .privacy-trigger').click();
 const modal=page.getByRole('dialog',{name:'Privacy Choices'});await modal.getByRole('switch',{name:'Analytics',exact:true}).check();await modal.getByRole('button',{name:'Save choices',exact:true}).click();
 await expect(modal).toBeVisible();await expect(modal.getByRole('status')).toContainText('could not save');
});
