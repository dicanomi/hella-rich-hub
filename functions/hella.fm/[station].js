export async function onRequest(context) {
  const station = String(context.params.station || '');

  if (!/^\d{2,3}(?:\.\d)?$/.test(station)) {
    return context.next();
  }

  const assetUrl = new URL(context.request.url);
  assetUrl.pathname = '/hella.fm/index.html';
  return context.env.ASSETS.fetch(new Request(assetUrl, context.request));
}
