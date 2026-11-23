import {test,expect} from '@playwright/test';
for(const width of[375,900,1440])test(`de-emphasized legal navigation keeps destinations and alignment ${width}`,async({page})=>{
 await page.setViewportSize({width,height:1000});
 for(const route of['/','/solutions','/about','/contact','/privacy-notice','/terms-and-conditions']){
  await page.goto(route);await page.evaluate(()=>document.fonts.ready);
  const footer=page.locator('.site-footer');await expect(footer.locator('.navigation-button')).toHaveCount(6);
  const legal=footer.getByRole('navigation',{name:'Legal navigation'});
  await expect(legal.getByRole('link')).toHaveText(['Terms & Conditions','Privacy Notice']);
  for(const link of await legal.getByRole('link').all()){
   await expect(link).toHaveCSS('background-color','rgba(0, 0, 0, 0)');await expect(link).toHaveCSS('text-decoration-line','underline');await expect(link.locator('img,picture')).toHaveCount(0);await expect(link).toHaveCSS('color','rgb(125, 135, 140)');
  }
  const alignment=await legal.evaluate(e=>{const parent=e.parentElement!.getBoundingClientRect(),box=e.getBoundingClientRect();return{left:Math.abs(box.left-parent.left),right:Math.abs(box.right-parent.right)};});expect(width<=600?alignment.left:alignment.right).toBeLessThan(1);
  await page.getByRole('button',{name:'Open navigation',exact:true}).click();
  const menu=page.locator('.expanded-navigation');await expect(menu.locator('.navigation-button')).toHaveCount(6);await expect(menu.locator('.expanded-legal-links a')).toHaveText(['Privacy Notice','Terms & Conditions']);
  for(const link of await menu.locator('.expanded-legal-links a').all()){
   await expect(link).toHaveCSS('background-color','rgba(0, 0, 0, 0)');await expect(link).toHaveCSS('text-decoration-line','underline');await expect(link).toHaveCSS('color','rgb(247, 247, 247)');await expect(link.locator('img,picture')).toHaveCount(0);
  }
  await page.keyboard.press('Escape');
 }
 for(const destination of['/privacy-notice','/terms-and-conditions'])for(const source of['footer','menu']){
  await page.goto('/');
  if(source==='menu')await page.getByRole('button',{name:'Open navigation',exact:true}).click();
  const link=page.locator(source==='footer'?`.footer-legal-links a[href="${destination}"]`:`.expanded-legal-links a[href="${destination}"]`);
  await link.scrollIntoViewIfNeeded();const rect=(await link.boundingBox())!;await page.mouse.click(rect.x+rect.width/2,rect.y+rect.height/2);
  await expect(page).toHaveURL(new RegExp(destination+'$'));await expect.poll(()=>page.evaluate(()=>scrollY)).toBe(0);
 }
});
