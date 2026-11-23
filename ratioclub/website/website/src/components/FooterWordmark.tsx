import {sitePath} from "../config/paths";
import type { CSSProperties } from "react";
import wordmark from "../assets/wordmark-footer-mask.svg";

// Adjacent triangular masks sum to one. Additive blending avoids the dark
// bands produced by overlapping ordinary alpha-composited blur layers.
const blurPasses = Array.from({ length: 13 }, (_, index) => {
  const position = (index / 12) * 100;
  const step = 100 / 12;
  const stops = index === 0
    ? `#000 0%, transparent ${step}%`
    : index === 12
      ? `transparent ${position - step}%, #000 100%`
      : `transparent ${position - step}%, #000 ${position}%, transparent ${position + step}%`;
  // Keep more of the letter tops crisp, then retain the original blur at the base.
  const radius = Math.pow(Math.max(0, (position - 40) / 60), 1.4) * 3;
  return {
    maskImage: `linear-gradient(${stops})`,
    "--wordmark-blur": radius === 0 ? "none" : `blur(${radius}cqw)`,
  } as CSSProperties;
});

export function FooterWordmark() {
  const style = { "--wordmark-mask": `url("${wordmark}")` } as CSSProperties;
  return (
    <a
      className="footer-wordmark"
      href={sitePath("/")}
      aria-label="Ratioclub home"
      style={style}
    >
      {blurPasses.map((pass, index) => (
        <span
          className="wordmark-pass"
          style={pass}
          key={index}
          aria-hidden="true"
        >
          <span className="wordmark-blur"><span className="wordmark-shape" /></span>
        </span>
      ))}
    </a>
  );
}
