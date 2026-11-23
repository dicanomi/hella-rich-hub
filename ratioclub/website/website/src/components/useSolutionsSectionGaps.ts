import {useEffect,type RefObject} from 'react';

// Adjust only the space outside a section; card, table and CTA spacing stays intact.
export function useSolutionsSectionGaps(scope:RefObject<HTMLElement|null>){
 useEffect(()=>{
  const root=scope.current;
  if(!root)return;
  const sections=[...root.querySelectorAll<HTMLElement>('#solutions-content > .service-detail, #solutions-content > .solutions-quote, #solutions-comparison, #solutions-scoping')];
  let frame=0,disposed=false;
  const measure=()=>{
   if(disposed)return;
   const probe=document.createElement('div');
   probe.style.cssText='position:absolute;visibility:hidden;pointer-events:none;height:var(--solution-section-space)';
   root.append(probe);let target=probe.getBoundingClientRect().height;
   if(matchMedia("(max-width:600px)").matches){
    // About's mobile reference ends in a 16px / 24px Roboto paragraph.
    probe.style.height='auto';probe.style.font='400 16px/24px Roboto';probe.textContent='Reference';
    const range=document.createRange();range.selectNodeContents(probe);
    target+=probe.getBoundingClientRect().bottom-range.getBoundingClientRect().bottom;
   }
   probe.remove();
   const updates=sections.map(section=>{
    const next=section.nextElementSibling as HTMLElement|null;
    if(!next)return null;
    let bottom=section.getBoundingClientRect().top;
    if(section.matches('.solutions-quote'))bottom=section.querySelector('figure')!.getBoundingClientRect().bottom;
    else for(const el of section.querySelectorAll<HTMLElement>('p,li,h2,h3,td,th,figcaption,img,svg,.primary-action,.text-action')){
     if(!el.getClientRects().length)continue;
     if(el.matches('img,svg,.primary-action,.text-action'))bottom=Math.max(bottom,el.getBoundingClientRect().bottom);
     else {const range=document.createRange();range.selectNodeContents(el);for(const rect of range.getClientRects())if(rect.width&&rect.height)bottom=Math.max(bottom,rect.bottom);}
    }
    const nextTop=next.getBoundingClientRect().top+parseFloat(getComputedStyle(next).paddingTop);
    const current=parseFloat(getComputedStyle(section).paddingBottom);
    return {section,padding:Math.max(0,current+target-(nextTop-bottom))};
   });
   for(const update of updates)if(update)update.section.style.paddingBottom=`${update.padding}px`;
  };
  const schedule=()=>{cancelAnimationFrame(frame);frame=requestAnimationFrame(measure);};
  const observer=new ResizeObserver(schedule);
  for(const section of sections)for(const child of section.children)observer.observe(child);
  window.addEventListener('resize',schedule);void document.fonts.ready.then(schedule);schedule();
  return()=>{disposed=true;cancelAnimationFrame(frame);observer.disconnect();window.removeEventListener('resize',schedule);for(const section of sections)section.style.removeProperty('padding-bottom');};
 },[scope]);
}
