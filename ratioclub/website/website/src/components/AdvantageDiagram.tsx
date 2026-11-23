import { lazy, Suspense, useEffect, useRef, useState } from "react";
import { SvgArtwork } from "./SvgArtwork";
import desktopDiagram from "../assets/forward-deployed-diagram-desktop-aligned.svg";
import mobileDiagram from "../assets/forward-deployed-diagram-mobile.svg";

const AdvantageMotion = lazy(() => import("../motion/AdvantageMotion").then(module => ({ default: module.AdvantageMotion })));

function StaticArtwork() {
  return <>
    <div className="diagram-desktop"><SvgArtwork src={desktopDiagram} width={619} height={798.6199} /></div>
    <div className="diagram-mobile"><SvgArtwork src={mobileDiagram} width={366} height={415} /></div>
  </>;
}

export function AdvantageDiagram() {
  const root = useRef<HTMLDivElement>(null);
  const [animate, setAnimate] = useState(false);
  useEffect(() => {
    const preference = window.matchMedia("(prefers-reduced-motion: no-preference)");
    let observer: IntersectionObserver | undefined;
    const update = () => {
      observer?.disconnect();
      if (!preference.matches) {
        setAnimate(false);
        return;
      }
      observer = new IntersectionObserver(entries => {
        if (entries.some(entry => entry.isIntersecting)) {
          setAnimate(true);
          observer?.disconnect();
        }
      }, { rootMargin: "400px 0px" });
      if (root.current) observer.observe(root.current);
    };
    update();
    preference.addEventListener("change", update);
    return () => {
      observer?.disconnect();
      preference.removeEventListener("change", update);
    };
  }, []);
  return <div ref={root} className="advantage-diagram-content">
    {animate ? <Suspense fallback={<StaticArtwork />}><AdvantageMotion mode="scroll" /></Suspense> : <StaticArtwork />}
  </div>;
}
