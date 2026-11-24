import {sitePath} from '../config/paths';
import wordmark from '../assets/footer-wordmark-static.webp';

// The approved progressive blur is baked once, rather than composited in 13 GPU layers.
export function FooterWordmark(){
 return <a className="footer-wordmark" href={sitePath('/')} aria-label="Ratioclub home"><img src={wordmark} width="2585" height="458" alt="" loading="lazy" decoding="async"/></a>;
}
