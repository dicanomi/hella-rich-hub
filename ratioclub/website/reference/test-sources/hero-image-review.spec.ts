import {test,expect} from '@playwright/test';
for(const width of [414,900,1440]) test(`image-motion hero uses one small image and no video at ${width}px`,async({page})=>{
 await page.emulateMedia({reducedMotion:'no-preference'});await page.setViewportSize({width,height:1000});
 const requests:string[]=[];page.on('request',r=>requests.push(r.url()));await page.goto('/hero-image-review');
 const root=page.locator('.hero-image-motion');await expect(root).toHaveAttribute('data-running','true');
 await expect(page.locator('video')).toHaveCount(0);
 await expect(page.locator('.hero-overlay,.hero-progressive-blur')).toHaveCount(0);
 const image=page.locator('.hero-image-plane img');await expect.poll(()=>image.evaluate(e=>(e as HTMLImageElement).naturalWidth)).toBeGreaterThan(0);
 expect(requests.filter(r=>r.includes('hero-poster-')).length).toBe(1);
 expect(requests.filter(r=>r.includes('.mp4')||r.includes('hero-overlay'))).toEqual([]);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBe(width);
 const plane=page.locator('.hero-image-plane');const before=await plane.evaluate(e=>getComputedStyle(e).transform);await page.waitForTimeout(200);
 expect(await plane.evaluate(e=>getComputedStyle(e).transform)).not.toBe(before);
 await page.getByRole('button',{name:'Pause background motion',exact:true}).click();
 await expect(root).toHaveAttribute('data-running','false');
 expect(await plane.evaluate(e=>getComputedStyle(e).animationPlayState)).toBe('paused');
 await page.getByRole('button',{name:'Play background motion',exact:true}).click();await expect(root).toHaveAttribute('data-running','true');
 await page.setViewportSize({width,height:600});await page.evaluate(()=>window.scrollTo(0,document.documentElement.scrollHeight));await expect(root).toHaveAttribute('data-running','false');
});
test('image hero stays still for reduced motion and data saving',async({page})=>{
 await page.emulateMedia({reducedMotion:'reduce'});await page.goto('/hero-image-review');await expect(page.locator('.hero-image-motion')).toHaveAttribute('data-running','false');
 await page.emulateMedia({reducedMotion:'no-preference'});await page.addInitScript(()=>Object.defineProperty(navigator,'connection',{configurable:true,value:Object.assign(new EventTarget(),{saveData:true})}));
 await page.reload();await expect(page.locator('.hero-image-motion')).toHaveAttribute('data-running','false');
});
