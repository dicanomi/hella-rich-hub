import {initializeScrollRestoration,restoreScrollPosition,saveScrollPosition} from "./scroll-restoration";
import {routePath} from "./config/paths";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { flushSync } from "react-dom";
import App from "./App";
import { AppErrorBoundary } from "./components/AppErrorBoundary";
import "./styles.css";
import "./sections.css";
import "./typography.css";
import "./actions.css";
import {openContactModal} from './components/contact-modal-events';

initializeScrollRestoration();

// Commit before the render-blocking entry module releases the first paint.
flushSync(() => createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AppErrorBoundary><App /></AppErrorBoundary>
  </StrictMode>,
));

restoreScrollPosition();

// Keep ordinary site navigation in the same document, with no transition layer.
const navigateOnClick=(event:MouseEvent)=>{
  if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
  const anchor = event.target instanceof Element ? event.target.closest<HTMLAnchorElement>("a[href]") : null;
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
  let fragmentTarget: HTMLElement | null = null;
  try { fragmentTarget = destination.hash ? document.getElementById(decodeURIComponent(destination.hash.slice(1))) : null; }
  catch { /* Malformed hashes should never interrupt navigation. */ }
  const heading = fragmentTarget ?? document.querySelector<HTMLElement>("main h1, #page-title, #hero-title");
  if (heading) {
    heading.setAttribute("tabindex", "-1");
    heading.focus({preventScroll:true});
  }
};
document.addEventListener("click",navigateOnClick,{capture:true});
if(import.meta.hot)import.meta.hot.dispose(()=>document.removeEventListener("click",navigateOnClick,{capture:true}));
