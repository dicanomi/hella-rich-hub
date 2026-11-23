import {test,expect} from '@playwright/test';

test.describe('legal letter sequence',()=>{
 test.use({reducedMotion:'no-preference'});
 for(const width of[375,1440])for(const route of['/privacy-notice','/terms-and-conditions'])test(`title then date, unchanged layout ${route} ${width}`,async({page})=>{
  await page.setViewportSize({width,height:900});
  await page.addInitScript(()=>{
   const samples:{title:number[];date:number[]}[]=[];Object.assign(window,{legalSamples:samples});
   const tick=()=>{
    const title=[...document.querySelectorAll('#page-title .legal-letter-cover')],date=[...document.querySelectorAll('.legal-reading-effective .legal-letter-cover')];
    if(title.length&&date.length)samples.push({title:title.map(e=>Number(getComputedStyle(e).opacity)),date:date.map(e=>Number(getComputedStyle(e).opacity))});
    requestAnimationFrame(tick);
   };requestAnimationFrame(tick);
  });
  await page.goto(route);await page.evaluate(()=>document.fonts.ready);
  await expect.poll(()=>page.evaluate(()=>(window as unknown as {legalSamples:unknown[]}).legalSamples.length)).toBeGreaterThan(0);
  await expect(page.locator('.legal-letter-layer')).toHaveCount(0,{timeout:2500});
  const samples=await page.evaluate(()=>(window as unknown as {legalSamples:{title:number[];date:number[]}[]}).legalSamples);
  expect(samples.some(s=>s.title[0]<.8&&s.title.at(-1)!>.95)).toBe(true);
  const dateStarted=samples.filter(s=>s.date.some(v=>v<.99));expect(dateStarted.length).toBeGreaterThan(0);
  expect(dateStarted.every(s=>s.title.every(v=>v<.01))).toBe(true);
  const geometry=()=>page.locator('#page-title,.legal-reading-effective').evaluateAll(es=>es.map(e=>{const r=e.getBoundingClientRect(),s=getComputedStyle(e);return{text:e.textContent,rect:[r.x,r.y,r.width,r.height],size:s.fontSize,weight:s.fontWeight,spacing:s.letterSpacing,leading:s.lineHeight,opacity:s.opacity};}));
  const animated=await geometry();await page.goto(route+'?legalIntro=off');await page.evaluate(()=>document.fonts.ready);expect(await geometry()).toEqual(animated);
  await expect(page.locator('.legal-letter-layer')).toHaveCount(0);
 });
 test('replays each visit and never blocks interaction',async({page})=>{
  await page.goto('/privacy-notice');await expect(page.locator('.legal-letter-layer')).toHaveCount(2);
  await page.getByRole('button',{name:'Open navigation',exact:true}).click();await expect(page.locator('.legal-letter-layer')).toHaveCount(0);
  await page.locator('.expanded-navigation a[href="/terms-and-conditions"]').click();await expect(page.locator('.legal-letter-layer')).toHaveCount(2);
  await page.keyboard.press('Tab');await expect(page.locator('.legal-letter-layer')).toHaveCount(0);
  await page.locator('footer nav a[href="/privacy-notice"]').click();await expect(page.locator('.legal-letter-layer')).toHaveCount(2);
 });
});

for(const route of['/privacy-notice','/terms-and-conditions'])test(`reduced motion shows full legal heading immediately ${route}`,async({page})=>{
 await page.goto(route);await page.evaluate(()=>document.fonts.ready);await expect(page.locator('.legal-letter-layer')).toHaveCount(0);
 for(const el of await page.locator('#page-title,.legal-reading-effective').all())expect(await el.evaluate(e=>getComputedStyle(e).opacity)).toBe('1');
 await expect(page.getByRole('heading',{level:1,name:route.includes('privacy')?'Privacy Notice':'Terms & Conditions',exact:true})).toBeVisible();
});
