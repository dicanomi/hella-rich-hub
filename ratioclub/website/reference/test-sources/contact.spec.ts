import {test,expect} from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
for(const width of [320,414,900,1440])test(`Contact form and navigation at ${width}`,async({page})=>{
 await page.setViewportSize({width,height:1000});const requests:string[]=[];page.on('request',r=>requests.push(r.url()));
 await page.goto('/contact');await expect(page.getByRole('heading',{name:'Contact',exact:true})).toBeVisible();
 expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBe(width);
 await page.getByLabel('Name',{exact:true}).fill('Test Person');await page.getByLabel('Email',{exact:true}).fill('test@example.com');await page.getByLabel('Company',{exact:false}).fill('Example');await page.getByLabel('Message',{exact:true}).fill('Local form verification.');
 await page.getByRole('button',{name:'SEND MESSAGE'}).click();await expect(page.getByRole('status')).toHaveText('Message not sent. Email delivery is currently disconnected. Please email hello@ratioclub.com.');
 await expect(page.locator('.contact-email')).toHaveAttribute('href','mailto:hello@ratioclub.com');
 expect(requests.filter(u=>/cal\.com|\/api\//.test(u))).toEqual([]);
 await expect(page.locator('#contact-form form')).toHaveCount(0);
 await expect(page.getByRole('button',{name:'SEND MESSAGE'})).toHaveCount(0);
 await page.reload();await expect(page.getByRole('heading',{name:'Contact',exact:true})).toBeVisible();await expect(page.getByLabel('Message',{exact:true})).toBeVisible();
});
test('enquiry actions use Contact and no calendar remains',async({page})=>{
 for(const path of ['/','/solutions','/about','/contact']){
  await page.goto(path);await expect(page.locator('iframe')).toHaveCount(0);
  for(const action of await page.locator('a.primary-action,a.conversion-action').all())await expect(action).toHaveAttribute('href','#contact');
 }
});
test('contact actions open the modal without document reload',async({page})=>{
 for(const [path,label]of[['/','COME SAY HI!'],['/solutions','Request Collaboration'],['/about','Connect with Alliance Team']]){
  await page.goto(path);await page.evaluate(()=>{(window as unknown as {marker:string}).marker='contact-test';});
  await page.getByRole('link',{name:label,exact:true}).click();await expect(page.getByRole('dialog',{name:'Contact',exact:true})).toBeVisible();await expect(page).toHaveURL(new RegExp(path==='/'?'/$':path+'$'));
  expect(await page.evaluate(()=>(window as unknown as {marker:string}).marker)).toBe('contact-test');
 }
});
for(const width of [414,1440])test(`Contact accessibility ${width}`,async({page})=>{
 await page.setViewportSize({width,height:1000});await page.goto('/contact');
 const results=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();expect(results.violations).toEqual([]);
});

for(const width of [320,414,900,1440,1920])test(`Send Message has real equal edge padding at ${width}`,async({page})=>{
 await page.setViewportSize({width,height:1000});await page.goto('/contact');await page.evaluate(()=>document.fonts.ready);
 const edges=await page.getByRole('button',{name:'SEND MESSAGE',exact:true}).evaluate(el=>{
  const box=el.getBoundingClientRect(),label=el.querySelector('span')!.getBoundingClientRect(),arrow=el.querySelector('.action-arrow')!.getBoundingClientRect(),css=getComputedStyle(el);
  return {left:label.left-box.left,right:box.right-arrow.right,padding:parseFloat(css.paddingLeft)};
 });
 expect(Math.abs(edges.left-edges.padding)).toBeLessThan(1);expect(Math.abs(edges.right-edges.padding)).toBeLessThan(1);expect(Math.abs(edges.left-edges.right)).toBeLessThan(1);
});
