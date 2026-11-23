import { useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import type { ServiceArtwork, ServiceArtworkSlot, ServicePlane } from "./types";

gsap.registerPlugin(ScrollTrigger, useGSAP);

export function AnimatedServiceArtwork({ artwork, slotWidth, slotHeight }: ServiceArtworkSlot & { artwork: ServiceArtwork }) {
  const container = useRef<HTMLDivElement>(null);
  useGSAP(() => {
    const root=container.current!;
    const media=gsap.matchMedia();
    media.add("(min-width: 601px) and (prefers-reduced-motion: no-preference)", () => {
      const middle=root.querySelectorAll<SVGGElement>('[data-plane="middle"]');
      const lower=root.querySelectorAll<SVGGElement>('[data-plane="lower"]');
      const annotations=root.querySelectorAll<SVGPathElement>('[data-reveal="true"]');
      const curve=root.querySelector<SVGPathElement>('[data-signal="true"]')!;
      const connectors=artwork.connectors.map(connector => ({...connector,element:root.querySelector<SVGGElement>(`[data-connector="${connector.index}"]`)!}));
      const previousLength=curve.getAttribute("pathLength");
      curve.setAttribute("pathLength","1");
      const progress={value:0};
      const renderConnectors=() => {
        const offsets:Record<ServicePlane,number>={upper:0,middle:-artwork.shift[0]*(1-progress.value),lower:-artwork.shift[1]*(1-progress.value)};
        for (const connector of connectors) {
          const start=connector.y+offsets[connector.fromPlane];
          const length=connector.height+offsets[connector.toPlane]-offsets[connector.fromPlane];
          const scale=Math.max(0,length/connector.height);
          // Reuse the original dashed/fan paths. Their endpoint transform follows
          // the layers and never reverses a connector through another plane.
          connector.element.setAttribute("transform",`matrix(1 0 0 ${scale} 0 ${start-connector.y*scale})`);
          connector.element.style.opacity=String(Math.min(1,Math.max(0,length/24)));
        }
        root.dataset.scrollProgress=progress.value.toFixed(3);
      };
      gsap.set(middle,{y:-artwork.shift[0],opacity:0.7});
      gsap.set(lower,{y:-artwork.shift[1],opacity:0.7});
      gsap.set(annotations,{opacity:0});
      gsap.set(curve,{strokeDasharray:1,strokeDashoffset:1});
      renderConnectors();
      root.dataset.motionState="ready";
      const timeline=gsap.timeline({
        defaults:{ease:"none"},
        scrollTrigger:{trigger:root,start:"top 85%",end:"top 8%",scrub:0.25,invalidateOnRefresh:true},
        onUpdate:()=>{root.dataset.motionState=progress.value>=0.999?"complete":"scrolling";},
      });
      timeline.to(middle,{y:0,opacity:1,duration:1},0)
        .to(lower,{y:0,opacity:1,duration:1},0)
        .to(progress,{value:1,duration:1,onUpdate:renderConnectors},0)
        .to(curve,{strokeDashoffset:0,duration:0.72},0.10)
        .to(annotations,{opacity:1,duration:0.25},0.65);
      // The reserved slot has the same geometry as the static fallback; loading
      // the animation does not move surrounding content or require a global refresh.
      return () => {
        for (const connector of connectors) {
          connector.element.removeAttribute("transform");
          connector.element.style.removeProperty("opacity");
        }
        if(previousLength===null) curve.removeAttribute("pathLength");
        else curve.setAttribute("pathLength",previousLength);
        delete root.dataset.motionState;
        delete root.dataset.scrollProgress;
      };
    });
    return () => media.revert();
  },{scope:container,dependencies:[artwork],revertOnUpdate:true});
  return <div ref={container} className="service-motion" data-service={artwork.variant} style={{aspectRatio:`${slotWidth} / ${slotHeight}`}}>
    <svg viewBox={artwork.viewBox} width={artwork.width} height={artwork.height} fill="none" aria-hidden="true" focusable="false">
      {artwork.groups.map((group,index)=><g key={index} data-plane={group.plane} data-connector={group.plane==="connector"?group.paths[0].index:undefined}>
        {group.paths.map(path=><path key={path.index} {...path.attrs} data-source-index={path.index} data-label={path.label||undefined} data-reveal={path.reveal||undefined} data-signal={path.signal||undefined} />)}
      </g>)}
    </svg>
  </div>;
}
