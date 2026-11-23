import {useRef,type PointerEvent,type MouseEvent} from 'react';
// Only a desktop mouse press and release outside the centered content dismisses
// a full-screen dialog. Padding inside that container and drags stay safe.
export function useDialogBackdropDismiss(dismiss:()=>void){
 const pressedOutside=useRef(false);
 const outside=(event:MouseEvent<HTMLDialogElement>|PointerEvent<HTMLDialogElement>)=>{
  const container=event.currentTarget.querySelector('.fullscreen-dialog-container')??event.currentTarget;
  const rect=container.getBoundingClientRect();
  return event.clientX<rect.left||event.clientX>rect.right||event.clientY<rect.top||event.clientY>rect.bottom;
 };
 return {
  onPointerDown:(event:PointerEvent<HTMLDialogElement>)=>{pressedOutside.current=event.button===0&&event.pointerType==='mouse'&&matchMedia('(min-width:601px) and (hover:hover) and (pointer:fine)').matches&&outside(event);},
  onClick:(event:MouseEvent<HTMLDialogElement>)=>{if(pressedOutside.current&&outside(event))dismiss();pressedOutside.current=false;},
 };
}
