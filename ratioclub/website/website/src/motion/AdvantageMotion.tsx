import { lazy, Suspense, useSyncExternalStore } from "react";
import type { AdvantageMotionMode } from "./AnimatedAdvantageArtwork";
export type { AdvantageMotionMode } from "./AnimatedAdvantageArtwork";
const DesktopArtwork = lazy(() => import("./DesktopAdvantage"));
const MobileArtwork = lazy(() => import("./MobileAdvantage"));
const mobileQuery = window.matchMedia("(max-width: 600px)");
const subscribe = (callback: () => void) => {
  mobileQuery.addEventListener("change", callback);
  return () => mobileQuery.removeEventListener("change", callback);
};
export function AdvantageMotion({ mode, replay }: { mode: AdvantageMotionMode; replay?: number }) {
  const mobile = useSyncExternalStore(subscribe, () => mobileQuery.matches);
  const Artwork = mobile ? MobileArtwork : DesktopArtwork;
  return <Suspense fallback={<div style={{ aspectRatio: mobile ? "366 / 415" : "619 / 798.6199" }} role="status">Loading diagram…</div>}>
    <Artwork mode={mode} replay={replay} />
  </Suspense>;
}
