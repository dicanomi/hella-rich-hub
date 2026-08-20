export async function onRequest(context) {
  const url = new URL(context.request.url);

  if (url.pathname === '/hella.fm') {
    url.pathname = '/hella.fm/';
    return Response.redirect(url.toString(), 308);
  }

  if (/^\/hella\.fm\/\d{2,3}(?:\.\d)?\/?$/.test(url.pathname)) {
    const assetUrl = new URL(context.request.url);
    assetUrl.pathname = '/hella.fm/index.html';
    return context.env.ASSETS.fetch(new Request(assetUrl, context.request));
  }

  return context.env.ASSETS.fetch(context.request);
}
