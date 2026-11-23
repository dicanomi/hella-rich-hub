import {useCallback,useEffect,useId,useRef,useState,type KeyboardEvent} from 'react';
import {contactConfig} from '../config/contact';
import {openContactEvent} from './contact-modal-events';
import {useDialogBackdropDismiss} from './useDialogBackdropDismiss';
import {useDialogFade} from './useDialogFade';
import {ModalCloseSymbol} from "./ModalCloseSymbol";
import copyIcon from '../assets/contact-copy.svg';
import './privacy-choices.css';
import './contact-modal.css';
import './fullscreen-dialog.css';

export function ContactModal(){
 const id=useId(),dialog=useRef<HTMLDialogElement>(null),close=useRef<HTMLButtonElement>(null);
 const {openModal,closeModal}=useDialogFade(dialog);
 const backdrop=useDialogBackdropDismiss(closeModal);
 const opener=useRef<HTMLElement|null>(null),timer=useRef(0),generation=useRef(0);
 const [feedback,setFeedback]=useState('');
 const reset=useCallback(()=>{generation.current++;clearTimeout(timer.current);setFeedback('');},[]);
 useEffect(()=>{
  const open=(event:Event)=>{
   const source=(event as CustomEvent<HTMLElement>).detail;
   opener.current=source.closest('.expanded-navigation')?.closest('header')?.querySelector<HTMLElement>('.menu-toggle')??source;
   reset();openModal();close.current?.focus({preventScroll:true});
  };
  window.addEventListener(openContactEvent,open);
  return()=>{window.removeEventListener(openContactEvent,open);clearTimeout(timer.current);};
 },[openModal,reset]);
 async function copy(source:HTMLButtonElement){
  const token=++generation.current;clearTimeout(timer.current);
  let success=false;
  try{await navigator.clipboard.writeText(contactConfig.email);success=true;}catch{
   // Older browsers may lack Clipboard API permission. Use a local selection
   // inside the dialog; never claim success unless the copy command succeeds.
   const selection=document.createElement('textarea');selection.value=contactConfig.email;selection.readOnly=true;
   selection.className='contact-copy-fallback';dialog.current?.append(selection);
   try{selection.select();success=document.execCommand('copy');}catch{/* Show failure feedback below. */}
   finally{selection.remove();source.focus({preventScroll:true});}
  }
  if(token!==generation.current||!dialog.current?.open)return;
  setFeedback(success?'Copied':'Copy failed');
  timer.current=window.setTimeout(()=>setFeedback(''),2500);
 }
 function trapFocus(event:KeyboardEvent<HTMLDialogElement>){
  if(event.key!=='Tab')return;
  const items=[...event.currentTarget.querySelectorAll<HTMLButtonElement>('button:not(:disabled)')];
  const current=items.indexOf(document.activeElement as HTMLButtonElement);
  event.preventDefault();items[(current+(event.shiftKey?-1:1)+items.length)%items.length]?.focus({preventScroll:true});
 }
 return <dialog {...backdrop} ref={dialog} className="contact-dialog fullscreen-dialog" aria-labelledby={id+'-title'} aria-describedby={id+'-description'} onKeyDown={trapFocus} onCancel={event=>{event.preventDefault();closeModal();}} onClose={()=>{reset();if(opener.current?.isConnected)opener.current.focus({preventScroll:true});}}>
  <div className="fullscreen-dialog-stage"><div className="fullscreen-dialog-container">
  <div className="privacy-dialog-header contact-dialog-header"><h2 id={id+'-title'}>Contact</h2><button ref={close} type="button" className="menu-toggle contact-close" aria-label="Close contact" onClick={closeModal}><ModalCloseSymbol/></button></div>
  <div className="contact-dialog-content">
   <p className="contact-dialog-lead">Let’s talk about what you’re building.</p>
   <p className="contact-dialog-description" id={id+'-description'}>Tell us about your infrastructure, the challenge you’re working through, or a collaboration you have in mind.</p>
   <div className="contact-copy-row">
    <span className="contact-copy-feedback" role="status" aria-live="polite" aria-atomic="true" data-visible={Boolean(feedback)}>{feedback}</span>
    <button type="button" className="contact-copy-email" aria-label={`Copy ${contactConfig.email}`} onClick={event=>void copy(event.currentTarget)}>{contactConfig.email}</button>
    <button type="button" className="contact-copy-icon" aria-label="Copy email address" onClick={event=>void copy(event.currentTarget)}><img src={copyIcon} width="17" height="17" alt=""/></button>
   </div>
  </div>
  </div></div>
 </dialog>;
}
