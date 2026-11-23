import {test,expect} from '@playwright/test';
for(const width of [414,900,1440]) test(`particle hero interacts and rests at ${width}px`,async({page})=>{
 await page.setViewportSize({width,height:1000});await page.emulateMedia({reducedMotion:'no-preference'});
 const requests:string[]=[];const errors:string[]=[];page.on('request',r=>requests.push(r.url()));page.on('pageerror',e=>errors.push(e.message));
 await page.goto('/hero-particle-review');const root=page.locator('.hero-particles');
 await expect.poll(async()=>Number(await root.getAttribute('data-particles'))).toBeGreaterThan(0);
 expect(Number(await root.getAttribute('data-particles'))).toBeLessThanOrEqual(width<=768?900:3200);
 expect(requests.filter(r=>r.includes('.mp4'))).toEqual([]);expect(requests.filter(r=>r.includes('hero-disperse')&&/\.webp(?:$|\?)/.test(r)).length).toBe(1);
 const poster=page.locator('.hero-particle-poster');expect(await poster.evaluate(e=>getComputedStyle(e).transform)).toBe('none');
 await expect(root).toHaveAttribute('data-ready','true');
 const canvas=page.locator('.hero-particle-canvas');const before=await canvas.evaluate(e=>(e as HTMLCanvasElement).toDataURL());
 await page.mouse.move(width*.48,300);await page.waitForTimeout(250);
 expect(await canvas.evaluate(e=>(e as HTMLCanvasElement).toDataURL())).not.toBe(before);
 await page.mouse.move(0,1100);await expect(root).toHaveAttribute('data-animating','false',{timeout:5000});
 const settled=await canvas.evaluate(e=>(e as HTMLCanvasElement).toDataURL());await page.waitForTimeout(250);
 expect(await canvas.evaluate(e=>(e as HTMLCanvasElement).toDataURL())).toBe(settled);
 await page.getByRole('button',{name:'Pause particle interaction',exact:true}).click();await expect(root).toHaveAttribute('data-enabled','false');
 expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBe(width);expect(errors).toEqual([]);
});
test('particle review respects reduced motion and keeps header and CTA usable',async({page})=>{
 await page.emulateMedia({reducedMotion:'reduce'});await page.goto('/hero-particle-review');
 await expect(page.locator('.hero-particles')).toHaveAttribute('data-enabled','false');
 await page.getByRole('button',{name:'Open navigation'}).click();await expect(page.locator('#expanded-navigation')).toBeVisible();await page.keyboard.press('Escape');
 await page.locator('.hero-copy .primary-action:not(.dialog-close)').click();await expect(page.getByRole('dialog',{name:'Contact',exact:true})).toBeVisible();
});
