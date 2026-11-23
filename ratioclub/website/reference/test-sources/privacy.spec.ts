import {test,expect} from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
for(const width of [320,414,1440])test(`privacy controls ${width}`,async({page})=>{
 await page.setViewportSize({width,height:900});const external:string[]=[];
 page.on('request',req=>{if(!req.url().startsWith('http://127.0.0.1:5191/')&&!req.url().startsWith('data:'))external.push(req.url());});
 await page.goto('/');await expect(page.locator('.privacy-dialog')).not.toBeVisible();
 expect(await page.context().cookies()).toEqual([]);
 expect(await page.evaluate(()=>Object.keys(localStorage))).toEqual([]);
 const trigger=page.getByRole('button',{name:'Your privacy choices',exact:true});await trigger.click();
 const modal=page.getByRole('dialog',{name:'Privacy Choices'});await expect(modal).toBeVisible();
 await expect(modal.getByRole('switch',{name:'Strictly necessary'})).toBeChecked();
 for(const name of ['Analytics','Marketing and sharing']){await expect(modal.getByRole('switch',{name,exact:true})).not.toBeChecked();await expect(modal.getByRole('switch',{name,exact:true})).toBeEnabled();}
 for(let i=0;i<8;i++){await page.keyboard.press('Tab');expect(await page.evaluate(()=>Boolean(document.activeElement?.closest('.privacy-dialog')))).toBe(true);}
 await page.keyboard.press('Escape');await expect(modal).not.toBeVisible();await expect(trigger).toBeFocused();expect(await page.evaluate(()=>localStorage.getItem('ratioclub_privacy_v1'))).toBeNull();
 await trigger.click();await modal.getByRole('button',{name:'Reject optional',exact:true}).click();
 const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('ratioclub_privacy_v1')!));expect(saved).toMatchObject({version:1,necessary:true,analytics:false,marketing:false});expect(Date.parse(saved.expiresAt)).toBeGreaterThan(Date.now());
 await page.reload();await trigger.click();await expect(modal.getByText('Your preferences are saved. Tracking integrations remain disconnected.')).toBeVisible();
 await modal.getByRole('button',{name:'Close',exact:true}).click();
 expect(external).toEqual([]);expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBe(width);
});
test('GPC and DNT are honored without enabling integrations',async({page})=>{
 await page.addInitScript(()=>{Object.defineProperty(navigator,'globalPrivacyControl',{value:true});Object.defineProperty(navigator,'doNotTrack',{value:'1'});});
 await page.goto('/');await page.getByRole('button',{name:'Your privacy choices',exact:true}).click();
 await expect(page.getByText('Global Privacy Control (GPC) Signal Honored')).toBeVisible();await page.getByRole('button',{name:'Save choices'}).click();
 expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('ratioclub_privacy_v1')!))).toMatchObject({gpc:true,dnt:true,marketing:false,analytics:false});
});
test('privacy choices available on every page including 404',async({page})=>{
 for(const route of ['/','/solutions','/about','/contact','/privacy-notice','/terms-and-conditions','/missing']){
  await page.goto(route);await page.locator('.site-footer .privacy-trigger,.not-found-privacy .privacy-trigger').click();await expect(page.getByRole('dialog',{name:'Privacy Choices'})).toBeVisible();await page.keyboard.press('Escape');
 }
});

for(const width of [414,1440])test(`privacy modal accessibility ${width}`,async({page})=>{
 await page.setViewportSize({width,height:900});await page.goto('/');await page.getByRole('button',{name:'Your privacy choices'}).click();
 expect((await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21a','wcag21aa']).analyze()).violations).toEqual([]);
 await page.mouse.move(0,0);
 const actions=page.locator('.privacy-actions button');const styles=await actions.evaluateAll(es=>es.map(e=>{const r=e.getBoundingClientRect(),s=getComputedStyle(e);return {width:Math.round(r.width*10)/10,height:r.height,font:s.fontFamily,weight:s.fontWeight,color:s.color,bg:s.backgroundColor};}));expect(styles[0]).toEqual(styles[1]);expect(styles[0].font).toContain('Roboto Mono');
});
