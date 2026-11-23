import {test,expect} from '@playwright/test';
test('one player downloads the full hero body only once, including a loop',async({page})=>{
 await page.emulateMedia({reducedMotion:'no-preference'});
 const responses:{length:number;range:string}[]=[];
 page.on('response',r=>{if(r.url().includes('hero-review-updated')&&r.url().includes('.mp4'))responses.push({length:Number(r.headers()['content-length']??0),range:r.headers()['content-range']??''});});
 await page.goto('/');await expect(page.locator('video')).toHaveCount(1);
 await expect(page.getByRole('button',{name:'Pause background video'})).toBeVisible();
 await expect.poll(()=>page.locator('video').evaluate((v:HTMLVideoElement)=>v.buffered.length?v.buffered.end(v.buffered.length-1):0)).toBeGreaterThan(7.8);
 await page.locator('video').evaluate((v:HTMLVideoElement)=>{v.currentTime=7.7;});
 await expect.poll(()=>page.locator('video').evaluate((v:HTMLVideoElement)=>v.currentTime)).toBeLessThan(2);
 await page.waitForTimeout(300);
 expect(responses.filter(r=>r.length>800_000)).toHaveLength(1);
 expect(responses.reduce((total,r)=>total+r.length,0)).toBeLessThanOrEqual(855_894);
});
