import {useGSAP} from '@gsap/react';
import gsap from 'gsap';
import type {RefObject} from 'react';

gsap.registerPlugin(useGSAP);

export function useSubpageArtworkIntro(scope:RefObject<HTMLElement|null>,visit:string){
 useGSAP((_context,contextSafe)=>{
  const image=scope.current?.querySelector<HTMLImageElement>('.subpage-hero-artwork img');
  // Interactive golden-ratio heroes start stationary; their component owns hover motion.
  const artwork=image?.parentElement;
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  if(!artwork||!contextSafe||reduced.matches||new URLSearchParams(location.search).get('shapeIntro')==='off')return;
  let tween:gsap.core.Tween|undefined;
  const start=contextSafe(()=>{
   if(reduced.matches)return;
   tween=gsap.fromTo(artwork,{rotation:0,transformOrigin:'50% 50%'},{rotation:360,duration:1.5,ease:'power2.inOut',clearProps:'transform,transformOrigin'});
  });
  const preference=()=>{if(reduced.matches)tween?.progress(1);};
  if(!image || (image.complete&&image.naturalWidth))start();
  else image?.addEventListener('load',start,{once:true});
  reduced.addEventListener('change',preference);
  return ()=>{
   image?.removeEventListener('load',start);
   reduced.removeEventListener('change',preference);
  };
 },{scope,dependencies:[visit],revertOnUpdate:true});
}
