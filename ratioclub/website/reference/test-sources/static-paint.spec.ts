import {test,expect} from '@playwright/test';
for(const width of [414,1440]){
 test(`static paint survives delayed app at ${width}`,async({page})=>{
  await page.setViewportSize({width,height:1000});
  let release!:()=>void;const held=new Promise<void>(resolve=>release=resolve);
  await page.route('**/assets/index-*.js',async route=>{await held;await route.continue();});
  const navigation=page.goto('/');
  await expect(page.locator('#hero-title')).toBeVisible();
  await page.waitForTimeout(300);
  const before=await page.locator('#hero-title').boundingBox();
  await expect(page.locator('.hero-poster-image img')).toBeVisible();
  release();await navigation;
  await expect(page.locator('#hero-title')).toBeVisible();
  expect(await page.locator('#hero-title').boundingBox()).toEqual(before);
 });
 test(`one video load and no blank hero at ${width}`,async({page,browserName})=>{
  await page.setViewportSize({width,height:1000});await page.emulateMedia({reducedMotion:'no-preference'});
  const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
  const transfers:{url:string,bytes:number,status:number}[]=[];
  page.on('response',r=>{if(r.url().includes('.mp4'))transfers.push({url:r.url(),bytes:Number(r.headers()['content-length']||0),status:r.status()});});
  await page.addInitScript(()=>{
   const state={blank:0,seen:false,shifts:0};(window as unknown as {paintCheck:typeof state}).paintCheck=state;
   if(PerformanceObserver.supportedEntryTypes.includes('layout-shift'))new PerformanceObserver(list=>{for(const e of list.getEntries())if(!(e as PerformanceEntry & {hadRecentInput:boolean}).hadRecentInput)state.shifts+=(e as PerformanceEntry & {value:number}).value;}).observe({type:'layout-shift',buffered:true});
   const sample=()=>{const hero=document.querySelector('#hero-title');if(hero){state.seen=true;const poster=document.querySelector('.hero-poster-image img') as HTMLImageElement|null;const video=document.querySelector('video') as HTMLVideoElement|null;const visibleVideo=document.querySelector('.hero-motion--visible');if(!(poster?.complete&&poster.naturalWidth)&&!(video&&video.readyState>=2&&visibleVideo))state.blank++;}requestAnimationFrame(sample)};requestAnimationFrame(sample);
  });
  await page.goto('/');await expect(page.locator('.hero-motion--visible video')).toBeVisible();
  await page.waitForTimeout(1000);
  await expect(page.locator('video')).toHaveCount(1);
  expect(new Set(transfers.map(r=>r.url)).size).toBe(1);
  expect(transfers.reduce((sum,r)=>sum+r.bytes,0)).toBeLessThan(850000*1.3);
  // WebKit may request metadata/tail byte ranges; that is not a second full download.
  expect(transfers.filter(r=>r.bytes>700000).length).toBeLessThanOrEqual(1);
  if(browserName==='chromium')expect((await page.evaluate(()=>(window as unknown as {paintCheck:{shifts:number}}).paintCheck)).shifts).toBeLessThan(.01);
  await expect(page.locator('.hero-motion')).toHaveCSS('visibility','visible');
  expect(errors).toEqual([]);
  console.log(JSON.stringify({width,browserName,transfers,paint:await page.evaluate(()=>(window as unknown as {paintCheck:unknown}).paintCheck)}));
 });
}
