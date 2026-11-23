import {test,expect} from '@playwright/test';
const routes=['/solutions','/about','/contact'];
for(const width of[414,600,601,900,1100,1440,1920])test(`internal hero artwork shares size and anchors at ${width}`,async({page})=>{
 await page.setViewportSize({width,height:1000});let shared:number[]|undefined;
 for(const route of routes){await page.goto(route);await page.evaluate(()=>document.fonts.ready);const slot=page.locator('.subpage-hero-artwork');
  if(width<=600){await expect(slot).toBeHidden();continue;}
  await slot.locator('img').evaluate(async(e:HTMLImageElement)=>{e.loading='eager';await e.decode();});
  const m=await slot.evaluate(el=>{const b=el.getBoundingClientRect(),hero=el.parentElement!.getBoundingClientRect(),im=el.querySelector('img')!,r=im.getBoundingClientRect();return{box:[b.width,b.height,b.left-hero.left,b.top-hero.top],image:{w:r.width,h:r.height,right:r.right,center:r.top+r.height/2},right:b.right,center:hero.top+hero.height/2,ratio:im.naturalWidth/im.naturalHeight};});
  if(shared)m.box.forEach((v,i)=>expect(v,route).toBeCloseTo(shared![i],1));else shared=m.box;
  expect(Math.max(m.image.w,m.image.h)).toBeCloseTo(m.box[0],1);expect(m.image.right).toBeCloseTo(m.right,1);expect(m.image.center).toBeCloseTo(m.center,0);expect(m.image.w/m.image.h).toBeCloseTo(m.ratio,3);
  if(route==='/about'||route==='/contact')await expect(slot.locator('img')).toHaveAttribute('src',/hero-about-eight-arms/);
 }
});
