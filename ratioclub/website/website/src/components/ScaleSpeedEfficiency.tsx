import { BodyText } from "./BodyText";
import { Section, SectionHeading } from "./Section";
import type { SectionSpacing } from "./Section";
import { RotatingWireframe } from "../motion/wireframe/RotatingWireframe";
import { featureContent } from "../content/sections";

const shapes = ["sphere", "horn", "cubes", "torus"] as const;

export function ScaleSpeedEfficiency({
  spacing,
}: {
  spacing?: SectionSpacing;
}) {
  return (
    <Section
      id="scale-speed-efficiency"
      className="scale-speed-efficiency"
      spacing={spacing}
      label="features-title"
    >
      <SectionHeading
        id="features-title"
        eyebrow={featureContent.eyebrow}
        title={featureContent.title}
      />
      <div className="feature-grid">
        {featureContent.cards.map((card, index) => (
          <article className="feature-card" key={card.title}>
            <div className="feature-artwork-slot">
              <div className="feature-wireframe-size">
                <RotatingWireframe shape={shapes[index]} label={card.title} controls={false} scrollRotate />
              </div>
            </div>
            <h3>{card.title}</h3>
            <BodyText as="p">{card.body}</BodyText>
          </article>
        ))}
      </div>
    </Section>
  );
}
