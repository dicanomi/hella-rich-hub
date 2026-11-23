import {useGSAP} from '@gsap/react';
import gsap from 'gsap';
import type {RefObject} from 'react';

gsap.registerPlugin(useGSAP);

export function useQuoteReveal(scope:RefObject<HTMLElement|null>,enabled:boolean){
 useGSAP(()=>{
  const root=scope.current;
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  if(!root||!enabled||reduced.matches||new URLSearchParams(location.search).get('quote')==='off'||typeof IntersectionObserver==='undefined')return;
  const quote=root.querySelector('blockquote');
  const attribution=root.querySelector('figcaption');
  if(!quote||!attribution)return;
  const timeline=gsap.timeline({paused:true,defaults:{ease:'power2.out'}});
  gsap.set([quote,attribution],{opacity:0});
  timeline.to(quote,{opacity:1,duration:.65,clearProps:'opacity'})
   .to(attribution,{opacity:1,duration:.4,clearProps:'opacity'});
  const observer=new IntersectionObserver(entries=>{
   if(entries.some(entry=>entry.isIntersecting)){
    timeline.play();
    observer.disconnect();
   }
  },{rootMargin:'0px 0px -12% 0px'});
  observer.observe(root);
  const finish=()=>{timeline.progress(1);observer.disconnect();};
  const preference=()=>{if(reduced.matches)finish();};
  root.addEventListener('pointerdown',finish);
  reduced.addEventListener('change',preference);
  return ()=>{
   observer.disconnect();
   root.removeEventListener('pointerdown',finish);
   reduced.removeEventListener('change',preference);
  };
 },{scope,dependencies:[enabled],revertOnUpdate:true});
}
