import {getPayload} from 'payload';
import config from '../src/payload.config';
import path from 'node:path';
const payload=await getPayload({config});
const defaults=[
 ['Original — Index hero video','hero-review-updated.mp4'],
 ['Original — Index still desktop','404-video-frame-desktop.webp'],
 ['Original — Index still mobile','404-video-frame-mobile.webp'],
 ['Original — media divider','media-divider.webp'],
 ['Original — 404 background','404-video-frame-desktop.webp'],
] as const;
for(const [title,file]of defaults){if((await payload.count({collection:'media',where:{title:{equals:title}}})).totalDocs)continue;await payload.create({collection:'media',data:{title,alt:''},filePath:path.resolve('..','src/assets',file)});}
if(!(await payload.count({collection:'media',where:{title:{equals:'Original — social sharing card'}}})).totalDocs)await payload.create({collection:'media',data:{title:'Original — social sharing card',alt:''},filePath:path.resolve('..','public/social/web-card.png')});
console.log('Original media added to the library. All website slots remain on their existing fallbacks.');
await payload.destroy();
