import {test,expect} from '@playwright/test';

for(const width of [375,1440])test(`sustained scrolling cannot exhaust history or block a click ${width}`,async({page})=>{
 await page.setViewportSize({width,height:900});
 await page.addInitScript(()=>{
  const writes:number[]=[];
  const original=history.replaceState.bind(history);
  Object.assign(window,{historyWrites:writes});
  history.replaceState=(...args:Parameters<History['replaceState']>)=>{
   const now=performance.now();writes.push(now);
   if(writes.filter(time=>now-time<10000).length>100)throw new DOMException('Safari history mutation limit','SecurityError');
   return original(...args);
  };
 });
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('/solutions');await page.evaluate(()=>document.fonts.ready);
 await page.evaluate(()=>new Promise<void>(resolve=>{
  let frames=0;
  const tick=()=>{scrollTo(0,1000+(frames%2)*10);if(++frames===160)resolve();else requestAnimationFrame(tick);};
  requestAnimationFrame(tick);
 }));
 const writes=await page.evaluate(()=>(window as unknown as {historyWrites:number[]}).historyWrites.length);
 expect(writes).toBeLessThan(20);
 expect(errors).toEqual([]);
 const link=page.locator('footer nav a[href="/about"]');
 await link.evaluate(el=>el.scrollIntoView({block:'center',behavior:'instant'}));
 const box=await link.boundingBox();expect(box).not.toBeNull();
 await page.mouse.click(box!.x+box!.width/2,box!.y+box!.height/2);
 await expect(page).toHaveURL(/\/about$/);
 await expect.poll(()=>page.evaluate(()=>scrollY)).toBe(0);
 expect(errors).toEqual([]);
});

test('history refusal cannot cancel navigation or same-page return to top',async({page})=>{
 await page.goto('/terms-and-conditions');await page.evaluate(()=>document.fonts.ready);
 await page.evaluate(()=>{
  history.replaceState=()=>{throw new DOMException('History unavailable','SecurityError');};
  history.pushState=()=>{throw new DOMException('History unavailable','SecurityError');};
 });
 const current=page.locator('footer nav a[href="/terms-and-conditions"]');
 await current.evaluate(el=>el.scrollIntoView({block:'center',behavior:'instant'}));
 const currentBox=await current.boundingBox();
 await page.mouse.click(currentBox!.x+currentBox!.width/2,currentBox!.y+currentBox!.height/2);
 await expect.poll(()=>page.evaluate(()=>scrollY)).toBe(0);
 const next=page.locator('footer nav a[href="/about"]');
 await next.evaluate(el=>el.scrollIntoView({block:'center',behavior:'instant'}));
 const nextBox=await next.boundingBox();
 await page.mouse.click(nextBox!.x+nextBox!.width/2,nextBox!.y+nextBox!.height/2);
 await expect(page).toHaveURL(/\/about$/);
 await expect(page.getByRole('heading',{level:1,name:'About Us',exact:true})).toBeVisible();
});
