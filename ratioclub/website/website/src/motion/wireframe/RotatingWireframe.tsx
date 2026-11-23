import type {ScrollTrigger as ScrollTriggerType} from "gsap/ScrollTrigger";
import { useEffect, useMemo, useRef, useState } from "react";
import { makeWireframe, makeProjector, fittedScale } from "./geometry";
import type { WireframeShape } from "./geometry";

export function RotatingWireframe({ shape, label, controls = true, scrollRotate = false }: { shape: WireframeShape; label: string; controls?: boolean; scrollRotate?:boolean }) {
  const lines = useMemo(() => makeWireframe(shape), [shape]);
  const scale = useMemo(() => fittedScale(lines, shape), [lines, shape]);
  const initialProjection = useMemo(() => makeProjector(shape, 0, scale), [shape, scale]);
  const root = useRef<HTMLDivElement>(null);
  const animate = useRef<(action: "hover" | "coast" | "turn" | "scroll") => void>(() => {});
  const [reduced, setReduced] = useState(() => typeof matchMedia === "undefined" || matchMedia("(prefers-reduced-motion: reduce)").matches);
  useEffect(() => {
    const element = root.current!;
    const paths = [...element.querySelectorAll("svg path")];
    const preference = matchMedia("(prefers-reduced-motion: reduce)");
    let frame = 0;
    let angle = 0;
    let visible = false;
    let velocity = 0;
    let hovering = false;
    let scrollVelocity = 0;
    let scrollTrigger:ScrollTriggerType|undefined;
    let disposed=false;
    let scrollSetup=0;
    const draw = (next: number) => {
      angle = next;
      const project = makeProjector(shape, angle, scale);
      paths.forEach((path, index) => {
        const projection = project(lines[index]);
        path.setAttribute("d", projection.path);
        path.setAttribute("stroke-opacity", String(projection.opacity));
      });
    };
    const stop = () => {
      cancelAnimationFrame(frame);
      frame = 0;
      velocity = 0;
      scrollVelocity = 0;
      element.dataset.animating = "false";
    };
    animate.current = action => {
      if(action === "scroll" && frame) return;
      // Re-entering preserves angular velocity instead of restarting an easing curve.
      cancelAnimationFrame(frame);
      frame = 0;
      if (preference.matches || !visible || document.hidden) { stop(); return; }
      if(action !== "scroll") hovering = action === "hover";
      const from = angle;
      const start = performance.now();
      let previous = start;
      element.dataset.animating = "true";
      const update = (now: number) => {
        if (action === "turn") {
          const progress = Math.min(1, (now - start) / 720);
          const eased = progress * progress * progress * (progress * (progress * 6 - 15) + 10);
          draw(from + Math.PI * 0.45 * eased);
          if (progress === 1) { stop(); return; }
        } else {
          const dt = Math.min((now - previous) / 1000, 0.05);
          const target = hovering ? 2.2 : 0;
          const smoothing = hovering ? 0.10 : 0.24;
          const decay = Math.exp(-dt / smoothing);
          // Integrate damped angular velocity exactly so motion is refresh-rate independent.
          const scrollDecay=Math.exp(-dt/.28);
          draw(angle + target * dt + (velocity - target) * smoothing * (1 - decay) + scrollVelocity*.28*(1-scrollDecay));
          scrollVelocity*=scrollDecay;
          element.dataset.angle=String(angle);
          velocity = target + (velocity - target) * decay;
          if (!hovering && Math.abs(velocity) < 0.01 && Math.abs(scrollVelocity) < 0.01) { stop(); return; }
        }
        previous = now;
        frame = requestAnimationFrame(update);
      };
      frame = requestAnimationFrame(update);
    };
    const observer = new IntersectionObserver(entries => {
      visible = entries.some(entry => entry.isIntersecting);
      if (!visible) stop();
    });
    observer.observe(element);
    const setupScroll=async()=>{
      const generation=++scrollSetup;
      scrollTrigger?.kill();scrollTrigger=undefined;
      if(!scrollRotate||preference.matches)return;
      const [{gsap},{ScrollTrigger}]=await Promise.all([import("gsap"),import("gsap/ScrollTrigger")]);
      if(disposed||generation!==scrollSetup||preference.matches)return;
      gsap.registerPlugin(ScrollTrigger);
      let lastScroll=window.scrollY;
      scrollTrigger=ScrollTrigger.create({trigger:element,start:"top bottom",end:"bottom top",
        onToggle:()=>{lastScroll=window.scrollY;},
        onUpdate:self=>{
          const position=self.scroll(),delta=position-lastScroll;lastScroll=position;
          if(!delta||!visible||preference.matches||document.hidden)return;
          scrollVelocity=Math.sign(delta)*Math.min(3.2,Math.max(.15,Math.abs(self.getVelocity())*.0016));
          animate.current("scroll");
        },
      });
    };
    void setupScroll().catch(()=>{});
    const updatePreference = () => {
      setReduced(preference.matches);
      if (preference.matches) { stop(); draw(0); }
      void setupScroll().catch(()=>{});
    };
    const visibility = () => { if (document.hidden) stop(); };
    preference.addEventListener("change", updatePreference);
    document.addEventListener("visibilitychange", visibility);
    return () => {
      disposed=true;++scrollSetup;
      stop(); observer.disconnect();scrollTrigger?.kill();
      preference.removeEventListener("change", updatePreference);
      document.removeEventListener("visibilitychange", visibility);
      animate.current = () => {};
    };
  }, [lines, shape, scale, scrollRotate]);
  return <div className={`wireframe-object${controls ? "" : " wireframe-object--illustration"}`} ref={root} data-shape={shape} data-animating="false">
    <div className="wireframe-hover-area"
      onPointerEnter={event => { if (event.pointerType === "mouse" && matchMedia("(hover: hover) and (pointer: fine)").matches) animate.current("hover"); }}
      onPointerLeave={event => { if (event.pointerType === "mouse") animate.current("coast"); }}>
      <svg viewBox="0 0 320 320" width="320" height="320" fill="none" stroke="#171f23" strokeWidth="0.7" aria-hidden="true">
        {lines.map((line, index) => {
          const projection = initialProjection(line);
          return <path key={index} d={projection.path} strokeOpacity={projection.opacity} />;
        })}
      </svg>
    </div>
    {controls ? <>
      <h2>{label}</h2>
      <button onClick={() => animate.current("turn")} disabled={reduced}>Rotate {label}</button>
    </> : null}
  </div>;
}
