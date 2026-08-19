export async function onRequest(context) {
  const url = new URL(context.request.url);

  if (url.pathname === '/hella.fm') {
    url.pathname = '/hella.fm/';
    return Response.redirect(url.toString(), 308);
  }

  return context.env.ASSETS.fetch(context.request);
}
