import { useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import type { ArtworkGroup } from "./artworkTypes";

gsap.registerPlugin(ScrollTrigger, useGSAP);
export type AdvantageMotionMode = "entry" | "scroll";

function Artwork({ groups, variant }: { groups: ArtworkGroup[]; variant: "desktop" | "mobile" }) {
  const mobile = variant === "mobile";
  return (
    <svg data-variant={variant} viewBox={mobile ? "0 0 366 415" : "0 29.3801 619 798.6199"}
      width={mobile ? 366 : 619} height={mobile ? 415 : 798.6199} fill="none" aria-hidden="true" focusable="false">
      {groups.map(group => (
        <g key={group.name} data-part={group.name}>
          {group.paths.map((path, index) => <path key={index} {...path} />)}
        </g>
      ))}
    </svg>
  );
}

export function AnimatedAdvantageArtwork({ mode, replay = 0, variant, groups }: { mode: AdvantageMotionMode; replay?: number; variant: "desktop" | "mobile"; groups: ArtworkGroup[] }) {
  const container = useRef<HTMLDivElement>(null);
  useGSAP(() => {
    const root = container.current!;
    const media = gsap.matchMedia();
    media.add({ motion: "(prefers-reduced-motion: no-preference)", reduce: "(prefers-reduced-motion: reduce)" }, context => {
      const { reduce } = context.conditions!;
      const mobile = variant === "mobile";
      if (reduce) {
        root.dataset.motionState = "static";
        return;
      }
      const svg = root.querySelector<SVGSVGElement>(`svg[data-variant="${mobile ? "mobile" : "desktop"}"]`)!;
      const parts = (names: string[]) => names.flatMap(name => [...svg.querySelectorAll<SVGGElement>(`[data-part="${name}"]`)]);
      const middle = parts(["middle", "middle-details", "middle-node", "middle-label"]);
      const lower = parts(["lower", "lower-details", "lower-node", "lower-label"]);
      const connector = parts(["connector"]);
      const details = parts(["middle-details", "lower-details"]);
      const labels = parts(["surface-label", "middle-label", "lower-label"]);
      const markers = parts(["curve-markers"]);
      const curve = svg.querySelector<SVGPathElement>('[data-part="curve"] path')!;
      const spacing = mobile ? 131.04 : 245.30;
      const scrollControlled = mode === "scroll";
      const previousLength = curve.getAttribute("pathLength");
      curve.setAttribute("pathLength", "1");
      gsap.set(middle, { y: -spacing });
      gsap.set(lower, { y: -2 * spacing });
      gsap.set(parts(["middle", "lower"]), { opacity: scrollControlled ? 0.7 : 0.15 });
      gsap.set(details, { opacity: scrollControlled ? 1 : 0 });
      gsap.set([...labels, ...markers], { opacity: 0 });
      gsap.set(connector, { scaleY: 0, transformOrigin: "50% 0%", opacity: 0 });
      gsap.set(curve, { strokeDasharray: 1, strokeDashoffset: 1 });
      root.dataset.motionState = "ready";
      const timeline = gsap.timeline({
        defaults: { ease: scrollControlled ? "none" : "power2.out" },
        onStart: () => { root.dataset.motionState = "playing"; },
        onComplete: () => { root.dataset.motionState = "complete"; },
        scrollTrigger: mode === "entry"
          ? { trigger: root, start: "top 82%", once: true, toggleActions: "play none none none" }
          : { trigger: root, start: "top 85%", end: "top 8%", scrub: 0.25 },
      });
      if (scrollControlled) {
        // Keep the plane separation legible across the full scroll interval.
        // Entry-style ease-out previously completed most movement halfway through.
        timeline.to(middle, { y: 0, duration: 1 }, 0)
          .to(lower, { y: 0, duration: 1 }, 0)
          .to(parts(["middle", "lower"]), { opacity: 1, duration: 0.8 }, 0)
          .to(connector, { scaleY: 1, opacity: 1, duration: 1 }, 0)
          .to(curve, { strokeDashoffset: 0, duration: 0.72 }, 0.10)
          .to(labels, { opacity: 1, duration: 0.25 }, 0.65)
          .to(markers, { opacity: 1, duration: 0.20 }, 0.78);
      } else {
        timeline.to(middle, { y: 0, duration: 0.72 }, 0)
        .to(lower, { y: 0, duration: 0.76 }, 0.04)
        .to(parts(["middle", "lower"]), { opacity: 1, duration: 0.42 }, 0.08)
        .to(connector, { scaleY: 1, opacity: 1, duration: 0.56 }, 0.12)
        .to(curve, { strokeDashoffset: 0, duration: 0.52 }, 0.22)
        .to(details, { opacity: 1, duration: 0.28, stagger: 0.06 }, 0.30)
        .to(labels, { opacity: 1, duration: 0.24, stagger: 0.05 }, 0.48)
        .to(markers, { opacity: 1, duration: 0.18 }, 0.64);
      }
      void document.fonts.ready.then(() => { if (root.isConnected) ScrollTrigger.refresh(); });
      return () => {
        if (previousLength === null) curve.removeAttribute("pathLength");
        else curve.setAttribute("pathLength", previousLength);
        delete root.dataset.motionState;
      };
    }, container);
    return () => media.revert();
  }, { scope: container, dependencies: [mode, replay, variant], revertOnUpdate: true });

  return <div className="advantage-motion" ref={container} data-motion-mode={mode}>
    <Artwork groups={groups} variant={variant} />
  </div>;
}
