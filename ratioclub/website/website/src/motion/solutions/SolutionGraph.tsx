import "./solution-graph.css";
import { useEffect, useRef } from "react";
import { solutionArtwork } from "./solutionArtwork";
import type { GraphVariant } from "./solutionArtwork";

function hoverRole(variant: GraphVariant, index: number) {
  if (variant === "gpu") return index <= 22 ? "base" : index <= 46 ? "lift" : "fixed";
  if (variant === "inference") return index >= 2 && index <= 24 ? "base" : index >= 25 ? "lift" : "fixed";
  return index >= 4 && index <= 26 ? "base" : index >= 27 ? "lift" : "fixed";
}

export function SolutionGraph({ variant }: { variant: GraphVariant }) {
  const artwork = solutionArtwork[variant];
  const root = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const element = root.current!;
    const path = element.querySelector<SVGPathElement>(".solution-signal")!;
    const dot = element.querySelector<SVGCircleElement>(".solution-travel-dot")!;
    const preference = matchMedia("(prefers-reduced-motion: reduce)");
    const length = path.getTotalLength();
    // Existing curves are monotonic in x; find the authored marker on the curve.
    let low = 0, high = length;
    for (let i = 0; i < 24; i++) {
      const middle = (low + high) / 2;
      if (path.getPointAtLength(middle).x < artwork.target[0]) low = middle;
      else high = middle;
    }
    const stopLength = (low + high) / 2;
    // Sample geometry once. Animation frames do no layout or path-length reads.
    const points = Array.from({ length: 161 }, (_, i) => path.getPointAtLength(stopLength * i / 160));
    let frame = 0, elapsed = 0, previous = 0;
    let visible = false;
    const markers = [...element.querySelectorAll<SVGPathElement>(".solution-marker")];
    let previousColor = "";
    const color = (progress: number) => {
      const channels = [23, 31, 35].map((dark, index) => Math.round(dark + ([78, 148, 167][index] - dark) * progress));
      const value = `rgb(${channels.join(",")})`;
      if (value === previousColor) return;
      previousColor = value;
      path.setAttribute("stroke", value);
      dot.setAttribute("fill", value);
      markers.forEach(marker => marker.setAttribute("fill", value));
    };
    const place = (progress: number) => {
      if (progress === 1) {
        dot.setAttribute("cx", String(artwork.target[0]));
        dot.setAttribute("cy", String(artwork.target[1]));
        return;
      }
      const position = progress * 160;
      const index = Math.min(159, Math.floor(position));
      const fraction = position - index;
      dot.setAttribute("cx", String(points[index].x + (points[index + 1].x - points[index].x) * fraction));
      dot.setAttribute("cy", String(points[index].y + (points[index + 1].y - points[index].y) * fraction));
    };
    const stop = () => { cancelAnimationFrame(frame); frame = 0; previous = 0; };
    const allowed = () => visible && !document.hidden && !preference.matches;
    const tick = (time: number) => {
      frame = 0;
      if (!allowed()) return;
      if (previous) elapsed = (elapsed + time - previous) % 7200;
      previous = time;
      const progress = (1 - Math.cos((elapsed / 7200) * Math.PI * 2)) / 2;
      const direction = elapsed < 3600 ? "forward" : "backward";
      if (element.dataset.dotState !== direction) element.dataset.dotState = direction;
      place(progress);
      color(progress);
      frame = requestAnimationFrame(tick);
    };
    const update = () => {
      element.dataset.active = String(allowed());
      if (preference.matches) {
        stop(); place(1); color(1);
        element.dataset.dotState = "static";
        element.dataset.hover = "false";
      } else if (allowed()) {
        if (!frame) frame = requestAnimationFrame(tick);
      } else stop();
    };
    place(0); color(0);
    const observer = new IntersectionObserver(entries => {
      visible = entries.some(entry => entry.isIntersecting && entry.intersectionRatio >= 0.15);
      update();
    }, { threshold: [0, 0.15] });
    observer.observe(element);
    preference.addEventListener("change", update);
    document.addEventListener("visibilitychange", update);
    update();
    return () => {
      stop(); observer.disconnect();
      preference.removeEventListener("change", update);
      document.removeEventListener("visibilitychange", update);
    };
  }, [artwork]);

  // Group consecutive paths by hover role while preserving their original paint order.
  const groups: { role: string; indices: number[] }[] = [];
  artwork.paths.forEach((_, index) => {
    const role = hoverRole(variant, index);
    if (groups.at(-1)?.role === role) groups.at(-1)!.indices.push(index);
    else groups.push({ role, indices: [index] });
  });
  return <div ref={root} className="solution-graph-motion" data-variant={variant} data-active="false" data-dot-state="ready" data-hover="false"
    onPointerEnter={event => {
      if (event.pointerType === "mouse" && matchMedia("(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)").matches) event.currentTarget.dataset.hover = "true";
    }}
    onPointerLeave={event => { event.currentTarget.dataset.hover = "false"; }}>
    <svg viewBox={`0 0 ${artwork.width} ${artwork.height}`} width={artwork.width} height={artwork.height} fill="none" aria-hidden="true" focusable="false">
      {groups.map((group, groupIndex) => <g key={groupIndex} className={`graph-hover-${group.role}`}>
        {group.indices.map(index => <path key={index} {...artwork.paths[index]}
          className={index === artwork.signal ? "solution-signal" : artwork.markers.includes(index) ? "solution-marker" : undefined} />)}
      </g>)}
      <g className={variant === "gpu" ? "graph-hover-fixed" : "graph-hover-lift"}>
        <circle className="solution-travel-dot" cx={artwork.target[0]} cy={artwork.target[1]} r={artwork.radius} fill="#4E94A7" />
      </g>
    </svg>
  </div>;
}
