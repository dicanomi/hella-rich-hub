import {sitePath} from "../config/paths";
import {localMedia} from "../content/local-media";
import { Header } from '../components/Header';
import desktopFrameFallback from '../assets/404-video-frame-desktop.webp';
import mobileFrameFallback from '../assets/404-video-frame-mobile.webp';
import overlay from '../assets/hero-overlay.webp';
import mobileOverlay from '../assets/hero-overlay-mobile.webp';
import arrow from '../assets/arrow-right-desktop.svg';
import './not-found.css';
const desktopFrame=localMedia("notFoundDesktop",desktopFrameFallback);
const mobileFrame=localMedia("notFoundMobile",mobileFrameFallback);
export default function NotFoundPage(){
 return <main className="not-found-page"><section className="not-found-surface" aria-labelledby="page-title">
  <div className="hero-media" aria-hidden="true">
   <div className="hero-motion hero-motion--visible">
    <div className="hero-video-frames">
     <picture className="not-found-frame"><source media="(max-width:48rem)" srcSet={mobileFrame}/><img src={desktopFrame} width="1024" height="768" alt="" fetchPriority="high"/></picture>
     <picture className="hero-overlay"><source media="(max-width:48rem)" srcSet={mobileOverlay}/><img src={overlay} alt=""/></picture>
     <div className="hero-desaturate"/>
     <div className="hero-progressive-blur"/>
    </div>
   </div>
  </div>
  <Header/>
  <div className="not-found-copy"><h1 id="page-title" tabIndex={-1}>Signal Down — 404</h1><a className="primary-action" href={sitePath("/")}><span>Index</span><span className="action-arrow" aria-hidden="true" style={{WebkitMaskImage:`url("${arrow}")`,maskImage:`url("${arrow}")`}}/></a></div>
 </section></main>;
}
