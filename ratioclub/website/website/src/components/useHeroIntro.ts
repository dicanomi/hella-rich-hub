import {useGSAP} from '@gsap/react';
import gsap from 'gsap';
import type {RefObject} from 'react';

gsap.registerPlugin(useGSAP);

// Preview-only: no layout/CSS changes; remove this hook to restore the original.
export function useHeroIntro(scope:RefObject<HTMLElement|null>){
 useGSAP(()=>{
  const root=scope.current;
  if(!root)return;
  const mode=new URLSearchParams(location.search).get('intro');
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  if(mode==='off'||reduced.matches)return;
  const header=[...root.querySelectorAll<HTMLElement>('.brand-link,.header-links,.menu-toggle')];
  const heading=root.querySelector<HTMLElement>('#hero-title');
  const actions=root.querySelector<HTMLElement>('.hero-actions');
  if(!heading||!actions)return;
  const targets=[...header,heading,actions];
  const timeline=gsap.timeline({defaults:{duration:.65,ease:'power2.out'}});
  gsap.set(targets,{autoAlpha:0});
  timeline.to(targets,{autoAlpha:1,clearProps:'opacity,visibility'},0);
  // Interaction takes priority over the intro; never delay navigation or scrolling.
  const finish=()=>{timeline.progress(1);};
  const keyboard=(event:KeyboardEvent)=>{if(event.key==='Tab')finish();};
  const preference=()=>{if(reduced.matches)finish();};
  const visibility=()=>{if(document.hidden)finish();};
  root.addEventListener('pointerdown',finish,{capture:true});
  window.addEventListener('keydown',keyboard);
  window.addEventListener('wheel',finish,{passive:true});
  window.addEventListener('touchmove',finish,{passive:true});
  reduced.addEventListener('change',preference);
  document.addEventListener('visibilitychange',visibility);
  return ()=>{
   root.removeEventListener('pointerdown',finish,{capture:true});
   window.removeEventListener('keydown',keyboard);
   window.removeEventListener('wheel',finish);
   window.removeEventListener('touchmove',finish);
   reduced.removeEventListener('change',preference);
   document.removeEventListener('visibilitychange',visibility);
  };
 },{scope});
}
