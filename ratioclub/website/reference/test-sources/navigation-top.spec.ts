import {test,expect} from '@playwright/test';
const pages=['/','/solutions','/about','/privacy-notice','/terms-and-conditions'];
for(const width of [375,1440])for(const path of pages)for(const source of ['footer','menu'])test(`${source} returns current ${path} to top at ${width}`,async({page})=>{
 await page.setViewportSize({width,height:800});await page.goto(path);await page.evaluate(async()=>{await document.fonts.ready;await new Promise<void>(resolve=>requestAnimationFrame(()=>requestAnimationFrame(()=>resolve())));});
 await page.evaluate(()=>{(window as unknown as {navigationMarker:string}).navigationMarker='same-document';history.replaceState({...history.state,qaMarker:true},'',location.pathname+'#old-section');});
 if(source==='menu')await page.getByRole('button',{name:'Open navigation',exact:true}).click();
 await page.evaluate(()=>scrollTo({top:document.documentElement.scrollHeight-innerHeight,behavior:'instant'}));
 expect(await page.evaluate(()=>scrollY)).toBeGreaterThan(100);
 const historyLength=await page.evaluate(()=>history.length);
 const current=page.locator(source==='footer'?`footer nav a[href='${path}']`:`.expanded-navigation a[href='${path}']`);
 if(source==='footer')await current.click();
 else await current.evaluate(el=>(el as HTMLAnchorElement).click());
 await expect.poll(()=>page.evaluate(()=>scrollY)).toBe(0);await expect(page).toHaveURL(new RegExp(path==='/'?'/$':path+'$'));
 expect(await page.evaluate(()=>history.length)).toBe(historyLength);
 expect(await page.evaluate(()=>history.state.qaMarker)).toBe(true);
 expect(await page.evaluate(()=>(window as unknown as {navigationMarker:string}).navigationMarker)).toBe('same-document');
 if(source==='menu')await expect(page.getByRole('button',{name:'Open navigation',exact:true})).toHaveAttribute('aria-expanded','false');
 await page.reload();await expect.poll(()=>page.evaluate(()=>scrollY)).toBe(0);
});
for(const source of ['footer','menu'])test(`${source} new destinations start at top`,async({page})=>{
 await page.goto('/');
 for(const path of pages.slice(1)){
  if(source==='menu')await page.getByRole('button',{name:'Open navigation',exact:true}).click();
  const link=page.locator(source==='footer'?`footer nav a[href='${path}']`:`.expanded-navigation a[href='${path}']`);
  await link.click();await expect(page).toHaveURL(new RegExp(path+'$'));await expect.poll(()=>page.evaluate(()=>scrollY)).toBe(0);
 }
});
