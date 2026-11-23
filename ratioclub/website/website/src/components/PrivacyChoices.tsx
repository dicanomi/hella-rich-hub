import {sitePath} from "../config/paths";
import privacyIcon from "../assets/privacy-options-muted.svg";
import privacyLightIcon from "../assets/privacy-options-graphite.svg";
import {ModalCloseSymbol} from "./ModalCloseSymbol";
import {useCallback,useEffect,useLayoutEffect,useId,useRef,useState,type KeyboardEvent} from 'react';
import {privacySignals,readPrivacyChoice,savePrivacyChoice} from '../privacy/preferences';
import './privacy-choices.css';
import './fullscreen-dialog.css';
import {useDialogBackdropDismiss} from './useDialogBackdropDismiss';
import {useDialogFade} from './useDialogFade';
// Page-level triggers reuse the footer-owned dialog and restore focus to their opener.
const openPrivacyEvent='ratioclub:open-privacy-choices';
export function PrivacyChoicesLink(){
 return <button type="button" className="privacy-trigger" aria-haspopup="dialog" onClick={event=>window.dispatchEvent(new CustomEvent(openPrivacyEvent,{detail:event.currentTarget}))}><img src={privacyLightIcon} width="30" height="14" alt="" aria-hidden="true"/><span>Your privacy choices</span></button>;
}
export function PrivacyChoices(){
 const id=useId();const dialog=useRef<HTMLDialogElement>(null);const trigger=useRef<HTMLButtonElement>(null);
 const {openModal,closeModal}=useDialogFade(dialog);
 const backdrop=useDialogBackdropDismiss(closeModal);
 const opener=useRef<HTMLButtonElement|null>(null);
 const [signals,setSignals]=useState({gpc:false,dnt:false});const [saved,setSaved]=useState(false);const [storageError,setStorageError]=useState(false);
 const [switchIntro,setSwitchIntro]=useState(0);
 const [preferences,setPreferences]=useState({analytics:false,marketing:false});
 const open=useCallback((source=trigger.current)=>{
  opener.current=source;const detected=privacySignals(),choice=readPrivacyChoice();setSignals(detected);setSaved(Boolean(choice));
  setPreferences({analytics:Boolean(choice?.analytics)&&!detected.dnt,marketing:Boolean(choice?.marketing)&&!detected.gpc&&!detected.dnt});
  setStorageError(false);setSwitchIntro(value=>value+1);openModal();dialog.current?.querySelector<HTMLButtonElement>(".privacy-close")?.focus();
 },[openModal]);
 useLayoutEffect(()=>{
  const element=dialog.current;
  if(!element||!switchIntro||matchMedia('(prefers-reduced-motion:reduce)').matches)return;
  element.setAttribute('data-switch-intro','');
  const finish=()=>element.removeAttribute('data-switch-intro');
  const timer=setTimeout(finish,280);
  element.addEventListener('pointerdown',finish,{once:true});
  element.addEventListener('keydown',finish,{once:true});
  return()=>{clearTimeout(timer);finish();element.removeEventListener('pointerdown',finish);element.removeEventListener('keydown',finish);};
 },[switchIntro]);
 useEffect(()=>{const handle=(event:Event)=>open((event as CustomEvent<HTMLButtonElement>).detail);window.addEventListener(openPrivacyEvent,handle);return()=>window.removeEventListener(openPrivacyEvent,handle);},[open]);
 function trapFocus(event:KeyboardEvent<HTMLDialogElement>){
  if(event.key!=='Tab')return;
  const items=Array.from(event.currentTarget.querySelectorAll<HTMLElement>('a[href],button:not([disabled]),input:not([disabled]),[tabindex="0"]')).filter(el=>el.getClientRects().length>0);
  const first=items[0],last=items.at(-1);if(!first||!last)return;
  const current=items.indexOf(document.activeElement as HTMLElement);
  const next=current<0?(event.shiftKey?items.length-1:0):(current+(event.shiftKey?-1:1)+items.length)%items.length;
  event.preventDefault();items[next].focus();
 }
 function save(reject=false){if(savePrivacyChoice(reject?{analytics:false,marketing:false}:preferences)){setSaved(true);closeModal();}else setStorageError(true);}
 return <>
  <button type="button" className="privacy-trigger" ref={trigger} onClick={()=>open()} aria-haspopup="dialog"><img src={privacyIcon} width="30" height="14" alt="" aria-hidden="true"/><span>Your privacy choices</span></button>
  <dialog {...backdrop} className="privacy-dialog fullscreen-dialog" ref={dialog} onKeyDown={trapFocus} onCancel={event=>{event.preventDefault();closeModal();}} aria-labelledby={id+'-title'} aria-describedby={id+'-intro'} onClose={()=>opener.current?.focus({preventScroll:true})}>
   <div className="fullscreen-dialog-stage"><div className="fullscreen-dialog-container">
   <div className="privacy-dialog-header"><h2 id={id+'-title'}>Privacy Choices</h2><button type="button" className="menu-toggle privacy-close" aria-label="Close" onClick={closeModal}><ModalCloseSymbol/></button></div>
   <div className="privacy-dialog-body">
    <p id={id+'-intro'}>No analytics or advertising integrations are enabled on this website. Optional tracking stays off. You can return here at any time to save your privacy choices.</p>
    {signals.gpc?<p className="privacy-signal" role="status">Global Privacy Control (GPC) Signal Honored</p>:null}
    {signals.dnt?<p className="privacy-signal">Do Not Track signal detected. Optional tracking remains off.</p>:null}
    <div className="privacy-option"><div><label htmlFor={id+'-necessary'}>Strictly necessary</label><p>Supports essential site functions and remembers a privacy choice when you save it.</p><span className="privacy-option-note" id={id+'-necessary-note'}>Required</span></div><input id={id+'-necessary'} type="checkbox" role="switch" checked disabled aria-checked="true" aria-describedby={id+'-necessary-note'}/></div>
    <div className="privacy-option"><div><label htmlFor={id+'-analytics'}>Analytics</label><p id={id+'-analytics-description'}>No analytics tools are installed. This switch saves your preference only.</p><span className="privacy-option-note" id={id+'-analytics-note'}>{signals.dnt?'DNT honored':null}</span></div><input id={id+'-analytics'} type="checkbox" role="switch" checked={preferences.analytics} disabled={signals.dnt} onChange={event=>setPreferences(value=>({...value,analytics:event.target.checked}))} aria-checked={preferences.analytics} aria-describedby={`${id}-analytics-description ${id}-analytics-note`}/></div>
    <div className="privacy-option"><div><label htmlFor={id+'-marketing'}>Marketing and sharing</label><p id={id+'-marketing-description'}>No advertising or sharing tools are installed. This switch saves your preference only.</p><span className="privacy-option-note" id={id+'-marketing-note'}>{signals.gpc||signals.dnt?'Opt-out honored':null}</span></div><input id={id+'-marketing'} type="checkbox" role="switch" checked={preferences.marketing} disabled={signals.gpc||signals.dnt} onChange={event=>setPreferences(value=>({...value,marketing:event.target.checked}))} aria-checked={preferences.marketing} aria-describedby={`${id}-marketing-description ${id}-marketing-note`}/></div>
    <div className="privacy-actions"><button type="button" className="primary-action" onClick={()=>save(true)}>Reject optional</button><button type="button" className="primary-action" onClick={()=>save()}>Save choices</button></div>
    <div className="privacy-notices">
    <p className="privacy-policy-links"><a href={sitePath("/privacy-notice")}>Privacy Notice</a><span aria-hidden="true"> · </span><a href={sitePath("/terms-and-conditions")}>Terms &amp; Conditions</a></p>
    <p className="privacy-draft-note">Legal notices remain placeholders awaiting approval.</p>
    {saved?<p className="privacy-saved">Your preferences are saved. Tracking integrations remain disconnected.</p>:null}
    {storageError?<p role="status">Your browser could not save this preference. Optional tracking remains off.</p>:null}
    </div>
   </div>
   </div></div>
  </dialog>
 </>;
}
