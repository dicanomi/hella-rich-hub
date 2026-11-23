import { BodyText } from "./BodyText";
import type { SectionSpacing } from "./Section";
import { indexContent } from "../content/index";

export function Introduction({ spacing }: { spacing?: SectionSpacing }) {
  return (
    <section
      className="introduction"
      id="introduction"
      tabIndex={-1}
      aria-label="About Ratioclub"
      style={spacing}
    >
      <BodyText as="p" className="introduction-lead">
        <strong>RatioClub</strong> embeds senior{" "}
        <strong>Forward Deployed Engineers</strong> (FDEs) into enterprise teams
        to validate, optimize, and operate high-performance AI workloads on AWS.
      </BodyText>
      <BodyText as="p" className="introduction-detail">{indexContent.introductionDetail}</BodyText>
    </section>
  );
}
