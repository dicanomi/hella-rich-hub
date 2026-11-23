import {test,expect} from '@playwright/test';
for(const route of ['/','/solutions','/about','/contact','/privacy-notice','/terms-and-conditions'])test(`static content ${route}`,async({browser,request})=>{
 const response=await request.get(route);const html=await response.text();
 expect(html).not.toContain('/src/assets/');
 expect(html).toContain('<main');
 const context=await browser.newContext({javaScriptEnabled:false,viewport:{width:414,height:1000}});
 const page=await context.newPage();await page.goto(route);
 await expect(page.locator('h1')).toHaveCount(1);
 await expect(page.locator('h1')).toBeVisible();
 const headings:Record<string,string>={'/':'Enterprise AWS Consulting & Scalable AI Infrastructure','/solutions':'Solutions','/about':'About Us','/contact':'Contact','/privacy-notice':'Privacy Notice','/terms-and-conditions':'Terms & Conditions'};
 await expect(page.locator('h1')).toHaveText(headings[route]);
 await expect(page.locator('footer a[href="/solutions"]')).toBeVisible();
 for(const image of await page.locator('img').all()){
  const source=await image.getAttribute('src');if(source)expect(source).not.toContain('/src/');
 }
 if(['/','/solutions','/about','/contact'].includes(route)){
  const data=JSON.parse(await page.locator('#site-structured-data').textContent()??'null');expect(data['@graph'][0].name).toBe('RatioClub');
 }
 if(route==='/contact')await expect(page.locator('main form:not([method="dialog"])')).toHaveAttribute('inert','');
 await context.close();
});
