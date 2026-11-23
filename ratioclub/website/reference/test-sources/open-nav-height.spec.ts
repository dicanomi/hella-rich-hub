import {test,expect} from '@playwright/test';
for(const width of[375,900,1440])test(`open nav hero coverage and fade ${width}`,async({page})=>{
 await page.setViewportSize({width,height:900});await page.emulateMedia({reducedMotion:'no-preference'});
 for(const route of['/','/solutions','/about']){
  await page.goto(route);await page.evaluate(()=>document.fonts.ready);await page.waitForTimeout(1300);
  const button=page.getByRole('button',{name:'Open navigation',exact:true});await button.click();const menu=page.locator('.expanded-navigation');
  await expect(menu).toHaveCSS('opacity','1');
  const m=await page.locator('header').evaluate(e=>{const menu=e.querySelector('.expanded-navigation')!,hero=e.closest('.hero-surface')??e.closest('.solutions-page,.about-page')!.querySelector('.subpage-hero-surface')!,style=getComputedStyle(menu);return{bottom:menu.getBoundingClientRect().bottom,heroBottom:hero.getBoundingClientRect().bottom,headerTop:e.getBoundingClientRect().top,menuTop:menu.getBoundingClientRect().top,border:style.borderBottomWidth,transition:style.transitionDuration,bg:style.backgroundColor};});
  if(width>600){expect(m.bottom).toBeCloseTo(m.heroBottom,0);expect(m.menuTop).toBeCloseTo(m.headerTop,0);expect(m.transition).toContain('0.18s');}
  expect(m.border).toBe('0px');expect(m.bg).toBe('rgb(23, 31, 35)');
  await expect(menu.locator('.navigation-button')).toHaveCount(6);
  await page.getByRole('button',{name:'Close navigation',exact:true}).click();await expect(menu).toHaveCSS('opacity','0');await expect(menu).toBeHidden();
 }
 if(width>600){
  await page.emulateMedia({reducedMotion:'reduce'});await page.goto('/about');await page.getByRole('button',{name:'Open navigation',exact:true}).click();await expect(page.locator('.expanded-navigation')).toHaveCSS('transition-duration','0s');
  await page.setViewportSize({width:width+80,height:760});await expect.poll(()=>page.locator('header').evaluate(e=>{const a=e.querySelector('.expanded-navigation')!.getBoundingClientRect(),b=e.closest('.about-page')!.querySelector('.subpage-hero-surface')!.getBoundingClientRect();return Math.abs(a.bottom-b.bottom);})).toBeLessThan(1);
 }
});
