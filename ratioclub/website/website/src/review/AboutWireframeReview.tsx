import { RotatingWireframe } from '../motion/wireframe/RotatingWireframe';
import type { WireframeShape } from '../motion/wireframe/geometry';
import { aboutContent } from '../content/about';
import './wireframe-review.css';
import './about-wireframe-review.css';
const originals=import.meta.glob('../assets/illustration-*.svg',{eager:true,query:'?url',import:'default'}) as Record<string,string>;
export default function AboutWireframeReview() {
  const cards=[...aboutContent.standard,...aboutContent.principles];
  return <main className="wireframe-review about-wireframe-review">
    <header><a href="/about">← About Us</a><h1>About — true 3D studies</h1>
      <p>Original artwork above; rotating study below. Hover to rotate, then let it coast to a stop. Rotate buttons work with touch and keyboard.</p>
      <p>The source SVGs contain no depth data. These are procedural interpretations for review, with the About page artwork preserved. No WebGL, model downloads or new dependencies.</p></header>
    <section className="about-wireframe-review-grid" aria-label="About 3D comparisons">{cards.map(card=><article key={card.artwork}>
      <p className="study-label">Original Figma SVG</p><div className="study-original"><img src={originals[`../assets/illustration-${card.artwork}.svg`]} alt="" /></div>
      <p className="study-label">True 3D interpretation</p><RotatingWireframe shape={`rosette-${card.artwork}` as WireframeShape} label={card.title.replace(/\n/g,' ')} />
    </article>)}</section>
  </main>;
}
