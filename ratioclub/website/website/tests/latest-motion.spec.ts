import {test,expect} from '@playwright/test';
test.use({reducedMotion:'no-preference',viewport:{width:1440,height:900}});
test('About shapes are hover-only with calm entry',async({page})=>{
 await page.goto('/about');const shapes=page.locator('.about-artwork-slot .sacred-morph-object');await expect(shapes).toHaveCount(6);
 for(const index of [0,3]){
  const shape=shapes.nth(index);await page.mouse.move(0,0);await shape.scrollIntoViewIfNeeded();await page.waitForTimeout(400);
  const initial=await shape.getAttribute('data-angle');await page.mouse.wheel(0,60);await page.waitForTimeout(400);expect(await shape.getAttribute('data-angle')).toBe(initial);
  const phase=Number(await shape.getAttribute('data-phase'));await shape.hover();await expect.poll(async()=>Number(await shape.getAttribute('data-phase'))).toBeGreaterThan(phase+.1);
 }
});
test('Solutions quote remains static on hover and scroll',async({page})=>{
 await page.goto('/solutions');const quote=page.locator('.quote-golden-artwork .golden-morph-object');await page.mouse.move(0,0);await quote.scrollIntoViewIfNeeded();
 const paths=()=>quote.locator('path').evaluateAll(es=>es.map(e=>e.getAttribute('d')));
 const hero=await page.locator('.subpage-hero .golden-morph-object path').evaluateAll(es=>es.map(e=>e.getAttribute('d')));await expect.poll(paths).toEqual(hero);
 await quote.hover();await page.waitForTimeout(350);expect(await paths()).toEqual(hero);await page.mouse.wheel(0,120);await page.waitForTimeout(350);expect(await paths()).toEqual(hero);
});
test('Modal close morphs to ratio and back',async({page})=>{
 await page.goto('/solutions');await page.locator('footer [data-contact-modal]').click();const close=page.locator('.contact-close');const symbol=close.locator('.modal-close-symbol');await expect(symbol).toBeVisible();await close.hover();await expect.poll(()=>symbol.evaluate(e=>getComputedStyle(e).transform)).toBe('matrix(0, 1, -1, 0, 0, 0)');await expect.poll(()=>symbol.locator('.modal-close-symbol-dot').first().evaluate(e=>getComputedStyle(e).width)).toBe('2px');await page.mouse.move(0,0);await expect.poll(()=>symbol.evaluate(e=>getComputedStyle(e).transform)).toBe('matrix(1, 0, 0, 1, 0, 0)');await close.click();
});
