import notice from '../content/privacy-notice.json';
import {PrivacyChoicesLink} from './PrivacyChoices';

type Block={type:string;text?:string;number?:string;items?:string[];rows?:string[][]};
function NoticeBlock({block}:{block:Block}){
 if(block.type==='heading')return <h3 className="legal-clause-label"><span className="legal-clause-number">{block.number}</span> {block.text}</h3>;
 if(block.type==='list')return <ul>{block.items?.map((item,i)=><li key={i}>{item}</li>)}</ul>;
 if(block.type==='table')return <div className="legal-notice-table-scroll" role="region" aria-label="Categories of personal information" tabIndex={0}><table><caption>Categories of Personal Information Collected</caption><thead><tr><th scope="col">Category</th><th scope="col">Examples</th><th scope="col">Collected</th></tr></thead><tbody>{block.rows?.map((row,i)=><tr key={i}><th scope="row">{row[0]}</th><td>{row[1]}</td><td>{row[2]}</td></tr>)}</tbody></table></div>;
 return <p>{block.text}</p>;
}
export function PrivacyNoticeContent(){
 return <>
  <p className="legal-reading-effective">Last updated: {notice.updated}</p>
  <div className="legal-reading-introduction"><p>{notice.subtitle}</p>{notice.introduction.map((block,i)=><NoticeBlock block={block} key={i}/>)}</div>
  <div className="legal-privacy-choices"><PrivacyChoicesLink/></div>
  <nav className="legal-reading-contents" aria-label="Privacy Notice contents"><ol>{notice.parts.map(part=><li key={part.id}><a href={'#'+part.id}>{part.title}</a></li>)}</ol></nav>
  {notice.parts.map(part=><section className="legal-reading-section legal-notice-part" id={part.id} aria-labelledby={part.id+'-title'} key={part.id}><h2 id={part.id+'-title'}>{part.title}</h2>{part.blocks.map((block,i)=><NoticeBlock block={block} key={i}/>)}</section>)}
 </>;
}
