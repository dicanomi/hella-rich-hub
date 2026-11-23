import {test,expect} from '@playwright/test';
for(const width of [900,1280,1440,1920])test(`desktop plane corners share a baseline at ${width}`,async({page})=>{
 await page.emulateMedia({reducedMotion:"no-preference"});await page.setViewportSize({width,height:1100});await page.goto('/');await page.locator('#core-solutions').scrollIntoViewIfNeeded();await expect(page.locator('.solution-graph-motion')).toHaveCount(3);await page.evaluate(()=>document.fonts.ready);
 const ys=await page.locator('.graph-hover-base').evaluateAll(es=>es.map(e=>{const r=e.getBoundingClientRect();return r.top+r.height/2;}));expect(Math.max(...ys)-Math.min(...ys)).toBeLessThan(1.5);
 const captions=await page.locator('.solution-card figcaption').evaluateAll(es=>es.map(e=>e.getBoundingClientRect().top));expect(Math.max(...captions)-Math.min(...captions)).toBeLessThan(1);
 // Hover still moves only the existing internal artwork groups.
 const graph=page.locator('.solution-graph-motion').first();await graph.hover();await expect(graph).toHaveAttribute('data-hover','true');await expect(graph.locator('.graph-hover-base')).not.toHaveCSS('transform','none');
});
for(const width of [320,414,600])test(`mobile artwork positioning is untouched at ${width}`,async({page})=>{
 await page.emulateMedia({reducedMotion:'reduce'});await page.setViewportSize({width,height:1000});await page.goto('/');for(const slot of await page.locator('.core-solutions .solution-graph-slot').all()){await expect(slot).toHaveCSS('position','static');await expect(slot).toHaveCSS('top','auto');}
});
