// Isolated static website route: unknown paths retain the Ratioclub 404 design.
export async function onRequest(context) {
 const url=new URL(context.request.url);
 const prefix='/ratioclub/website/';
 const path=url.pathname.slice(prefix.length).replace(/\/$/,'');
 const pages=new Set(['','solutions','about','contact','privacy-notice','terms-and-conditions','404']);
 if(pages.has(path)||path.includes('.'))return context.next();
 const target=new URL(prefix+'404',url.origin);
 const response=await context.env.ASSETS.fetch(target);
 const headers=new Headers(response.headers);headers.set('X-Robots-Tag','noindex, nofollow');
 headers.set('Cache-Control','public, max-age=0, must-revalidate, no-transform');
 headers.set('Content-Security-Policy',"script-src 'self'; frame-ancestors 'none'; base-uri 'self'; object-src 'none'; frame-src 'none'");
 return new Response(response.body,{status:404,headers});
}
