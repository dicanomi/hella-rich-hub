import {test,expect} from '@playwright/test';
for(const width of [601,768,900,1024,1280,1440,1920,2560])test(`Index conversion title stays two lines at ${width}`,async({page})=>{
 await page.setViewportSize({width,height:1000});await page.goto('/');await page.evaluate(()=>document.fonts.ready);
 const heading=page.locator('.conversion-index .conversion-copy h2');
 await expect(heading).toHaveText('Deploy Production AI on AWS with Guaranteed Velocity');
 const lines=await heading.evaluate(el=>{const range=document.createRange();range.selectNodeContents(el);return new Set([...range.getClientRects()].map(r=>Math.round(r.top))).size;});
 expect(lines).toBe(2);expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBe(width);
});
for(const width of [320,414])test(`Index mobile title retains its existing typography at ${width}`,async({page})=>{
 await page.setViewportSize({width,height:1000});await page.goto('/');await page.evaluate(()=>document.fonts.ready);
 const font=await page.locator('.conversion-index h2').evaluate(el=>{const s=getComputedStyle(el);return {size:s.fontSize,weight:s.fontWeight,height:s.lineHeight};});
 expect(font.weight).toBe('500');expect(parseFloat(font.size)).toBeGreaterThanOrEqual(32);expect(parseFloat(font.height)/parseFloat(font.size)).toBeCloseTo(1.25,2);
});

for(const width of [320,414,600,601,768,900,1024,1440,1920])test(`About conversion retains its content and proper actions at ${width}`,async({page})=>{
 await page.setViewportSize({width,height:1000});await page.goto('/about');await page.evaluate(()=>document.fonts.ready);
 const banner=page.locator('.conversion-banner');await expect(banner).toHaveCount(1);
 const heading=banner.locator('h2');await expect(heading).toHaveText('Ready to Scale Reliable, Cost-Effective AI on AWS?');
 await expect(banner.locator('.conversion-copy p')).toHaveText('Connect directly with a Principal Infrastructure Architect to schedule a pre-flight cluster audit, benchmark your inference stack, or discuss AWS co-sell collaboration.');
 await expect(banner.locator('.conversion-actions a')).toHaveText(['Book an Infrastructure Audit','Connect with Alliance Team']);
 for(const link of await banner.locator('.conversion-actions a').all()){
  await expect(link).toHaveAttribute('href','#contact');
  const layout=await link.evaluate(el=>{const b=el.getBoundingClientRect(),s=getComputedStyle(el),label=el.firstElementChild!,r=document.createRange();r.selectNodeContents(label);return {width:b.width,left:b.left,right:b.right,padding:parseFloat(s.paddingLeft),rightPadding:parseFloat(s.paddingRight),labelLeft:label.getBoundingClientRect().left,arrowRight:el.lastElementChild!.getBoundingClientRect().right,lines:new Set([...r.getClientRects()].map(r=>Math.round(r.top))).size};});
  expect(layout.left).toBeGreaterThanOrEqual(0);expect(layout.right).toBeLessThanOrEqual(width);
  expect(Math.abs(layout.labelLeft-layout.left-layout.padding)).toBeLessThan(1);expect(Math.abs(layout.right-layout.arrowRight-layout.rightPadding)).toBeLessThan(1);
  if(width>600)expect(layout.lines).toBe(1);
 }
 if(width>600){const lines=await heading.evaluate(el=>{const r=document.createRange();r.selectNodeContents(el);return new Set([...r.getClientRects()].map(r=>Math.round(r.top))).size;});expect(lines).toBe(2);}
});
