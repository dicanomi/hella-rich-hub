import {sitePath} from "../config/paths";
import { BodyText } from "./BodyText";
import { SolutionGraphSlot } from "./SolutionGraphSlot";
import type { ReactNode } from "react";
import { Section, SectionHeading } from "./Section";
import type { SectionSpacing } from "./Section";
import { SvgArtwork } from "./SvgArtwork";
import { solutionsContent } from "../content/sections";
import arrow from "../assets/arrow-right-desktop.svg";
import gpu from "../assets/illustration-05.svg";
import inference from "../assets/illustration-06.svg";
import operations from "../assets/illustration-07.svg";

const artwork = [
  { src: gpu, width: 381, height: 292 },
  { src: inference, width: 382, height: 280 },
  { src: operations, width: 382, height: 301 },
] as const;

export function CoreSolutions({ spacing, artworks }: { spacing?: SectionSpacing; artworks?: ReactNode[] }) {
  const labels = ["Validation", "Platforms", "Operations"] as const;
  const arrowIcon = <span className="action-arrow" aria-hidden="true" style={{maskImage:`url("${arrow}")`}} />;
  const variants = ["gpu", "inference", "operations"] as const;
  return (
    <Section
      id="core-solutions"
      className="core-solutions"
      spacing={spacing}
      label="solutions-title"
    >
      <div className="core-solutions-heading">
      <SectionHeading
        id="solutions-title"
        eyebrow={solutionsContent.eyebrow}
        title={solutionsContent.title}
      />
      <a className="text-action solution-overview-link" href={sitePath("/solutions")}><span>Solutions</span>{arrowIcon}</a>
      </div>
      <div className="solutions-grid">
        {solutionsContent.cards.map((card, index) => (
          <a className="solution-card solution-card-link" key={card.title} href={sitePath(`/solutions#service-${variants[index]}-title`)} aria-labelledby={`index-service-${variants[index]}`}>
            <h3 id={`index-service-${variants[index]}`}>{card.title}</h3>
            <figure>
              <div className="solution-artwork-slot">
                {artworks?.[index] ?? <SolutionGraphSlot variant={variants[index]} fallback={<SvgArtwork {...artwork[index]} />} />}
              </div>
              <BodyText as="figcaption">{card.caption}</BodyText>
            </figure>
            <BodyText as="p">{card.body}</BodyText>
            <span className="solution-card-action" aria-hidden="true"><span>{labels[index]}</span>{arrowIcon}</span>
          </a>
        ))}
      </div>
    </Section>
  );
}
