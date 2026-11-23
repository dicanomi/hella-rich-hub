import { useEffect } from 'react';
import { HeroIndex } from '../components/HeroIndex';
import { Introduction } from '../components/Introduction';
import { HeroParticles } from './HeroParticles';
export default function HeroParticleReview() {
  useEffect(()=>{document.title='Hero particles — Ratioclub local review';},[]);
  return <main><HeroIndex media={<HeroParticles/>}/><Introduction/>
    <section className="hero-particle-review-notes"><h2>An image you can move.</h2>
      <p>Move your cursor across the hero. Fragments of the image move away and spring back into place. On touch screens, tap the background without dragging. Text and navigation stay interactive.</p>
      <p>One image: 344KB desktop or 74KB mobile. No MP4 or particle library. The canvas stops when the particles settle and while offscreen or hidden. Reduced motion and data saving start with the plain poster.</p>
      <p>This is a local comparison; the Index has not been replaced. <a href="/">Return to Index</a>.</p>
    </section>
  </main>;
}
