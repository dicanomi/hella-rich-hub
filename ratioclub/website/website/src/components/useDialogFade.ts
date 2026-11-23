import {useCallback,useEffect,useRef,type RefObject} from 'react';
import './dialog-motion.css';
const reduced=()=>matchMedia('(prefers-reduced-motion:reduce)').matches;

export function useDialogFade(dialog:RefObject<HTMLDialogElement|null>){
 const animation=useRef<Animation|null>(null),closing=useRef(false);
 useEffect(()=>()=>{animation.current?.cancel();},[]);
 const openModal=useCallback(()=>{
  const element=dialog.current;if(!element)return;
  animation.current?.cancel();closing.current=false;element.removeAttribute('data-closing');
  element.showModal();
  if(!reduced())animation.current=element.animate([{opacity:0},{opacity:1}],{duration:180,easing:'ease-out'});
 },[dialog]);
 const closeModal=useCallback(()=>{
  const element=dialog.current;if(!element?.open||closing.current)return;
  if(reduced()){element.close();return;}
  closing.current=true;element.setAttribute('data-closing','true');animation.current?.cancel();
  const fade=element.animate([{opacity:1},{opacity:0}],{duration:180,easing:'ease-in',fill:'forwards'});
  animation.current=fade;
  void fade.finished.then(()=>{
   element.close();fade.cancel();element.removeAttribute('data-closing');closing.current=false;
  }).catch(()=>{});
 },[dialog]);
 return {openModal,closeModal};
}
