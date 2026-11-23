import {test,expect} from '@playwright/test';
for(const width of [375,768,1440])test(`current approved website ${width}`,async({page})=>{
 await page.setViewportSize({width,height:900});const posts:string[]=[],external:string[]=[];
 page.on('request',r=>{if(r.method()==='POST')posts.push(r.url());if(!r.url().startsWith('http://127.0.0.1:5191/')&&!r.url().startsWith('data:'))external.push(r.url());});
 for(const route of ['/','/solutions','/about','/privacy-notice','/terms-and-conditions']){
  await page.goto(route);await expect(page.locator('h1').first()).toBeVisible();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth)).toBe(false);
  await expect(page.locator('.header-nav-capsule')).toHaveCount(0);if(width>=769)await expect(page.locator('.site-header .menu-toggle')).toBeHidden();else await expect(page.locator('.site-header .menu-toggle')).toBeVisible();await expect(page.locator('footer a').filter({hasText:'LinkedIn'})).toHaveAttribute('href','https://www.linkedin.com/company/ratioclub/');
  if(route==='/solutions'){
   await expect(page.locator('.solutions-scoping-actions .text-action')).toHaveCount(2);
   if(width>600){const widths=await page.locator('.service-detail').evaluateAll(es=>es.map(e=>Math.abs(e.querySelector('.service-detail-copy')!.getBoundingClientRect().width-e.querySelector('figure')!.getBoundingClientRect().width)));for(const difference of widths)expect(difference).toBeLessThan(1);}
  }
  if(route==='/about'){await expect(page.getByText('Zero silent hardware degradation',{exact:true})).toBeVisible();await expect(page.locator('.about-artwork-size .sacred-morph-object')).toHaveCount(6);await expect(page.locator('.conversion-surface .text-action')).toHaveCount(0);}
  if(route.includes('notice')||route.includes('conditions')){await expect(page.locator('.legal-reading-section')).toHaveCount(route.includes('notice')?5:19);if(route.includes('notice'))await expect(page.locator('.legal-reading-document tbody tr')).toHaveCount(11);await expect(page.locator('.legal-shape-row .sacred-morph-object')).toHaveCount(3);await expect(page.locator('.legal-reading-effective')).toContainText('November 23, 2026');await expect(page.locator('.legal-reading-document')).not.toContainText('placeholder');if(width<=600)await expect(page.locator('.legal-shape-row')).toBeHidden();}
 }
 await page.locator('footer .privacy-trigger').click();const privacy=page.locator('.privacy-dialog[open]');await expect(privacy).toBeVisible();await expect(privacy.locator('input').first()).toBeDisabled();await privacy.locator('input').nth(1).check();await privacy.getByRole('button',{name:'Save choices'}).click();await page.locator('footer .privacy-trigger').click();await expect(privacy.locator('input').nth(1)).toBeChecked();await privacy.getByRole('button',{name:'Reject optional'}).click();await page.locator('footer .privacy-trigger').click();await expect(privacy.locator('input').nth(1)).not.toBeChecked();await page.keyboard.press('Escape');
 await page.locator('footer [data-contact-modal]').click();const contact=page.locator('.contact-dialog[open]');await expect(contact).toBeVisible();await expect(contact.locator('.contact-close-action')).toHaveCount(0);await expect(contact.locator('.contact-copy-email')).toHaveText('hello@ratioclub.com');await contact.locator('.contact-close').click();
 await page.goto('/404');await expect(page.locator('.not-found-page .privacy-trigger')).toHaveCount(0);
 expect(posts).toEqual([]);expect(external).toEqual([]);
});
test('copyright follows local New Year',async({page})=>{
 await page.clock.install({time:new Date(2026,11,31,23,59,59)});await page.goto('/');await expect(page.locator('.copyright > span')).toContainText('2026');await page.clock.runFor(1500);await expect(page.locator('.copyright > span')).toContainText('2027');
});
