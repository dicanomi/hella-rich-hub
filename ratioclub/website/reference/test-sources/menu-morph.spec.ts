import {test,expect} from '@playwright/test';
for(const width of[414,1440])test(`menu spins, morphs and reverses at ${width}`,async({page})=>{
 await page.emulateMedia({reducedMotion:'no-preference'});await page.setViewportSize({width,height:1000});await page.goto('/');
 const button=page.locator('.menu-toggle'),icon=button.locator('.menu-toggle-icon'),bars=button.locator('.menu-toggle-bar');await expect(bars).toHaveCount(2);
 const surface=await button.evaluate(e=>{const s=getComputedStyle(e);return [s.backgroundImage,s.boxShadow,s.borderRadius];});
 await expect(icon).toHaveCSS('transition-duration','0.3s');
 const closed=await bars.evaluateAll(es=>es.map(e=>getComputedStyle(e).transform));
 await button.click();await expect(button).toHaveAttribute('aria-expanded','true');
 const active=await icon.evaluate(e=>e.getAnimations().length);expect(active).toBeGreaterThan(0);
 await page.waitForTimeout(350);await expect(icon).toHaveCSS('transform','matrix(-1, 0, 0, -1, 0, 0)');
 expect(await bars.evaluateAll(es=>es.map(e=>getComputedStyle(e).transform))).not.toEqual(closed);
 await button.click();await page.waitForTimeout(350);expect(await bars.evaluateAll(es=>es.map(e=>getComputedStyle(e).transform))).toEqual(closed);
 // A second click can reverse an unfinished transition with the same two bars.
 await button.click();await button.click();await page.waitForTimeout(350);await expect(button).toHaveAttribute('aria-expanded','false');expect(await bars.evaluateAll(es=>es.map(e=>getComputedStyle(e).transform))).toEqual(closed);
 expect(await button.evaluate(e=>{const s=getComputedStyle(e);return [s.backgroundImage,s.boxShadow,s.borderRadius];})).toEqual(surface);
});
test('reduced motion switches instantly and Escape restores focus',async({page})=>{
 await page.emulateMedia({reducedMotion:'reduce'});await page.goto('/about');const button=page.locator('.menu-toggle');await expect(button.locator('.menu-toggle-icon')).toHaveCSS('transition-duration','0s');await expect(button.locator('.menu-toggle-bar').first()).toHaveCSS('transition-duration','0s');await button.click();await expect(button).toHaveAttribute('aria-label','Close navigation');await page.keyboard.press('Escape');await expect(button).toBeFocused();await expect(button).toHaveAttribute('aria-expanded','false');
});
