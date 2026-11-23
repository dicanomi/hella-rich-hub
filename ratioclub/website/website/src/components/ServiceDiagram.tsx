import { lazy, Suspense, useEffect, useRef, useState } from "react";
import { SvgArtwork } from "./SvgArtwork";
import type { ServiceVariant } from "../motion/services/types";

const artworkComponents={
  gpu:lazy(()=>import("../motion/services/GpuServiceArtwork")),
  inference:lazy(()=>import("../motion/services/InferenceServiceArtwork")),
  operations:lazy(()=>import("../motion/services/OperationsServiceArtwork")),
};
export function ServiceDiagram({ variant, src, width, height }: {variant:ServiceVariant;src:string;width:number;height:number}) {
  const root=useRef<HTMLDivElement>(null);
  const [animate,setAnimate]=useState(false);
  useEffect(()=>{
    const preference=matchMedia("(min-width: 601px) and (prefers-reduced-motion: no-preference)");
    let observer:IntersectionObserver|undefined;
    const update=()=>{
      observer?.disconnect();
      if(!preference.matches){setAnimate(false);return;}
      observer=new IntersectionObserver(entries=>{
        if(entries.some(entry=>entry.isIntersecting)){setAnimate(true);observer?.disconnect();}
      },{rootMargin:"400px 0px"});
      if(root.current)observer.observe(root.current);
    };
    update();preference.addEventListener("change",update);
    return()=>{observer?.disconnect();preference.removeEventListener("change",update);};
  },[]);
  const Artwork=artworkComponents[variant];
  const fallback=<SvgArtwork src={src} width={width} height={height} />;
  return <div ref={root} className="service-artwork-slot">
    {animate?<Suspense fallback={fallback}><Artwork slotWidth={width} slotHeight={height} /></Suspense>:fallback}
  </div>;
}
