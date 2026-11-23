import {useEffect,type RefObject} from 'react';

// Match visible content edges, without removing padding inside cards or tables.
export function useAboutSectionGaps(scope:RefObject<HTMLElement|null>){
 useEffect(()=>{
  const root=scope.current;
  if(!root)return;
  const sections=[...root.querySelectorAll<HTMLElement>('.about-section')];
  const reference=root.querySelector<HTMLElement>('#about-heritage');
  if(!reference)return;
  let frame=0,disposed=false;
  const trailingSpace=(section:HTMLElement)=>{
   const content=section.lastElementChild!;
   const bottoms:number[]=[];
   for(const element of content.querySelectorAll<HTMLElement>('p,h3,td,th,blockquote,.about-feature-card')){
    if(!element.getClientRects().length)continue;
    if(element.matches('blockquote')||parseFloat(getComputedStyle(element).borderBottomWidth)>0)bottoms.push(element.getBoundingClientRect().bottom);
    if(element.matches('p,h3,td,th')){
     const range=document.createRange();range.selectNodeContents(element);
     for(const rect of range.getClientRects())if(rect.width&&rect.height)bottoms.push(rect.bottom);
    }
   }
   return bottoms.length?content.getBoundingClientRect().bottom-Math.max(...bottoms):0;
  };
  const measure=()=>{
   if(disposed)return;
   const referenceTrailing=trailingSpace(reference);
   const updates=sections.filter(section=>section!==reference).map(section=>({section,correction:referenceTrailing-trailingSpace(section)}));
   for(const {section,correction} of updates)section.style.setProperty('--about-gap-correction',`${correction}px`);
  };
  const schedule=()=>{cancelAnimationFrame(frame);frame=requestAnimationFrame(measure);};
  const observer=new ResizeObserver(schedule);
  for(const section of sections)if(section.lastElementChild)observer.observe(section.lastElementChild);
  window.addEventListener('resize',schedule);
  void document.fonts.ready.then(schedule);
  schedule();
  return()=>{disposed=true;cancelAnimationFrame(frame);observer.disconnect();window.removeEventListener('resize',schedule);for(const section of sections)section.style.removeProperty('--about-gap-correction');};
 },[scope]);
}
