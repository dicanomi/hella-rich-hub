import {createServer} from 'vite';
import react from '@vitejs/plugin-react';
import {renderToPipeableStream} from 'react-dom/server';
import {createElement,StrictMode} from 'react';
import {PassThrough} from 'node:stream';
import {readFileSync} from 'node:fs';
import {pageMetadata} from '../src/content/page-metadata.ts';
function renderComplete(element){
 return new Promise((resolve,reject)=>{
  const output=new PassThrough();let html='';
  output.setEncoding('utf8');output.on('data',chunk=>html+=chunk);output.on('end',()=>resolve(html));output.on('error',reject);
  const stream=renderToPipeableStream(element,{onAllReady(){stream.pipe(output);},onShellError:reject,onError:reject});
 });
}
export async function prerender(mode,base,allowed,mount='/'){
 const server=await createServer({configFile:false,mode,base:mount,cacheDir:'node_modules/.vite-prerender',server:{middlewareMode:true,watch:null,hmr:false,ws:false},optimizeDeps:{noDiscovery:true,include:[]},plugins:[react()],define:{'import.meta.env.VITE_ENABLE_REVIEWS':JSON.stringify('false'),'import.meta.env.VITE_SITE_URL':JSON.stringify(base),'import.meta.env.VITE_ALLOW_INDEXING':JSON.stringify(String(allowed)),'import.meta.env.VITE_BUILD_YEAR':JSON.stringify(String(new Date().getFullYear()))}});
 try{
  const {default:App}=await server.ssrLoadModule('/src/App.tsx');
  const {AppErrorBoundary}=await server.ssrLoadModule('/src/components/AppErrorBoundary.tsx');
  const manifest=JSON.parse(readFileSync('dist/.vite/manifest.json','utf8'));
  const assets=Object.entries(manifest).filter(([,entry])=>entry.src).map(([key,entry])=>[mount+key,mount+entry.file]);
  const pages={};
  for(const path of Object.keys(pageMetadata)){
   let html=await renderComplete(createElement(StrictMode,null,createElement(AppErrorBoundary,null,createElement(App,{initialPath:path}))));
   for(const [source,target]of assets)html=html.replaceAll(source,target);
   if(html.includes('/src/assets/'))throw new Error(`Unresolved static asset in ${path}`);
   pages[path]=html;
  }
  return pages;
 }finally{await server.close();}
}
