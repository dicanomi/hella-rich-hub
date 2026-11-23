import { BodyText } from "./BodyText";
import type { SectionSpacing } from "./Section";
import { ServiceDiagram } from "./ServiceDiagram";
import type { solutionServices } from "../content/solutions";

type Service = (typeof solutionServices)[number];
export function ServiceDetail({ service, artwork, spacing, reverse = false }: {
  service: Service; artwork: string; spacing?: SectionSpacing; reverse?: boolean;
}) {
  const titleId = `service-${service.id}-title`;
  return <section className={`service-detail${reverse ? " service-detail--reverse" : ""}`} aria-labelledby={titleId} style={spacing}>
    <div className="service-detail-number" aria-hidden="true">_{service.number}</div>
    <figure className="service-detail-artwork" aria-label={service.caption}>
      <ServiceDiagram variant={service.id} src={artwork} width={service.width} height={service.height} />
      <figcaption>{service.caption.slice(0,service.caption.indexOf(':')+1)}<br/>{service.caption.slice(service.caption.indexOf(':')+1).trimStart().replaceAll(': ',' — ')}</figcaption>
    </figure>
    <div className="service-detail-copy">
      <h2 id={titleId}>{service.title}</h2>
      <div className="service-detail-body">
        <BodyText as="p" className="service-detail-subtitle">{service.title} {service.subtitle}</BodyText>
        <BodyText as="p">{service.introduction}</BodyText>
        <ul>{service.points.map(point => <BodyText as="li" key={point.label}><strong>{point.label}</strong> {point.body}</BodyText>)}</ul>
      </div>
    </div>
  </section>;
}
