import terms from '../content/terms-and-conditions.json';
import {sitePath} from '../config/paths';
type Block={type:string;text?:string;items?:string[]};
function TermsText({text}:{text:string}){
 const parts=text.split('/privacy-notice');
 return <>{parts.map((part,i)=><span key={i}>{i>0?<a href={sitePath('/privacy-notice')}>/privacy-notice</a>:null}{part}</span>)}</>;
}
function TermsBlock({block}:{block:Block}){
 if(block.type==='heading')return <h3 className="legal-clause-label">{block.text}</h3>;
 if(block.type==='list'||block.type==='ordered-list'){
  const List=block.type==='ordered-list'?'ol':'ul';
  return <List>{block.items?.map((item,i)=><li key={i}><TermsText text={item}/></li>)}</List>;
 }
 return <p><TermsText text={block.text??''}/></p>;
}
export function TermsConditionsContent(){
 return <>
  <p className="legal-reading-effective">Last updated: {terms.updated}</p>
  <div className="legal-reading-introduction"><p>{terms.subtitle}</p></div>
  <nav className="legal-reading-contents" aria-label="Terms & Conditions contents"><ol>{terms.sections.map(section=><li key={section.id}><a href={'#'+section.id}>{section.title}</a></li>)}</ol></nav>
  {terms.sections.map(section=><section className="legal-reading-section legal-notice-part" id={section.id} aria-labelledby={section.id+'-title'} key={section.id}><h2 id={section.id+'-title'}>{section.number}. {section.title}</h2>{section.blocks.map((block,i)=><TermsBlock block={block} key={i}/>)}</section>)}
 </>;
}
