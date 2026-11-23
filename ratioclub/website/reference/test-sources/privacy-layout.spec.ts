import {test,expect} from '@playwright/test';
for(const width of[320,414,600,900,1440])test(`Privacy Choices fits and page trigger restores focus at ${width}`,async({page})=>{
 await page.setViewportSize({width,height:900});await page.goto('/privacy-notice');await page.evaluate(()=>document.fonts.ready);
 const trigger=page.locator('.legal-privacy-choices .privacy-trigger');await expect(trigger).toHaveText('Your privacy choices');await expect(page.locator('.privacy-dialog')).toHaveCount(1);await trigger.click();
 const modal=page.getByRole('dialog',{name:'Privacy Choices'});await expect(modal).toBeVisible();
 const fit=await modal.evaluate(e=>{const b=e.getBoundingClientRect(),h=e.querySelector('h2')!,r=document.createRange();r.selectNodeContents(h);const c=e.querySelector('.privacy-close')!.getBoundingClientRect();return {overflow:e.scrollWidth>e.clientWidth,glyphs:[...r.getClientRects()].filter(r=>r.width>0).map(r=>({left:r.left,right:r.right,bottom:r.bottom,top:r.top})),b:{left:b.left,right:b.right},close:{left:c.left,top:c.top,bottom:c.bottom}};});
 expect(fit.overflow).toBe(false);for(const r of fit.glyphs){expect(r.left).toBeGreaterThanOrEqual(fit.b.left);expect(r.right).toBeLessThanOrEqual(fit.b.right);if(r.bottom>fit.close.top&&r.top<fit.close.bottom)expect(r.right).toBeLessThanOrEqual(fit.close.left);}
 const closeGeometry=await modal.locator('.privacy-close').evaluate(e=>{const button=e.getBoundingClientRect(),icon=e.querySelector('img')!.getBoundingClientRect();return {button:[button.width,button.height],icon:[icon.width,icon.height],offset:[icon.left-button.left,icon.top-button.top]};});
 expect(closeGeometry).toEqual({button:[44,44],icon:[24,24],offset:[10,10]});
 const switches=await modal.getByRole('switch').evaluateAll(es=>es.map(e=>{const s=getComputedStyle(e);return[s.width,s.height,s.borderRadius];}));expect(switches.every(s=>JSON.stringify(s)===JSON.stringify(switches[0]))).toBe(true);
 const buttons=await modal.locator('.privacy-actions button').evaluateAll(es=>es.map(e=>{const s=getComputedStyle(e),r=e.getBoundingClientRect();return [s.fontSize,s.fontWeight,s.letterSpacing,s.paddingTop,s.paddingRight,Math.round(r.width*10)/10,r.height];}));expect(buttons[0]).toEqual(buttons[1]);
 await page.keyboard.press('Escape');await expect(trigger).toBeFocused();await expect(modal).not.toBeVisible();
});
