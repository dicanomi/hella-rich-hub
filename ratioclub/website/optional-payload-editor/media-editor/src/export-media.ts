import {mkdir,copyFile,writeFile,rename} from 'node:fs/promises';
import path from 'node:path';
import type {Payload} from 'payload';
const website=path.resolve(process.cwd(),'..');
export const slots=[
 ['heroVideo','Index hero video','video'],
 ['heroPosterDesktop','Index still image — desktop','image'],
 ['heroPosterMobile','Index still image — mobile','image'],
 ['mediaDivider','Index media divider','image'],
 ['notFoundDesktop','404 background — desktop','image'],
 ['notFoundMobile','404 background — mobile','image'],
 ['socialCard','Social sharing card — 1200 × 630','image'],
] as const;
let pending=Promise.resolve();
export function exportMedia(payload:Payload){
 pending=pending.catch(()=>{}).then(async()=>{
  const doc=await payload.findGlobal({slug:'site-media',depth:1});
  const result:Record<string,string>={};
  await mkdir(path.join(website,'public/cms-media'),{recursive:true});
  for(const[key,,kind]of slots){
   const asset=(doc as unknown as Record<string,unknown>)[key] as {id:number|string,filename?:string,mimeType?:string}|null;
   if(!asset||typeof asset!=='object'||!asset.filename||!asset.mimeType?.startsWith(kind+'/'))continue;
   const ext=path.extname(asset.filename).toLowerCase();
   if(!['.webp','.avif','.png','.jpg','.jpeg','.mp4','.webm'].includes(ext))continue;
   const filename=String(asset.id).replace(/[^a-zA-Z0-9_-]/g,'')+ext;
   try{await copyFile(path.join(process.cwd(),'media',path.basename(asset.filename)),path.join(website,'public/cms-media',filename));result[key]='/cms-media/'+filename;}catch{ /* Missing/deleted media keeps the original fallback. */ }
  }
  const target=path.join(website,'src/content/media-overrides.json');
  const value=JSON.stringify(result,null,2)+'\n';
  await writeFile(target+'.tmp',value);await rename(target+'.tmp',target);
 });
 return pending;
}
