import { BodyText } from "./BodyText";
import { BookingAction } from "./BookingAction";
import type { SectionSpacing } from "./Section";
import { conversionContent } from "../content/sections";

export type ConversionContent = { title:string; body:string; action:string; actionTitle?:string; secondaryAction?:string; actionIntent?:"booking"|"contact"; secondaryIntent?:"booking"|"contact" };
export function ConversionBanner({ spacing, content=conversionContent, titleBreakAfter }: { spacing?:SectionSpacing; content?:ConversionContent; titleBreakAfter?:string }) {
  const markerIndex=titleBreakAfter?content.title.indexOf(titleBreakAfter):-1;
  const breakAt=markerIndex>=0?markerIndex+titleBreakAfter!.length:0;
  const surface=(copy:ConversionContent,id:string,variant:string)=> <section className={`conversion-banner ${variant}${copy===conversionContent?" conversion-index":""}`} aria-labelledby={id} style={spacing}>
    <div className="conversion-surface">
      <div className="conversion-copy"><h2 id={id}>{breakAt>0?<>{copy.title.slice(0,breakAt)}{" "}<br className="conversion-title-break"/>{copy.title.slice(breakAt).trimStart()}</>:copy.title}</h2><BodyText as="p">{copy.body}</BodyText></div>
      {copy.secondaryAction ? <div className="conversion-actions">
        <BookingAction variant="conversion" intent={copy.actionIntent ?? "booking"} label={copy.action} dialogTitle={copy.actionTitle} />
        <BookingAction variant="text" intent={copy.secondaryIntent ?? "contact"} label={copy.secondaryAction} dialogTitle={copy.secondaryAction} />
      </div> : <BookingAction variant="conversion" intent={copy.actionIntent ?? "booking"} label={copy.action} dialogTitle={copy.actionTitle} />}
    </div>
  </section>;
  return surface(content,"conversion-title","");
}
