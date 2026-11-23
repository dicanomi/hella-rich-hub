import {test,expect} from '@playwright/test';

test('JavaScript-disabled visitors receive the full page and a Contact link',async({browser})=>{
 const context=await browser.newContext({javaScriptEnabled:false});
 const page=await context.newPage();await page.goto('/solutions');
 await expect(page.getByRole('heading',{name:'Solutions',exact:true})).toBeVisible();
 await expect(page.locator('footer a[data-contact-modal]')).toHaveAttribute('href','#contact');
 await context.close();
});

test('render failure offers recovery rather than a blank page',async({page})=>{
 await page.emulateMedia({reducedMotion:'no-preference'});
 await page.addInitScript(()=>{
  const original=Element.prototype.getBoundingClientRect;
  Element.prototype.getBoundingClientRect=function(){
   if(this.classList.contains('hero-media'))throw new Error('Injected local render failure');
   return original.call(this);
  };
 });
 await page.goto('/');
 await expect(page.getByRole('heading',{name:'Something went wrong.'})).toBeVisible();
 await expect(page.getByRole('button',{name:'RELOAD PAGE'})).toBeVisible();
});

test('canonical metadata follows navigation and unknown routes stay noindex',async({page})=>{
 await page.goto('/contact');
 await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href',/\/contact$/);
 await page.goto('/not-real');
 await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href',/\/404$/);
 await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content','noindex, nofollow');
});

test('long and special-character contact inputs remain local',async({page})=>{
 const submissions:string[]=[];
 page.on('request',request=>{if(request.method()==='POST')submissions.push(request.url());});
 await page.goto('/contact');
 await page.getByLabel('Name',{exact:true}).fill('<script>alert(1)</script> 👋');
 await page.getByLabel('Email',{exact:true}).fill('preview@example.com');
 await page.getByLabel('Message',{exact:true}).fill('A'.repeat(4990)+' <>& 🙂');
 await page.getByRole('button',{name:'SEND MESSAGE'}).click();
 await expect(page.getByRole('status')).toHaveText('Message not sent. Email delivery is currently disconnected. Please email hello@ratioclub.com.');
 expect(submissions).toEqual([]);
});
