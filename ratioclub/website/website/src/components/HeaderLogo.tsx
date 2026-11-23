import {sitePath} from "../config/paths";
import { useEffect, useRef } from "react";
import { desktopLogoPaths, mobileLogoPaths } from "./headerLogoPaths";

export function HeaderLogo() {
  const root = useRef<HTMLAnchorElement>(null);
  const replay = useRef<() => void>(() => {});
  useEffect(() => {
    const element = root.current!;
    const preference = matchMedia("(prefers-reduced-motion: reduce)");
    let animations: Animation[] = [];
    const stop = () => { animations.forEach(animation => animation.cancel()); animations = []; };
    replay.current = () => {
      if (preference.matches || document.hidden || animations.some(animation => animation.playState === "running")) return;
      const svg = [...element.querySelectorAll("svg")].find(candidate => getComputedStyle(candidate).display !== "none");
      if (!svg) return;
      // The export paint order is not the letter order. Sort by original x bounds.
      const letters = [...svg.querySelectorAll("path")].sort((a, b) => a.getBBox().x - b.getBBox().x);
      animations = letters.map((letter, index) => {
        const outward = 80 + index * 40;
        const returning = 680 + (letters.length - 1 - index) * 40;
        return letter.animate([
          { transform: "translateY(0)", offset: 0 },
          { transform: "translateY(0)", offset: outward / 1280 },
          { transform: "translateY(-2.5px)", offset: (outward + 100) / 1280 },
          { transform: "translateY(0)", offset: (outward + 260) / 1280 },
          { transform: "translateY(0)", offset: returning / 1280 },
          { transform: "translateY(-2.5px)", offset: (returning + 100) / 1280 },
          { transform: "translateY(0)", offset: (returning + 260) / 1280 },
          { transform: "translateY(0)", offset: 1 },
        ].map(keyframe => ({ ...keyframe, easing: "cubic-bezier(.45,0,.55,1)" })), { duration: 1280, easing: "linear" });
      });
    };
    const updatePreference = () => { if (preference.matches) stop(); };
    const visibility = () => { if (document.hidden) stop(); };
    preference.addEventListener("change", updatePreference);
    document.addEventListener("visibilitychange", visibility);
    return () => {
      stop(); replay.current = () => {};
      preference.removeEventListener("change", updatePreference);
      document.removeEventListener("visibilitychange", visibility);
    };
  }, []);
  return <a href={sitePath("/")} className="brand-link" aria-label="Ratioclub home" ref={root}
    onPointerEnter={event => {
      if (event.pointerType === "mouse" && matchMedia("(hover: hover) and (pointer: fine)").matches) replay.current();
    }}>
    <span className="brand-artwork" aria-hidden="true">
      <svg className="brand-logo-desktop" width="124" height="22" viewBox="0 0 124 22" fill="none" focusable="false">
        {desktopLogoPaths.map((path, index) => <path key={index} {...path} />)}
      </svg>
      <svg className="brand-logo-mobile" width="112" height="20" viewBox="0 0 112 20" fill="none" focusable="false">
        {mobileLogoPaths.map((path, index) => <path key={index} {...path} />)}
      </svg>
    </span>
  </a>;
}
