// Share route imports between navigation preloading, React.lazy and static generation.
export const routeLoaders={
 contact:()=>import('./pages/ContactPage'),
 solutions:()=>import('./pages/SolutionsPage'),
 about:()=>import('./pages/AboutPage'),
 legal:()=>import('./pages/LegalPage'),
 notFound:()=>import('./pages/NotFoundPage'),
};
export function preloadRoute(path:string):Promise<unknown>{
 if(path==='/')return Promise.resolve();
 if(path==='/solutions')return routeLoaders.solutions();
 if(path==='/about')return routeLoaders.about();
 if(path==='/contact')return routeLoaders.contact();
 if(path==='/privacy-notice'||path==='/terms-and-conditions')return routeLoaders.legal();
 return routeLoaders.notFound();
}
