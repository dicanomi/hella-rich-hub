import {test,expect} from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
for(const width of [320,414,900,1440])for(const [path,title] of [['/terms-and-conditions','Terms & Conditions'],['/privacy-notice','Privacy Notice'],['/missing-page','Signal Down — 404']])test(`${title} at ${width}`,async({page})=>{
 await page.setViewportSize({width,height:1000});const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(path);await page.evaluate(()=>document.fonts.ready);
 await expect(page.getByRole('heading',{name:title,exact:true})).toBeVisible();
 expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBe(width);
 if(path!='/missing-page'){
  await expect(page.locator('.legal-reading-introduction')).toContainText('placeholder');
  await expect(page.locator('.legal-reading-effective')).toHaveText('Effective date: awaiting approval');
  await expect(page.locator('.legal-reading-section')).toHaveCount(path==='/terms-and-conditions'?11:6);
  expect(await page.locator('.legal-reading-contents a').evaluateAll(links=>links.every(a=>a.getAttribute('href')?.startsWith('#')))).toBe(true);
  await expect(page.locator('.legal-reading-contents')).toBeVisible();
  await expect(page.locator('.subpage-hero')).toHaveCount(0);
  const layout=await page.locator('.legal-reading-document').evaluate(el=>{
   const box=el.getBoundingClientRect();return {width:box.width,left:box.left,right:innerWidth-box.right,paragraphs:[...el.querySelectorAll('p')].map(p=>getComputedStyle(p).fontSize)};
  });
  expect(layout.width).toBeLessThanOrEqual(840);expect(Math.abs(layout.left-layout.right)).toBeLessThan(1);
  expect(layout.paragraphs.every(size=>size==='16px')).toBe(true);
  const corners=await page.locator('.legal-simple-header .site-header').evaluate(el=>[getComputedStyle(el).borderBottomLeftRadius,getComputedStyle(el).borderBottomRightRadius]);expect(corners).toEqual(['15px','15px']);
  expect(await page.locator('body').innerText()).not.toMatch(/linear/i);
 }else{
  await page.locator('.not-found-copy a').click();await expect(page).toHaveURL(/\/$/);
 }
 await page.reload();expect(errors).toEqual([]);
});
for(const path of ['/terms-and-conditions','/privacy-notice','/missing-page'])test(`accessibility ${path}`,async({page})=>{
 await page.goto(path);const results=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();expect(results.violations).toEqual([]);
});
