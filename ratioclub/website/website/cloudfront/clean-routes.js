// Optional CloudFront Function (viewer-request). Review/associate separately.
// eslint-disable-next-line no-unused-vars -- CloudFront invokes this entrypoint.
function handler(event) {
  var request = event.request;
  var path = request.uri.replace(/\/$/, '') || '/';
  var routes = {
    '/': '/index.html', '/solutions': '/solutions.html', '/about': '/about.html',
    '/contact': '/contact.html', '/privacy-notice': '/privacy-notice.html',
    '/terms-and-conditions': '/terms-and-conditions.html', '/404': '/404.html'
  };
  if (Object.prototype.hasOwnProperty.call(routes, path)) request.uri = routes[path];
  return request;
}
