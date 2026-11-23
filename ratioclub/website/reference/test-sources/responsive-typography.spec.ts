import {test,expect} from '@playwright/test';
for(const width of [320,414,600,601,768,900,1100,1280,1440,1920])test(`responsive typography stays readable and within its grid at ${width}`,async({page})=>{
 await page.setViewportSize({width,height:1000});
 for(const route of ['/','/solutions','/about','/contact','/privacy-notice','/terms-and-conditions','/missing']){
  await page.goto(route);await page.evaluate(()=>document.fonts.ready);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth),route).toBe(width);
  const headings=await page.locator('main h1,main h2,main h3').evaluateAll(es=>es.filter(e=>e.checkVisibility()).map(e=>{const s=getComputedStyle(e),r=document.createRange();r.selectNodeContents(e);return {text:e.textContent,weight:s.fontWeight,rects:[...r.getClientRects()].filter(r=>r.width>0).map(r=>({left:r.left,right:r.right})),lines:new Set([...r.getClientRects()].filter(r=>r.width>0).map(r=>Math.round(r.top))).size};}));
  for(const h of headings)for(const r of h.rects){expect(r.left,h.text||route).toBeGreaterThanOrEqual(-1);expect(r.right,h.text||route).toBeLessThanOrEqual(width+1);}
  if(route==='/about' && width>=900 && width<=1440){for(const h of headings.filter(h=>h.text?.startsWith('Our Heritage')||h.text?.startsWith('Engineering Capabilities')||h.text?.startsWith('The RatioClub Standard'))){expect(h.lines,h.text!).toBe(2);expect(h.weight).toBe('500');}}
  if(route==='/' && width>=900 && width<=1440)expect(headings[0].lines).toBe(2);
 }
});
