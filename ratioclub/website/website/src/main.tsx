import {preloadRoute} from './route-modules';
import {initializeScrollRestoration,restoreScrollPosition,saveScrollPosition} from "./scroll-restoration";
import {routePath} from "./config/paths";
import { StrictMode } from "react";
import { createRoot,hydrateRoot } from "react-dom/client";
import { flushSync } from "react-dom";
import App from "./App";
import { AppErrorBoundary } from "./components/AppErrorBoundary";
import "./styles.css";
import "./sections.css";
import "./typography.css";
import "./actions.css";
import {openContactModal} from './components/contact-modal-events';

initializeScrollRestoration();

const root=document.getElementById('root')!;
const initialPath=root.dataset.route??routePath(location.pathname);
let navigation=0;
let pendingFocus=false;
const focusDestination=()=>{
 if(!pendingFocus)return;pendingFocus=false;
 let target:HTMLElement|null=null;
 try{target=location.hash?document.getElementById(decodeURIComponent(location.hash.slice(1))):null;}catch{/* Invalid fragment falls back to heading. */}
 target??=document.querySelector<HTMLElement>('main h1,#page-title,#hero-title');
 target?.setAttribute('tabindex','-1');target?.focus({preventScroll:true});
 if(location.hash)restoreScrollPosition(null);
};
window.addEventListener('ratioclub:route-ready',focusDestination);
const boot=async()=>{
 if(root.hasChildNodes()&&root.dataset.prerendered==='true'){
  await preloadRoute(initialPath);
  hydrateRoot(root,<StrictMode><AppErrorBoundary><App initialPath={initialPath}/></AppErrorBoundary></StrictMode>,{
   onRecoverableError:error=>console.error('Hydration recovery:',error),
  });
 }else{
  flushSync(()=>createRoot(root).render(<StrictMode><AppErrorBoundary><App initialPath={initialPath}/></AppErrorBoundary></StrictMode>));
 }
 restoreScrollPosition();
};
void boot().catch(error=>console.error('Application startup failed:',error));

// Keep ordinary site navigation in the same document, with no transition layer.
const navigateOnClick=async(event:MouseEvent)=>{
  if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
  const anchor = event.target instanceof Element ? event.target.closest<HTMLAnchorElement>("a[href]") : null;
  if(root.dataset.hydrated!=='true')return;
  if (!anchor || anchor.hasAttribute("download") || (anchor.target && anchor.target !== "_self")) return;
  if(anchor.hasAttribute('data-contact-modal')){
    event.preventDefault();event.stopPropagation();openContactModal(anchor);return;
  }
  const destination = new URL(anchor.href);
  if (destination.origin !== location.origin) return;
  const samePage=destination.pathname===location.pathname;
  const pageNavigation=!!anchor.closest("footer nav,.expanded-navigation");
  // Same-page fragment links retain their section behavior. Every ordinary
  // internal page link, including logos and dialog links, responds immediately.
  if(samePage&&destination.hash&&!pageNavigation)return;
  if (!["/", "/contact", "/solutions", "/about", "/terms-and-conditions", "/privacy-notice"].includes(routePath(destination.pathname))) return;
  event.preventDefault();
  const token=++navigation;
  try{await preloadRoute(routePath(destination.pathname));}catch{location.assign(destination.href);return;}
  if(token!==navigation)return;
  pendingFocus=true;
  anchor.closest<HTMLDialogElement>("dialog[open]")?.close();
  if(samePage){
    // A repeated footer/menu destination is an explicit return-to-top action.
    // Replace the current URL (including stale fragments), not a duplicate entry.
    try{history.replaceState(history.state,"",destination);}catch{/* Return-to-top still works if history is rate-limited. */}
    restoreScrollPosition({x:0,y:0},false);
  }else{
    saveScrollPosition(true);
    try{history.pushState(null, "", destination);}
    catch{location.assign(destination.href);return;}
    window.dispatchEvent(new Event("ratioclub:navigate"));
  }
  // A resolved lazy route commits before its RouteReady layout effect focuses it.
  if(samePage)focusDestination();
};
document.addEventListener("click",navigateOnClick,{capture:true});
if(import.meta.hot)import.meta.hot.dispose(()=>{document.removeEventListener('click',navigateOnClick,{capture:true});window.removeEventListener('ratioclub:route-ready',focusDestination);});
