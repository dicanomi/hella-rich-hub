import {test,expect} from '@playwright/test';
for(const width of [320,414,600,601,900,1100,1440,1920])test(`paragraph CTA rhythm matches About at ${width}`,async({page})=>{
 await page.setViewportSize({width,height:1000});await page.goto('/about');await page.evaluate(()=>document.fonts.ready);
 const reference=await page.locator('.subpage-introduction-columns').evaluate(el=>parseFloat(getComputedStyle(el).rowGap));
 for(const route of ['/','/solutions','/about','/contact']){
  await page.goto(route);await page.evaluate(()=>document.fonts.ready);
  const pairs=await page.evaluate(()=>{
   const results:{name:string,gap:number}[]=[];
   for(const p of document.querySelectorAll('.contact-introduction>p')){const next=p.nextElementSibling;if(next)results.push({name:p.className||'paragraph',gap:next.getBoundingClientRect().top-p.getBoundingClientRect().bottom});}
   const columns=document.querySelector('.subpage-introduction-columns');if(columns){const bottoms=[...columns.querySelectorAll(':scope>p')].map(p=>p.getBoundingClientRect().bottom);results.push({name:'introduction',gap:columns.querySelector('.subpage-introduction-action')!.getBoundingClientRect().top-Math.max(...bottoms)});}
   const surface=document.querySelector('.conversion-surface');if(surface){const copy=surface.querySelector('.conversion-copy')!.getBoundingClientRect(),action=surface.children[1].getBoundingClientRect();if(action.top>=copy.bottom)results.push({name:'stacked closing CTA',gap:action.top-copy.bottom});}
   return results;
  });
  for(const pair of pairs)expect(Math.abs(pair.gap-(pair.name==='stacked closing CTA'?24:reference)),`${route}: ${pair.name}`).toBeLessThan(1);
 }
});
for(const route of ['/','/solutions','/about','/contact','/missing'])test(`cyan boxed CTA hover matches navigation ${route}`,async({page})=>{
 await page.goto(route);const nav=page.locator('.site-footer a.navigation-button').first();let expected='rgb(89, 169, 191)';if(await nav.count()){await nav.hover();expected=await nav.evaluate(e=>getComputedStyle(e).backgroundColor);}
 for(const action of await page.locator('main .primary-action,.hero-copy .primary-action,.subpage-introduction .primary-action').all()){
  if(!await action.isVisible())continue;await action.hover();await expect(action).toHaveCSS('opacity','1');await expect(action).toHaveCSS('background-color',expected);
 }
});

test('dark filled buttons retain their separate solid hover variant',async({page})=>{
 await page.goto('/');const action=page.locator('.conversion-action').first();await action.hover();await expect(action).toHaveCSS('background-color','rgb(28, 55, 62)');await expect(action).toHaveCSS('opacity','1');
 await page.getByRole('button',{name:'Your privacy choices',exact:true}).click();const close=page.getByRole('dialog',{name:'Privacy Choices'}).getByRole('button',{name:'Close',exact:true});await close.hover();await expect(close).toHaveCSS('background-color','rgb(23, 31, 35)');await expect(close).toHaveCSS('opacity','1');
});

for(const width of [320,414,600,601,900,1100,1440,1920])test(`paired CTA labels use the compact Figma gap at ${width}`,async({page})=>{
 await page.setViewportSize({width,height:1000});await page.goto('/solutions');await page.evaluate(()=>document.fonts.ready);
 const pairs=page.locator('.solutions-scoping-actions>div>p');await expect(pairs).toHaveCount(2);
 for(const paragraph of await pairs.all()){
  const gap=await paragraph.evaluate(p=>p.nextElementSibling!.getBoundingClientRect().top-p.getBoundingClientRect().bottom);expect(gap).toBeCloseTo(20,1);
 }
});
