import {useGSAP} from '@gsap/react';
import gsap from 'gsap';
import type {RefObject} from 'react';

gsap.registerPlugin(useGSAP);

// Reveal the original shaped text rather than splitting it into letter spans.
// Range-based masks leave kerning, wrapping, selection and accessible names intact.
export function useLegalIntro(scope:RefObject<HTMLElement|null>){
 useGSAP(()=>{
  const root=scope.current;
  const reduced=matchMedia('(prefers-reduced-motion:reduce)');
  if(!root||reduced.matches||new URLSearchParams(location.search).get('legalIntro')==='off')return;
  const title=root.querySelector<HTMLElement>('#page-title');
  const date=root.querySelector<HTMLElement>('.legal-reading-effective');
  if(!title||!date)return;
  const elements=[title,date],original=elements.map(el=>el.style.opacity);
  const masks:HTMLElement[]=[];
  let disposed=false,finished=false;
  const timeline=gsap.timeline({paused:true});
  gsap.set(elements,{opacity:0});
  const restore=()=>elements.forEach((el,i)=>{if(original[i])el.style.opacity=original[i];else el.style.removeProperty('opacity');});
  const removeMasks=()=>masks.splice(0).forEach(el=>el.remove());
  const finish=()=>{finished=true;timeline.progress(1);timeline.pause();removeMasks();restore();};
  const letterMasks=(element:HTMLElement)=>{
   const text=element.firstChild;
   if(!text||text.nodeType!==Node.TEXT_NODE)return [];
   const box=element.getBoundingClientRect(),letters:HTMLElement[]=[];
   const layer=document.createElement('span');layer.className='legal-letter-layer';layer.setAttribute('aria-hidden','true');
   for(const part of new Intl.Segmenter(undefined,{granularity:'grapheme'}).segment(text.textContent??'')){
    if(!part.segment.trim())continue;
    const range=document.createRange();range.setStart(text,part.index);range.setEnd(text,part.index+part.segment.length);
    for(const rect of range.getClientRects()){
     if(!rect.width||!rect.height)continue;
     const mask=document.createElement('span');mask.className='legal-letter-cover';
     mask.style.cssText=`left:${rect.left-box.left-.25}px;top:${rect.top-box.top}px;width:${rect.width+.5}px;height:${rect.height}px`;
     layer.append(mask);letters.push(mask);
    }
   }
   element.append(layer);masks.push(layer);return letters;
  };
  void document.fonts.ready.then(()=>{
   if(disposed||finished)return;
   const titleLetters=letterMasks(title),dateLetters=letterMasks(date);
   restore();
   timeline.to(titleLetters,{opacity:0,duration:.2,stagger:{amount:.35},ease:'power2.out'},.03)
    .to(dateLetters,{opacity:0,duration:.18,stagger:{amount:.27},ease:'power2.out'},'>+=.04')
    .eventCallback('onComplete',()=>{finished=true;removeMasks();restore();}).play();
  });
  const keyboard=(event:KeyboardEvent)=>{if(event.key==='Tab')finish();};
  const preference=()=>{if(reduced.matches)finish();};
  const visibility=()=>{if(document.hidden)finish();};
  root.addEventListener('pointerdown',finish,{capture:true});
  window.addEventListener('wheel',finish,{passive:true});
  window.addEventListener('touchstart',finish,{passive:true});
  window.addEventListener('keydown',keyboard);
  reduced.addEventListener('change',preference);
  document.addEventListener('visibilitychange',visibility);
  return()=>{
   disposed=true;removeMasks();restore();
   root.removeEventListener('pointerdown',finish,{capture:true});
   window.removeEventListener('wheel',finish);
   window.removeEventListener('touchstart',finish);
   window.removeEventListener('keydown',keyboard);
   reduced.removeEventListener('change',preference);
   document.removeEventListener('visibilitychange',visibility);
  };
 },{scope});
}
