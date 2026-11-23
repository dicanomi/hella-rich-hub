import "./subpage-hero.css";
import { useRef, type ReactNode, type CSSProperties } from "react";
import { Header } from "./Header";
import { SvgArtwork } from "./SvgArtwork";
import type { SectionSpacing } from "./Section";
import { useSubpageArtworkIntro } from "./useSubpageArtworkIntro";

export function SubpageHero({ title, artwork, width, height, spacing, artworkContent }: {
  title: string; artwork?: string; artworkContent?:ReactNode; width: number; height: number; spacing?: SectionSpacing;
}) {
  const hero=useRef<HTMLElement>(null);
  useSubpageArtworkIntro(hero,title);
  return <>
    <div className="subpage-header"><Header /></div>
    <section ref={hero} className="subpage-hero" aria-labelledby="page-title" style={spacing}>
      <div className="subpage-hero-surface">
        <h1 id="page-title" tabIndex={-1}>{title}</h1>
        <div className="subpage-hero-artwork" style={{"--hero-artwork-width":`${100*width/Math.max(width,height)}%`} as CSSProperties}>{artworkContent ?? (artwork ? <SvgArtwork src={artwork} width={width} height={height} /> : null)}</div>
      </div>
    </section>
  </>;
}
