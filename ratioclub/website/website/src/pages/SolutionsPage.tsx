import {useRef} from "react";
import {useSolutionsSectionGaps} from "../components/useSolutionsSectionGaps";
import { BodyText } from "../components/BodyText";
import { SubpageHero } from "../components/SubpageHero";
import { SubpageIntroduction } from "../components/SubpageIntroduction";
import { ServiceDetail } from "../components/ServiceDetail";
import { BookingAction } from "../components/BookingAction";
import { Quote } from "../components/Quote";
import { Section, SectionHeading } from "../components/Section";
import { ConversionBanner } from "../components/ConversionBanner";
import { Footer } from "../components/Footer";
import { solutionServices, solutionComparison } from "../content/solutions";
import {GoldenObject} from "../components/GoldenRatioShape";
import gpu from "../assets/service-gpu-diagram.svg";
import inference from "../assets/service-inference-diagram.svg";
import operations from "../assets/service-operations-diagram.svg";
import "./solutions.css";

const artwork = { gpu, inference, operations };
export default function SolutionsPage() {
  const root=useRef<HTMLDivElement>(null);
  useSolutionsSectionGaps(root);
  return <div ref={root} className="solutions-page">
    <a className="skip-link" href="#page-title">Skip to main content</a>
    <SubpageHero title="Solutions" artworkContent={<GoldenObject offset={1} fitToFrame rotationOnly arms={3}/>} width={242} height={232} />
    <main id="solutions-content">
      <SubpageIntroduction id="solutions-introduction-title" className="solutions-introduction"
        title={<>Production AI Infrastructure<br className="solutions-desktop-break" /> &amp; Inference Engineering on AWS</>}
        lead={<><strong>RatioClub</strong> embeds senior <strong>Forward Deployed Engineers</strong> (FDEs) into enterprise teams to validate, optimize, and manage production AI infrastructure on Amazon Web Services.</>}
        detail="We bridge the gap between raw compute allocations and operational execution through hands-on GPU cluster validation, low-latency inference engineering, and managed operations under outcome-based SLAs."
        action="Schedule an Architecture Review" />
      {solutionServices.map((service, index) => <ServiceDetail key={service.id} service={service} artwork={artwork[service.id]} reverse={index === 1} />)}
      <div className="solutions-quote"><Quote roundedBottom goldenArtwork /></div>
      <Section id="solutions-comparison" className="solutions-comparison" label="solutions-comparison-title">
        <SectionHeading id="solutions-comparison-title" eyebrow="AWS AI Infrastructure & Forward Deployed Engineering" title="The Forward Deployed Advantage" />
        <table className="solutions-comparison-table" role="table" aria-labelledby="solutions-comparison-title">
          <thead role="rowgroup"><tr role="row"><th scope="col" role="columnheader">Dimension</th><th scope="col" role="columnheader">Traditional Cloud Consulting</th><th scope="col" role="columnheader">RatioClub Forward Deployed Engineering</th></tr></thead>
          <tbody role="rowgroup">{solutionComparison.map(row => <tr key={row.dimension} role="row">
            <BodyText as="th" scope="row" role="rowheader">{row.dimension}</BodyText>
            <BodyText as="td" role="cell"><span className="comparison-mobile-label">Traditional cloud consulting</span>{row.traditional}</BodyText>
            <BodyText as="td" role="cell"><span className="comparison-mobile-label">RatioClub FDE</span><strong>{row.label}</strong> {row.body}</BodyText>
          </tr>)}</tbody>
        </table>
      </Section>
      <Section id="solutions-scoping" className="solutions-scoping" label="solutions-scoping-title">
        <div className="solutions-scoping-copy"><h2 id="solutions-scoping-title">Ready to Validate and Scale Your AI Workloads on AWS?</h2><BodyText as="p">Whether you are bench-testing a multi-node GPU cluster, architecting low-latency Bedrock pipelines, or navigating AWS funding programs, our Forward Deployed Engineers are ready to embed.</BodyText></div>
        <div className="solutions-scoping-actions">
          <div><BodyText as="p">For Technical &amp; Platform Leaders:<br />Talk to an AI Forward Deployed Engineer</BodyText><BookingAction variant="text" label="Talk to FDE" dialogTitle="Talk to an AI Forward Deployed Engineer" /></div>
          <div><BodyText as="p">For AWS Partner &amp; Field Teams:<br />Request Co-Sell &amp; Funding Collaboration</BodyText><BookingAction variant="text" intent="contact" label="Request Collaboration" dialogTitle="Request Collaboration" /></div>
        </div>
      </Section>
      <ConversionBanner />
    </main>
    <Footer connected />
  </div>;
}
