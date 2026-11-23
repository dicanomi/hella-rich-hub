// Draft legal pages, unknown routes and experiments must never be indexed.
export const publicPaths = ['/', '/solutions', '/about', '/contact'];
export function robotsFor(path:string, allowed:boolean){
  return allowed && publicPaths.includes(path) ? 'index, follow' : 'noindex, nofollow';
}
