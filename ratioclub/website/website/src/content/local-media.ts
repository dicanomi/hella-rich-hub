import overrides from './media-overrides.json' with {type:'json'};
export type MediaSlot='heroVideo'|'heroPosterDesktop'|'heroPosterMobile'|'mediaDivider'|'notFoundDesktop'|'notFoundMobile'|'socialCard';
// Only local exported assets are accepted. Empty, missing or invalid entries use the original.
export function localMedia(slot:MediaSlot,fallback:string):string{
 const value=(overrides as Record<string,unknown>)[slot];
 return typeof value==='string'&&/^\/cms-media\/[a-zA-Z0-9_-]+\.(webp|avif|png|jpe?g|mp4|webm)$/.test(value)?value:fallback;
}
