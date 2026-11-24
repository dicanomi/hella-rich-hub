import {sitePath} from '../config/paths';
import arrow from '../assets/arrow-right-desktop.svg';
// Keep approved CTA labels and variants; enquiries open the shared Contact modal.
export function BookingAction({label,mobileLabel,variant='primary'}:{label:string;mobileLabel?:string;intent?:'contact'|'booking';variant?:'primary'|'conversion'|'text';dialogTitle?:string}) {
 const compactLabels:Record<string,string>={
  'Schedule an Architecture Review':'Schedule Review',
  'Book an Infrastructure Audit':'Book Audit',
  'Connect with Alliance Team':'Connect with Team',
 };
 mobileLabel ??= compactLabels[label];
 const className=variant==='primary'?'primary-action':variant==='text'?'text-action':'conversion-action';
 return <a className={className} href={sitePath("/contact")} data-contact-modal aria-haspopup="dialog"><span>{mobileLabel?<><span className="action-label-desktop">{label}</span><span className="action-label-mobile">{mobileLabel}</span></>:label}</span><span className="action-arrow" aria-hidden="true" style={{WebkitMaskImage:`url("${arrow}")`,maskImage:`url("${arrow}")`}}/></a>;
}
