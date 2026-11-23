import {createServer} from 'vite';
import react from '@vitejs/plugin-react';
import {renderToString} from 'react-dom/server';
import {createElement} from 'react';
import {readFileSync} from 'node:fs';
import {pageMetadata} from '../src/content/page-metadata.ts';
export async function prerender(mode,base,allowed,mount='/'){
 const server=await createServer({configFile:false,mode,base:mount,cacheDir:"node_modules/.vite-prerender",server:{middlewareMode:true,watch:null,hmr:false,ws:false},optimizeDeps:{noDiscovery:true,include:[]},plugins:[react()],define:{'import.meta.env.VITE_ENABLE_REVIEWS':JSON.stringify('false'),'import.meta.env.VITE_SITE_URL':JSON.stringify(base),'import.meta.env.VITE_ALLOW_INDEXING':JSON.stringify(String(allowed))}});
 try {
  const {PageContent}=await server.ssrLoadModule('/src/App.tsx');
  const manifest=JSON.parse(readFileSync('dist/.vite/manifest.json','utf8'));
  const assets=Object.entries(manifest).filter(([,entry])=>entry.src).map(([key,entry])=>[mount+key,mount+entry.file]);
  return Object.fromEntries(Object.keys(pageMetadata).map(path=>{
   let html=renderToString(createElement(PageContent,{path}));
   for(const [source,target] of assets)html=html.replaceAll(source,target);
   if(html.includes('/src/assets/'))throw new Error(`Unresolved static asset in ${path}`);
   return [path,html];
  }));
 }finally{await server.close();}
}
