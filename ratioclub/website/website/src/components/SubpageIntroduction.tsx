import { BodyText } from "./BodyText";
import type { ReactNode } from "react";
import type { SectionSpacing } from "./Section";
import { BookingAction } from "./BookingAction";
import "./subpage-introduction.css";

export function SubpageIntroduction({ id, title, lead, detail, action, intent="booking", dialogTitle, className, spacing }: {
  id:string; title:ReactNode; lead:ReactNode; detail:string; action:string; intent?:"contact"|"booking"; dialogTitle?:string; className:string; spacing?:SectionSpacing;
}) {
  return <section className={`subpage-introduction ${className}`} aria-labelledby={id} style={spacing}>
    <h2 id={id}>{title}</h2>
    <div className={`subpage-introduction-columns ${className}-columns`}>
      <BodyText as="p" className={`subpage-introduction-lead ${className}-lead`}>{lead}</BodyText>
      <BodyText as="p" className={`subpage-introduction-detail ${className}-detail`}>{detail}</BodyText>
      <div className={`subpage-introduction-action ${className}-action`}><BookingAction intent={intent} label={action} dialogTitle={dialogTitle} /></div>
    </div>
  </section>;
}
