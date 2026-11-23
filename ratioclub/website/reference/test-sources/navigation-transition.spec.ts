import { test, expect } from "@playwright/test";

test("page navigation and refresh have no transition effects", async ({ page }) => {
  await page.addInitScript(() => {
    addEventListener("pagereveal", event => {
      (window as unknown as { nativeTransition: boolean }).nativeTransition = !!(event as Event & { viewTransition?: unknown }).viewTransition;
    });
  });
  await page.goto("/");
  await page.locator('.header-links a[href="/solutions"]').click();
  await expect(page.getByRole("heading", { name: "Solutions", exact: true })).toBeVisible();
  expect(await page.evaluate(() => (window as unknown as { nativeTransition: boolean }).nativeTransition)).toBe(false);
  await page.locator(".brand-link").click();
  await page.reload();
  await expect(page.getByRole("heading", { name: /Enterprise AWS/ })).toBeVisible();
  await expect(page.locator("#page-transition-cover")).toHaveCount(0);
  await expect(page.locator("html")).not.toHaveAttribute("data-refresh-transition");
});

test("hero scroll lands without a section outline", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/");
  await page.locator('.hero-scroll').click();
  const section = page.locator('#introduction');
  await expect(section).toBeFocused();
  await expect(section).toHaveCSS('outline-style', 'none');
  await expect.poll(() => section.evaluate(e => Math.abs(e.getBoundingClientRect().top))).toBeLessThan(2);
});

test('internal pages switch without replacing the document and support browser history', async ({page}) => {
  await page.goto('/');
  await page.evaluate(()=>{(window as unknown as {documentMarker:string}).documentMarker='same-document';});
  for(const path of ['/solutions','/about','/']) {
    if(path==='/') await page.locator('.brand-link').click();
    else await page.locator(`.header-links a[href="${path}"]`).click();
    await expect(page).toHaveURL(new RegExp(path==='/'?'/$':`${path}$`));
    expect(await page.evaluate(()=>(window as unknown as {documentMarker:string}).documentMarker)).toBe('same-document');
  }
  await page.goBack();await expect(page.locator('.about-page')).toBeVisible();
  await page.goForward();await expect(page.locator('.hero-index')).toBeVisible();
});

for(const fragment of ['%','%E0%A4%A','%ZZ'])test(`malformed fragment ${fragment} never blanks the page`,async({page})=>{
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('/#'+fragment);await expect(page.getByRole('heading',{name:/Enterprise AWS/})).toBeVisible();
 await page.locator('.header-links a[href="/solutions"]').click();await expect(page.getByRole('heading',{name:'Solutions',exact:true})).toBeVisible();
 await page.goBack();await expect(page.getByRole('heading',{name:/Enterprise AWS/})).toBeVisible();
 await page.reload();await expect(page.getByRole('heading',{name:/Enterprise AWS/})).toBeVisible();expect(errors).toEqual([]);
});
test('valid encoded fragment still reaches its section',async({page})=>{
 await page.goto('/#%69ntroduction');await expect(page.locator('#introduction')).toBeInViewport();
});
