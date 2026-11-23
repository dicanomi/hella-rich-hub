import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import desktop from '../assets/hero-poster-desktop.webp';
import mobile from '../assets/hero-poster-mobile.webp';
import './hero-image-motion.css';

const mobileViewport=matchMedia('(max-width:48rem)');
const subscribeViewport=(callback:()=>void)=>{mobileViewport.addEventListener('change',callback);return()=>mobileViewport.removeEventListener('change',callback);};
function automaticMotion() {
  const connection=(navigator as Navigator&{connection?:{saveData?:boolean;effectiveType?:string}}).connection;
  return !matchMedia('(prefers-reduced-motion: reduce)').matches && !matchMedia('(prefers-reduced-data: reduce)').matches && !connection?.saveData && !['2g','slow-2g'].includes(connection?.effectiveType??'');
}
export function HeroImageMotion() {
  const root=useRef<HTMLDivElement>(null);
  const useMobileImage=useSyncExternalStore(subscribeViewport,()=>mobileViewport.matches);
  const [wanted,setWanted]=useState(automaticMotion);
  const [visible,setVisible]=useState(true);
  const [hidden,setHidden]=useState(document.hidden);
  useEffect(()=>{
    const preference=matchMedia('(prefers-reduced-motion: reduce)');
    const dataPreference=matchMedia('(prefers-reduced-data: reduce)');
    const connection=(navigator as Navigator&{connection?:EventTarget}).connection;
    const update=()=>setWanted(automaticMotion());
    const visibility=()=>setHidden(document.hidden);
    const observer=new IntersectionObserver(entries=>setVisible(entries.some(e=>e.isIntersecting)));
    observer.observe(root.current!);
    preference.addEventListener('change',update);
    dataPreference.addEventListener('change',update);
    connection?.addEventListener('change',update);
    document.addEventListener('visibilitychange',visibility);
    return()=>{observer.disconnect();preference.removeEventListener('change',update);dataPreference.removeEventListener('change',update);connection?.removeEventListener('change',update);document.removeEventListener('visibilitychange',visibility);};
  },[]);
  const running=wanted&&visible&&!hidden;
  return <>
    <div ref={root} className={`hero-media hero-image-motion${running?' hero-image-motion--running':''}`} aria-hidden="true" data-running={running}>
      <div className="hero-image-plane"><img src={useMobileImage?mobile:desktop} width="1600" height="1200" alt="" fetchPriority="high"/></div>
      <div className="hero-image-light"/>
    </div>
    <button type="button" className="media-toggle" aria-label={wanted?'Pause background motion':'Play background motion'} onClick={()=>setWanted(value=>!value)}>
      <span className={wanted?'pause-icon':'play-icon'} aria-hidden="true"/>
    </button>
  </>;
}
