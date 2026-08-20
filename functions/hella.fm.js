export async function onRequest(context) {
  const url = new URL(context.request.url);
  const functionPath = context.functionPath || url.pathname;

  if (
    url.pathname === '/hella.fm' ||
    /^\/hella\.fm\/\d{2,3}(?:\.\d)?\/?$/.test(url.pathname) ||
    /^\/hella\.fm\/\d{2,3}(?:\.\d)?\/?$/.test(functionPath)
  ) {
    const assetUrl = new URL(context.request.url);
    assetUrl.pathname = '/hella.fm/index.html';
    return context.env.ASSETS.fetch(new Request(assetUrl, context.request));
  }

  return context.env.ASSETS.fetch(context.request);
}
