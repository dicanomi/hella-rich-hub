import {pageMetadata} from './page-metadata.ts';
import {publicPaths} from './indexing.ts';
export function structuredData(path:string,base:string){
 if(!publicPaths.includes(path))return null;
 const page=pageMetadata[path as keyof typeof pageMetadata];
 const organization=new URL('#organization',base).href;
 return {'@context':'https://schema.org','@graph':[
  {'@type':'Organization','@id':organization,name:'RatioClub',url:new URL('./',base).href,description:pageMetadata['/'].description},
  {'@type':'WebSite','@id':new URL('#website',base).href,url:new URL('./',base).href,name:'RatioClub',publisher:{'@id':organization}},
  {'@type':path==='/about'?'AboutPage':path==='/contact'?'ContactPage':'WebPage','@id':new URL((path+'#webpage').replace(/^\//,''),base).href,url:new URL(path.replace(/^\//,''),base).href,name:page.title,description:page.description,isPartOf:{'@id':new URL('#website',base).href},about:{'@id':organization}}
 ]};
}
