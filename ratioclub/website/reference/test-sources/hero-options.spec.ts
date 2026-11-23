import {test,expect} from '@playwright/test';
for(const width of [414,1440]) for(const mode of ['scatter','flow','vortex','video']) test(`${mode} hero at ${width}`,async({page})=>{
 await page.setViewportSize({width,height:1000});await page.emulateMedia({reducedMotion:'no-preference'});
 const errors:string[]=[];const media:string[]=[];
 page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(r.url().includes('.mp4'))media.push(r.url());});
 await page.goto(`/hero-options?option=${mode}`);
 await page.locator('.hero-surface').scrollIntoViewIfNeeded();
 if(mode==='video'){
  await expect.poll(()=>page.locator('.option-video video').evaluate((v:HTMLVideoElement)=>v.readyState)).toBeGreaterThanOrEqual(2);
  await expect.poll(()=>page.locator('.option-video video').evaluate((v:HTMLVideoElement)=>v.currentTime)).toBeGreaterThan(0);
  expect(media.every(u=>u.includes('hero-review-updated'))).toBe(true);
 }else{
  const shader=page.locator('.option-shader');await expect(shader).toHaveAttribute('data-ready','true');
  expect(media).toEqual([]);
  const surface=await page.locator('.hero-surface').boundingBox();
  const before=await shader.locator('canvas').evaluate((c:HTMLCanvasElement)=>c.toDataURL());
  await page.mouse.move(width*.65,surface!.y+180);await page.waitForTimeout(300);
  expect(await shader.locator('canvas').evaluate((c:HTMLCanvasElement)=>c.toDataURL())).not.toBe(before);
 }
 await page.getByRole('button',{name:mode==='video'?'Pause background video':'Pause background effect',exact:true}).click();
 await expect(page.getByRole('button',{name:mode==='video'?'Play background video':'Play background effect',exact:true})).toBeVisible();
 expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBe(width);expect(errors).toEqual([]);
});
test('reduced motion avoids video and canvas until requested',async({page})=>{
 const media:string[]=[];page.on('request',r=>{if(r.url().includes('.mp4'))media.push(r.url());});
 await page.goto('/hero-options?option=video');expect(await page.locator('video').count()).toBe(0);expect(media).toEqual([]);
 await page.getByRole('button',{name:/Image particles/}).click();expect(await page.locator('canvas').count()).toBe(0);
 await page.getByRole('button',{name:'Play background effect',exact:true}).click();
 await expect(page.locator('.option-shader')).toHaveAttribute('data-ready','true');
 await page.getByRole('button',{name:'Open navigation'}).click();await expect(page.locator('#expanded-navigation')).toBeVisible();await page.keyboard.press('Escape');
 await page.locator('.hero-copy .primary-action:not(.dialog-close)').click();await expect(page.getByRole('dialog',{name:'Contact',exact:true})).toBeVisible();
});
