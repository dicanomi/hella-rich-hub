import {GoldenObject} from "./GoldenRatioShape";
import {useRef} from "react";
import {useQuoteReveal} from "./useQuoteReveal";
import {localMedia} from "../content/local-media";
import { BodyText } from "./BodyText";
import type { SectionSpacing } from "./Section";
import { testimonialContent } from "../content/sections";
import dividerFallback from "../assets/media-divider.webp";
const divider=localMedia("mediaDivider",dividerFallback);

export function Quote({
  spacing,
  roundedBottom = false,
  reveal = false,
  goldenArtwork = false,
}: {
  spacing?: SectionSpacing;
  roundedBottom?: boolean;
  reveal?: boolean;
  goldenArtwork?:boolean;
}) {
  const root=useRef<HTMLElement>(null);
  useQuoteReveal(root,reveal);
  return (
    <section
      ref={root}
      id={reveal ? "index-quote" : undefined}
      className={`quote-section${roundedBottom ? " quote-section--rounded" : ""}${goldenArtwork?" quote-section--golden":""}`}
      style={spacing}
      aria-label="Client testimonial"
    >
      <figure>
        <blockquote><BodyText as="p" className="quote-mobile-text">"{testimonialContent.quote}"</BodyText><BodyText as="p" className="quote-desktop-text">{testimonialContent.quote}</BodyText></blockquote>
        <BodyText as="figcaption">{testimonialContent.attribution}</BodyText>
        {goldenArtwork?<div className="quote-golden-artwork" aria-hidden="true"><GoldenObject offset={1} rotationOnly arms={3} interactive={false}/></div>:null}
      </figure>
    </section>
  );
}

export function MediaDivider() {
  return (
    <div className="media-divider" aria-hidden="true">
      <img src={divider} width="1410" height="211" alt="" loading="lazy" />
    </div>
  );
}
