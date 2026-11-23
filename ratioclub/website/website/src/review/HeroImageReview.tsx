import { useEffect } from 'react';
import { HeroIndex } from '../components/HeroIndex';
import { Introduction } from '../components/Introduction';
import { HeroImageMotion } from './HeroImageMotion';
export default function HeroImageReview() {
  useEffect(()=>{document.title='Hero image motion — Ratioclub local review';},[]);
  return <main><HeroIndex media={<HeroImageMotion/>}/><Introduction/>
    <section className="hero-image-review-notes"><h2>One image. Code motion. No video.</h2>
      <p>The approved poster supplies the texture and blur. CSS adds a slow camera drift and light movement using transforms and opacity. This is a different motion treatment from the original video.</p>
      <p>One responsive WebP is selected: about 176KB on desktop or 50KB on mobile. No MP4, separate texture overlay, animated blur, displacement filter or animation library is needed for this hero. Motion pauses offscreen, while the tab is hidden, and by default for reduced motion or data saving.</p>
      <p>This local comparison has not replaced the Index hero. <a href="/">Compare the current Index</a>.</p>
    </section>
  </main>;
}
