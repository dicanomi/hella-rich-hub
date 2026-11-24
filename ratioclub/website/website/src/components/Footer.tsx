import {useLocalCopyrightYear} from "./useLocalCopyrightYear";
import {sitePath} from "../config/paths";
import {PrivacyChoices} from "./PrivacyChoices";
import { BodyText } from "./BodyText";
import { primaryNavigationItems,legalNavigationItems } from "../content/index";
import './legal-navigation.css';
import { FooterWordmark } from "./FooterWordmark";
import rightArrow from "../assets/arrow-right-desktop.svg";
import mobileRightArrow from "../assets/arrow-right-mobile.svg";
import externalArrow from "../assets/arrow-external-desktop.svg";
import mobileExternalArrow from "../assets/arrow-external-mobile.svg";
import type { SectionSpacing } from "./Section";

export function Footer({ spacing, connected=false }: { spacing?: SectionSpacing; connected?:boolean }) {
  const year=useLocalCopyrightYear();
  return (
    <footer className={`site-footer${connected?" site-footer--connected":""}`} style={spacing}>
      <div className="footer-content">
        <nav aria-label="Footer navigation">
          <ul>
            {primaryNavigationItems.map((item) => {
              const label = item.label;
              const arrow = (
                <picture>
                  <source
                    media="(max-width: 48rem)"
                    srcSet={item.external ? mobileExternalArrow : mobileRightArrow}
                  />
                  <img draggable={false} src={item.external ? externalArrow : rightArrow} alt="" />
                </picture>
              );
              return (
                <BodyText as="li" key={label}>
                    <a href={sitePath(item.path)} target={item.external?'_blank':undefined} rel={item.external?'noopener noreferrer':undefined} data-contact-modal={item.path==='/contact'?true:undefined} aria-haspopup={item.path==='/contact'?'dialog':undefined} className="navigation-button">
                      {label}
                      {arrow}
                    </a>

                </BodyText>
              );
            })}
          </ul>
        </nav>
        <div className="copyright"><span>© {year} RatioClub INC. All <span className="text-tail">rights reserved.</span></span><PrivacyChoices/>
          <nav className="footer-legal-links" aria-label="Legal navigation">{[...legalNavigationItems].reverse().map(item=><a className="legal-nav-link" key={item.path} href={sitePath(item.path)}>{item.label}</a>)}</nav>
        </div>
      </div>
      <FooterWordmark />
    </footer>
  );
}
