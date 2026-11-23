import {test,expect} from '@playwright/test';
for(const width of [320,414,900,1440])test(`Index service discovery at ${width}`,async({page})=>{
 await page.setViewportSize({width,height:900});await page.goto('/');await page.evaluate(()=>document.fonts.ready);
 await expect(page.locator('.solution-overview-link')).toHaveAttribute('href','/solutions');
 await expect(page.locator('.solution-card-action')).toHaveText(['Validation','Platforms','Operations']);
 const primary=page.locator('.hero-actions a.primary-action');
 const explore=page.getByRole('link',{name:'Explore solutions',exact:true});
 await expect(explore).toHaveAttribute('href','/solutions');await expect(primary).toBeVisible();await expect(explore).toBeVisible();
 const padding=await primary.evaluate(e=>getComputedStyle(e).paddingLeft);
 expect(parseFloat(padding)).toBeGreaterThanOrEqual(14);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBe(width);
 if(width===1440){const a=await primary.boundingBox(),b=await explore.boundingBox();expect(Math.abs(a!.y-b!.y)).toBeLessThan(10);expect(b!.x).toBeGreaterThan(a!.x+a!.width);}
 await page.evaluate(()=>{(window as unknown as {comparisonMarker:string}).comparisonMarker='same-document';});
 await explore.click();await expect(page).toHaveURL(/\/solutions$/);
 expect(await page.evaluate(()=>(window as unknown as {comparisonMarker:string}).comparisonMarker)).toBe('same-document');
 for(const service of ['gpu','inference','operations']){
  await page.goto('/');
  const card=page.locator(`.solution-card[href="/solutions#service-${service}-title"]`);
  const link=card;await link.scrollIntoViewIfNeeded();
  // Pointer click within the figure verifies the complete card is linked.
  const figure=await card.locator('figure').boundingBox();
  await page.mouse.click(figure!.x+20,figure!.y+20);
  await expect(page).toHaveURL(new RegExp(`/solutions#service-${service}-title$`));
  const heading=page.locator(`#service-${service}-title`);await expect(heading).toBeFocused();
  await expect.poll(async()=>heading.evaluate(e=>Math.round(e.getBoundingClientRect().top))).toBeGreaterThanOrEqual(0);
  expect(await heading.evaluate(e=>e.getBoundingClientRect().top)).toBeLessThan(150);
  await page.reload();await page.evaluate(()=>document.fonts.ready);
  await expect(heading).toBeVisible();
  expect(await heading.evaluate(e=>e.getBoundingClientRect().top)).toBeLessThan(150);
 }
});
test('card title links work with the keyboard',async({page})=>{
 await page.goto('/');const link=page.locator('.solution-card-link').first();await link.focus();await page.keyboard.press('Enter');
 await expect(page).toHaveURL(/\/solutions#service-gpu-title$/);await expect(page.locator('#service-gpu-title')).toBeFocused();
});
