import { lazy, Suspense, useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import type { GraphVariant } from "../motion/solutions/solutionArtwork";

const AnimatedGraph = lazy(() => import("../motion/solutions/SolutionGraph").then(module => ({ default: module.SolutionGraph })));

export function SolutionGraphSlot({ variant, fallback }: { variant: GraphVariant; fallback: ReactNode }) {
  const root = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const preference = matchMedia("(prefers-reduced-motion: no-preference)");
    let observer: IntersectionObserver | undefined;
    const update = () => {
      observer?.disconnect();
      if (!preference.matches) { setReady(false); return; }
      observer = new IntersectionObserver(entries => {
        if (entries.some(entry => entry.isIntersecting)) {
          setReady(true);
          observer?.disconnect();
        }
      }, { rootMargin: "400px 0px" });
      if (root.current) observer.observe(root.current);
    };
    update();
    preference.addEventListener("change", update);
    return () => { observer?.disconnect(); preference.removeEventListener("change", update); };
  }, []);
  return <div ref={root} className="solution-graph-slot">
    {ready ? <Suspense fallback={fallback}><AnimatedGraph variant={variant} /></Suspense> : fallback}
  </div>;
}
