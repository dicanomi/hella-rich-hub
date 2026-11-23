import {Header} from '../components/Header';
import {Footer} from '../components/Footer';
import {PrivacyNoticeContent} from '../components/PrivacyNoticeContent';
import {TermsConditionsContent} from '../components/TermsConditionsContent';
import {SacredMorphShapes} from '../components/SacredMorphShapes';
import './legal.css';

export default function LegalPage({document:kind}:{document:'terms'|'privacy'}){
 const title=kind==='terms'?'Terms & Conditions':'Privacy Notice';
 return <div className="legal-page legal-reading-preview">
  <a className="skip-link" href="#legal-document">Skip to document</a>
  <div className="legal-simple-header"><Header/></div>
  <main id="legal-document" className="legal-reading-layout" tabIndex={-1}>
   <SacredMorphShapes variant={kind==='privacy'?'privacy':'terms'}/>
   <article className="legal-reading-document" aria-labelledby="page-title">
    <h1 id="page-title" tabIndex={-1}>{title}</h1>
    {kind==='privacy'?<PrivacyNoticeContent/>:<TermsConditionsContent/>}
   </article>
  </main>
  <Footer/>
 </div>;
}
