import {test,expect} from '@playwright/test';
const routes=['/','/solutions','/about','/contact','/privacy-notice','/terms-and-conditions','/missing'];
for(const width of [320,414,600,601,768,900,1100,1280,1440,1920])test(`one semantic heading style per level at ${width}`,async({page})=>{
 await page.setViewportSize({width,height:1000});
 const styles=new Map<string,string>();
 for(const route of routes){
  await page.goto(route);await page.evaluate(()=>document.fonts.ready);
  await expect(page.locator('h1')).toHaveCount(1);
  const headings=await page.locator('h1,h2,h3,h4,h5,h6').evaluateAll(es=>es.filter(e=>e.checkVisibility()).map(e=>{const s=getComputedStyle(e);return {level:Number(e.tagName.slice(1)),text:e.textContent,style:JSON.stringify([s.fontFamily,s.fontSize,s.fontWeight,s.lineHeight]),left:e.getBoundingClientRect().left,right:e.getBoundingClientRect().right};}));
  let previous=0;
  for(const h of headings){expect(h.level,h.text||route).toBeLessThanOrEqual(previous+1);previous=h.level;const key=String(h.level);if(styles.has(key))expect(h.style,`${route}: ${h.text}`).toBe(styles.get(key));else styles.set(key,h.style);expect(h.left).toBeGreaterThanOrEqual(-1);expect(h.right).toBeLessThanOrEqual(width+1);}
  expect(await page.evaluate(()=>document.documentElement.scrollWidth),route).toBe(width);
  for(const numeral of await page.locator('.about-number,.service-detail-number').all()){expect(await numeral.evaluate(e=>/^H[1-6]$/.test(e.tagName))).toBe(false);await expect(numeral).toHaveAttribute('aria-hidden','true');}
 }
 // A dialog heading follows the same contract, rather than a private modal style.
 await page.goto('/');await page.locator('.privacy-trigger').click();
 const modal=await page.locator('.privacy-dialog h2').evaluate(e=>{const s=getComputedStyle(e);return JSON.stringify([s.fontFamily,s.fontSize,s.fontWeight,s.lineHeight]);});expect(modal).toBe(styles.get('2'));
});
