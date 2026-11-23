import { BodyText } from "../components/BodyText";
import { aboutContent as content } from "../content/about";
import { SubpageHero } from "../components/SubpageHero";
import { SubpageIntroduction } from "../components/SubpageIntroduction";
import { ConversionBanner } from "../components/ConversionBanner";
import { Footer } from "../components/Footer";
import {MorphObject} from "../components/SacredMorphShapes";
import { Section } from "../components/Section";
import {GoldenObject} from "../components/GoldenRatioShape";
import "./about.css";
import {useRef} from 'react';
import {useAboutSectionGaps} from '../components/useAboutSectionGaps';

function AboutSectionHeading({number,id,title}:{number:string;id:string;title:string}) {
  return <div className="about-section-heading"><BodyText as="p" className="about-number" aria-hidden="true">_{number}</BodyText><h2 id={id}>{title}</h2></div>;
}
function AboutCardGroup({cards,wrapTitles=false,startShape=0}:{startShape?:number;cards:readonly {title:string;body:string;artwork:string}[];wrapTitles?:boolean}) {
  return <div className="about-card-grid">{cards.map((card,index)=><article className="about-feature-card" key={card.title}>
    <div className="about-artwork-slot"><div className="about-artwork-size"><MorphObject offset={startShape+index} density="medium" variant="about" /></div></div>
    <h3>{wrapTitles?<><span className="about-standard-title-line">{card.title.slice(0,card.title.lastIndexOf(' '))}</span>{' '}<span className="about-standard-title-line">{card.title.slice(card.title.lastIndexOf(' ')+1)}</span></>:card.title}</h3><BodyText as="p">{card.body}</BodyText>
  </article>)}</div>;
}
export default function AboutPage() {
  const root=useRef<HTMLDivElement>(null);
  useAboutSectionGaps(root);
  return <div ref={root} className="about-page">
    <a className="skip-link" href="#page-title">Skip to main content</a>
    <SubpageHero title={content.title} artworkContent={<GoldenObject offset={1} fitToFrame rotationOnly arms={3}/>} width={211} height={211} />
    <main>
      <SubpageIntroduction id="about-introduction-title" className="about-introduction" title={content.introductionTitle} lead={content.introductionLead} detail={content.introductionDetail} action={content.action} dialogTitle={content.action} />
      <Section id="about-standard" className="about-section about-standard" label="about-standard-title">
        <AboutSectionHeading number="01" id="about-standard-title" title={content.standardTitle} />
        <BodyText as="p" className="about-section-description">{content.standardIntroduction}</BodyText>
        <AboutCardGroup cards={content.standard} wrapTitles />
      </Section>
      <Section id="about-capabilities" className="about-section about-capabilities" label="about-capabilities-title">
        <AboutSectionHeading number="02" id="about-capabilities-title" title={content.capabilitiesTitle} />
        <BodyText as="p" className="about-section-description">{content.capabilitiesIntroduction}</BodyText>
        <table className="about-capabilities-table" role="table" aria-labelledby="about-capabilities-title">
          <caption className="capabilities-mobile-caption">Engineering Focus</caption>
          <thead role="rowgroup"><tr role="row"><th role="columnheader" scope="col">Engineering Focus</th><th role="columnheader" scope="col">Technical Scope &amp; AWS Architecture</th><th role="columnheader" scope="col">Business Outcome</th></tr></thead>
          <tbody role="rowgroup">{content.capabilities.map(row=><tr role="row" key={row.title}>
            <BodyText as="th" role="rowheader" scope="row">{row.title}</BodyText>
            <BodyText as="td" role="cell"><span className="capabilities-mobile-label">Technical scope &amp; AWS architecture</span>{row.scope}</BodyText>
            <BodyText as="td" role="cell"><span className="capabilities-mobile-label">Business outcome</span>{row.outcome}</BodyText>
          </tr>)}</tbody>
        </table>
      </Section>
      <Section id="about-heritage" className="about-section about-heritage" label="about-heritage-title">
        <AboutSectionHeading number="03" id="about-heritage-title" title={content.heritageTitle} />
        <div className="about-heritage-columns">
          <blockquote><BodyText as="p" className="heritage-quote-mobile">{content.heritageQuote}</BodyText><BodyText as="p" className="heritage-quote-text">{content.heritageQuote.slice(1,-1)}</BodyText><BodyText as="p" className="heritage-quote-attribution">~ Jason Cutrer</BodyText></blockquote>
          <div>{content.heritageParagraphs.map(paragraph=><BodyText as="p" key={paragraph}>{paragraph}</BodyText>)}</div>
        </div>
      </Section>
      <Section id="about-principles" className="about-section about-principles" label="about-principles-title">
        <AboutSectionHeading number="04" id="about-principles-title" title={content.principlesTitle} />
        <AboutCardGroup cards={content.principles} startShape={3} />
      </Section>
      <ConversionBanner content={content.conversion} titleBreakAfter="Reliable," />
    </main>
    <Footer connected />
  </div>;
}
