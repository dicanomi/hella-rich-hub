import {test,expect,type Page} from '@playwright/test';
test.use({reducedMotion:'no-preference'});
async function ready(page:Page,path:string){
 await page.goto(path);await page.evaluate(async()=>{await document.fonts.ready;await new Promise<void>(r=>requestAnimationFrame(()=>requestAnimationFrame(()=>r())));});
}
async function clickOnce(page:Page,selector:string,touch=false){
 const el=page.locator(selector).first();await expect(el).toBeVisible();
 await el.evaluate(e=>e.scrollIntoView({block:'center',behavior:'instant'}));
 await page.evaluate(()=>new Promise<void>(r=>requestAnimationFrame(()=>requestAnimationFrame(()=>r()))));
 const point=await el.evaluate(e=>{const b=e.getBoundingClientRect(),x=b.x+b.width/2,y=b.y+b.height/2;return{x,y,hit:e.contains(document.elementFromPoint(x,y))};});
 expect(point.hit,selector+' must receive the click').toBe(true);
 // One raw physical action. No locator.click() retrying behind the scenes.
 if(touch)await page.touchscreen.tap(point.x,point.y);else await page.mouse.click(point.x,point.y);
}
for(const width of[375,1440])test(`all link families respond to one click ${width}`,async({page})=>{
 await page.setViewportSize({width,height:900});
 const cases:[string,string][]=[
  ['/','.hero-actions .primary-action'],['/','.hero-explore'],['/','.solution-overview-link'],
  ['/','.solution-card-link:nth-child(1)'],['/','.solution-card-link:nth-child(2)'],['/','.solution-card-link:nth-child(3)'],['/','.conversion-action'],
  ['/solutions','.primary-action'],['/solutions','.solutions-scoping-actions .primary-action'],['/solutions','.solutions-scoping-actions>div:nth-child(2) .primary-action'],['/solutions','.conversion-action'],
  ['/about','.primary-action'],['/about','.conversion-action'],['/about','.conversion-actions .text-action'],
  ['/','.brand-link'],['/','.footer-wordmark'],
  ['/privacy-notice','.legal-reading-contents a'],['/terms-and-conditions','.legal-reading-contents a'],
 ];
 if(width>768)cases.push(['/solutions','.header-links a[href="/solutions"]'],['/about','.header-links a[href="/about"]']);
 for(const[source,selector]of cases){
  await ready(page,source);const expected=await page.locator(selector).first().getAttribute('href');
  if(expected==='#contact'){await clickOnce(page,selector);await expect(page.getByRole('dialog',{name:'Contact',exact:true})).toBeVisible();await page.keyboard.press('Escape');continue;}
  await clickOnce(page,selector);await expect(page).toHaveURL(new RegExp(expected!.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'$'));
 }
 for(const path of['/solutions','/about','/privacy-notice','/terms-and-conditions','/']){
  await ready(page,'/terms-and-conditions');await clickOnce(page,`footer nav a[href="${path}"]`);await expect(page).toHaveURL(new RegExp(path==='/'?'/$':path+'$'));await expect.poll(()=>page.evaluate(()=>scrollY)).toBe(0);
  await clickOnce(page,'.menu-toggle[aria-controls="expanded-navigation"]');await expect(page.locator('.menu-toggle[aria-controls="expanded-navigation"]')).toHaveAttribute('aria-expanded','true');
  await clickOnce(page,`.expanded-navigation a[href="${path}"]`);await expect(page.locator('.menu-toggle[aria-controls="expanded-navigation"]')).toHaveAttribute('aria-expanded','false');
 }
});
for(const width of[375,1440])test(`buttons respond to one click ${width}`,async({page})=>{
 await page.setViewportSize({width,height:900});await ready(page,'/');
 await expect(page.locator('.hero-index video')).toHaveJSProperty('paused',false);await clickOnce(page,'.media-toggle');await expect(page.locator('.hero-index video')).toHaveJSProperty('paused',true);await clickOnce(page,'.media-toggle');await expect(page.locator('.hero-index video')).toHaveJSProperty('paused',false);
 await clickOnce(page,'.menu-toggle[aria-controls="expanded-navigation"]');await expect(page.locator('.menu-toggle[aria-controls="expanded-navigation"]')).toHaveAttribute('aria-expanded','true');await clickOnce(page,'.menu-toggle[aria-controls="expanded-navigation"]');await expect(page.locator('.menu-toggle[aria-controls="expanded-navigation"]')).toHaveAttribute('aria-expanded','false');
 for(const action of['.privacy-close','.privacy-actions button:first-child','.privacy-actions button:last-child']){
  await clickOnce(page,'footer .privacy-trigger');await expect(page.locator('dialog[open]')).toHaveCount(1);await clickOnce(page,action);await expect(page.locator('dialog[open]')).toHaveCount(0);
 }
 await ready(page,'/privacy-notice');await clickOnce(page,'.legal-privacy-choices .privacy-trigger');await expect(page.locator('dialog[open]')).toHaveCount(1);await clickOnce(page,'.privacy-policy-links a[href="/privacy-notice"]');await expect(page.locator('dialog[open]')).toHaveCount(0);await expect.poll(()=>page.evaluate(()=>scrollY)).toBe(0);
 await ready(page,'/contact');await page.getByLabel('Name',{exact:true}).fill('Single action check');await page.getByLabel('Email',{exact:true}).fill('preview@example.com');await page.getByLabel('Message',{exact:true}).fill('Must remain disconnected.');await clickOnce(page,'button[type="submit"]');await expect(page.getByRole('status')).toContainText('Message not sent.');
});
for(const width of[375,1440])test(`late restoration never overrides one click ${width}`,async({page})=>{
 await page.setViewportSize({width,height:900});await ready(page,'/terms-and-conditions');await page.mouse.wheel(0,3000);await expect.poll(()=>page.evaluate(()=>scrollY)).toBeGreaterThan(100);await page.reload();await page.evaluate(()=>document.fonts.ready);await page.waitForTimeout(100);
 await clickOnce(page,'footer nav a[href="/terms-and-conditions"]');await expect.poll(()=>page.evaluate(()=>scrollY)).toBe(0);
 await page.evaluate(()=>dispatchEvent(new PageTransitionEvent('pageshow',{persisted:false})));await page.waitForTimeout(100);expect(await page.evaluate(()=>scrollY)).toBe(0);
});

test.describe('real touch input',()=>{
 test.use({hasTouch:true});
 test('navigation and buttons respond to one tap',async({page})=>{
  await page.setViewportSize({width:375,height:900});await ready(page,'/terms-and-conditions');
  for(const path of ['/privacy-notice','/terms-and-conditions','/about','/solutions','/']){
   await clickOnce(page,`footer nav a[href="${path}"]`,true);await expect(page).toHaveURL(new RegExp(path==='/'?'/$':path+'$'));await expect.poll(()=>page.evaluate(()=>scrollY)).toBe(0);
  }
  await clickOnce(page,'.menu-toggle[aria-controls="expanded-navigation"]',true);await expect(page.locator('.menu-toggle[aria-controls="expanded-navigation"]')).toHaveAttribute('aria-expanded','true');await clickOnce(page,'.expanded-navigation a[href="/privacy-notice"]',true);await expect(page).toHaveURL(/\/privacy-notice$/);
  await clickOnce(page,'.legal-privacy-choices .privacy-trigger',true);await expect(page.locator('dialog[open]')).toHaveCount(1);await clickOnce(page,'.privacy-close',true);await expect(page.locator('dialog[open]')).toHaveCount(0);
  await ready(page,'/');await clickOnce(page,'.hero-actions .primary-action',true);await expect(page.getByRole('dialog',{name:'Contact',exact:true})).toBeVisible();
 });
});
