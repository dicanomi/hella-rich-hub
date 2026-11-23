import { BodyText } from "./BodyText";
import type { ReactNode } from "react";
import { Section, SectionHeading } from "./Section";
import type { SectionSpacing } from "./Section";
import { AdvantageDiagram } from "./AdvantageDiagram";
import { advantageContent } from "../content/sections";

export function ForwardDeployedAdvantage({
  spacing,
  artwork,
}: {
  spacing?: SectionSpacing;
  artwork?: ReactNode;
}) {
  return (
    <Section
      id="forward-deployed"
      className="forward-deployed"
      spacing={spacing}
      label="advantage-title"
    >
      <SectionHeading
        id="advantage-title"
        eyebrow={advantageContent.eyebrow}
        title={advantageContent.title}
      />
      <figure className="advantage-diagram">
        {artwork ?? <AdvantageDiagram />}
        <BodyText as="figcaption">Diagram: embed, own, measure.</BodyText>
      </figure>
      <div className="advantage-points">
        {advantageContent.points.map((point) => (
          <BodyText as="p" key={point.title}>
            <strong>{point.title}</strong> {point.body}
          </BodyText>
        ))}
      </div>
    </Section>
  );
}
