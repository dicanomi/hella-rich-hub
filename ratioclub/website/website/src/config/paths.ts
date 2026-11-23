// The same source supports the local root and an explicitly configured review path.
export function sitePath(path:string):string {
 if(!path.startsWith('/')||path.startsWith('//'))return path;
 return `${import.meta.env.BASE_URL}${path.slice(1)}`;
}
export function routePath(pathname:string):string {
 const base=import.meta.env.BASE_URL;
 const path=base!=='/'&&pathname.startsWith(base)?'/'+pathname.slice(base.length):pathname;
 return path.replace(/\/$/,'')||'/';
}
