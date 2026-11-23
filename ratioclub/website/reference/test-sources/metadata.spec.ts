import {test,expect} from '@playwright/test';
import {pageMetadata} from '../src/content/page-metadata';
for(const [path,meta]of Object.entries(pageMetadata))test(`metadata direct and refresh ${path}`,async({page,request})=>{
 const route=path==='/404'?'/missing-page':path;
 const raw=await request.get(path==='/404'?'/404.html':route);const html=await raw.text();
 expect(html).toContain(`<title>${meta.title.replaceAll('&','&amp;')}</title>`);
 expect(html).toContain('property="og:image"');expect(html).toContain('name="twitter:title"');expect(html).toContain('name="robots" content="noindex, nofollow"');
 for(const reload of [false,true]){
  if(reload)await page.reload();else await page.goto(route);
  await expect(page).toHaveTitle(meta.title);
  for(const selector of ['meta[name="description"]','meta[property="og:description"]','meta[name="twitter:description"]'])await expect(page.locator(selector)).toHaveAttribute('content',meta.description);
  for(const selector of ['meta[property="og:title"]','meta[name="twitter:title"]'])await expect(page.locator(selector)).toHaveAttribute('content',meta.title);
  await expect(page.locator('meta[property="og:image"]')).toHaveCount(1);
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute('content',/\/social\/web-card\.png$/);
  await expect(page.locator('meta[name="twitter:image"]')).toHaveAttribute('content',/\/social\/web-card\.png$/);
  await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute('content','summary_large_image');
 }
});
test('metadata updates during in-place navigation without stale content',async({page})=>{
 await page.goto('/');
 for(const path of ['/solutions','/about','/terms-and-conditions','/privacy-notice','/']){
  await page.getByRole('button',{name:'Open navigation',exact:true}).click();
  await page.locator(`#expanded-navigation a[href="${path}"]`).click();
  await expect(page).toHaveTitle(pageMetadata[path as keyof typeof pageMetadata].title);
  await expect(page.locator('meta[name="twitter:description"]')).toHaveAttribute('content',pageMetadata[path as keyof typeof pageMetadata].description);
 }
});

test('supplied social card loads at its declared dimensions',async({page})=>{
 await page.goto('/');const dimensions=await page.evaluate(async()=>{const image=new Image();image.src=document.querySelector<HTMLMetaElement>('meta[property="og:image"]')!.content;await image.decode();return[image.naturalWidth,image.naturalHeight];});expect(dimensions).toEqual([1200,630]);
});
