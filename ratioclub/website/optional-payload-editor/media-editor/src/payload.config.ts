import path from 'node:path';
import {APIError,buildConfig,type Access,type CollectionBeforeOperationHook} from 'payload';
import {sqliteAdapter} from '@payloadcms/db-sqlite';
import sharp from 'sharp';
import {exportMedia,slots} from './export-media';
const signedIn:Access=({req})=>Boolean(req.user);
const admin:Access=({req})=>(req.user as {role?:string}|null)?.role==='admin';
const validateUpload:CollectionBeforeOperationHook=({req,operation})=>{
 if(!['create','update'].includes(operation)||!req.file)return;
 const {data,mimetype,size,name}=req.file;
 const image=mimetype.startsWith('image/');
 if(size>(image?5:50)*1024*1024)throw new APIError(image?'Images must be 5 MB or smaller.':'Videos must be 50 MB or smaller.',400);
 const signature=data.subarray(0,32);
 const signatures:Record<string,boolean>={
  'image/png':signature.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])),
  'image/jpeg':signature[0]===255&&signature[1]===216&&signature[2]===255,
  'image/webp':signature.toString('ascii',0,4)==='RIFF'&&signature.toString('ascii',8,12)==='WEBP',
  'image/avif':signature.toString('ascii',4,8)==='ftyp'&&/avif|avis/.test(signature.toString('ascii',8)),
  'video/mp4':signature.toString('ascii',4,8)==='ftyp',
  'video/webm':signature.subarray(0,4).equals(Buffer.from([26,69,223,163])),
 };
 const extensions:Record<string,string[]>={'image/png':['.png'],'image/jpeg':['.jpg','.jpeg'],'image/webp':['.webp'],'image/avif':['.avif'],'video/mp4':['.mp4'],'video/webm':['.webm']};
 if(!signatures[mimetype]||!extensions[mimetype]?.includes(path.extname(name).toLowerCase()))throw new APIError('Use a valid PNG, JPEG, WebP, AVIF, MP4 or WebM file with its matching extension.',400);
};
const secret=process.env.PAYLOAD_SECRET;
if(!secret)throw new Error('Missing local PAYLOAD_SECRET. Run npm run editor:setup from the website folder.');
export default buildConfig({
 secret,
 serverURL:'http://127.0.0.1:5197',
 telemetry:false,
 admin:{user:'users',meta:{titleSuffix:'— RatioClub local media editor'},importMap:{baseDir:process.cwd()}},
 cors:['http://127.0.0.1:5197'],csrf:['http://127.0.0.1:5197'],
 db:sqliteAdapter({push:process.env.PAYLOAD_DB_PUSH==='true',client:{url:process.env.DATABASE_URL||'file:./data/editor.db'}}),
 sharp,
 email:()=>({name:'disconnected',defaultFromAddress:'noreply@localhost.invalid',defaultFromName:'Local preview',sendEmail:async()=>{throw new Error('Email delivery is disconnected in this local editor.');}}),
 upload:{limits:{fileSize:50*1024*1024}},
 collections:[{
  slug:'users',auth:{forgotPassword:{expiration:0}},
  admin:{useAsTitle:'email'},
  access:{create:admin,read:({req})=>req.user ? admin({req})||{id:{equals:req.user.id}} : false,update:({req})=>req.user ? admin({req})||{id:{equals:req.user.id}} : false,delete:()=>false},
  fields:[{name:'role',type:'select',options:['admin','editor'],defaultValue:'editor',required:true,admin:{condition:(_data,_siblingData,{user})=>user?.role==='admin'},access:{create:({req})=>Boolean((req.user as {role?:string}|null)?.role==='admin'),update:({req})=>Boolean((req.user as {role?:string}|null)?.role==='admin')}}],
  hooks:{beforeChange:[async({data,operation,req})=>{if(operation==='create'&&(await req.payload.count({collection:'users'})).totalDocs===0)data.role='admin';return data;}]},
 },{
  slug:'media',labels:{singular:'Media asset',plural:'Media library'},admin:{useAsTitle:'title',description:'Local uploads only. Images: 5 MB maximum. Videos: 50 MB maximum. Original website assets stay available as fallbacks.'},
  access:{read:()=>true,create:signedIn,update:signedIn,delete:signedIn},
  upload:{staticDir:path.resolve(process.cwd(),'media'),mimeTypes:['image/png','image/jpeg','image/webp','image/avif','video/mp4','video/webm']},
  fields:[{name:'title',type:'text',required:true},{name:'alt',label:'Alternative text',type:'text',admin:{description:'Describe informative images. Leave decorative backgrounds empty.'}}],
  hooks:{beforeOperation:[validateUpload],afterChange:[async({req})=>{await exportMedia(req.payload);}],afterDelete:[async({req})=>{await exportMedia(req.payload);}]},
 }],
 globals:[{
  slug:'site-media',label:'Website media',admin:{description:'Choose a media asset for a slot, then Save. Clear a slot to restore the original. Changes update the local website; built snapshots need rebuilding. Layouts, fonts, diagrams and copy are locked.'},
  access:{read:signedIn,update:signedIn},
  fields:slots.map(([name,label,kind])=>({name,label,type:'upload' as const,relationTo:'media',filterOptions:name==='socialCard'?{mimeType:{equals:'image/png'}}:{mimeType:{contains:kind+'/'}},validate:async(value:unknown,{req}:{req:any})=>{
   if(!value)return true;const id=typeof value==='object'?(value as {id:unknown}).id:value;
   const asset=await req.payload.findByID({collection:'media',id});
   if(!asset.mimeType?.startsWith(kind+'/'))return `Choose ${kind==='video'?'a video':'an image'} for this slot.`;
   if(name==='socialCard'&&(asset.width!==1200||asset.height!==630||asset.mimeType!=='image/png'))return 'The social sharing card must be a 1200 × 630 PNG.';
   return true;
  }})),
  hooks:{afterChange:[async({req})=>{await exportMedia(req.payload);}]},
 }],
 typescript:{outputFile:path.resolve(process.cwd(),'src/payload-types.ts')},
});
