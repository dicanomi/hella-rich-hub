import { useRef, useState } from "react";
import { AdvantageMotion } from "../motion/AdvantageMotion";
import type { AdvantageMotionMode } from "../motion/AdvantageMotion";
import { ForwardDeployedAdvantage } from "../components/ForwardDeployedAdvantage";
import referenceVideo from "../assets/review/advantage-motion-reference.mp4";
import "./motion-review.css";

export default function MotionReview() {
  const [mode, setMode] = useState<AdvantageMotionMode>("scroll");
  const [replay, setReplay] = useState(0);
  const stage = useRef<HTMLDivElement>(null);
  function choose(next: AdvantageMotionMode) {
    setMode(next);
    setReplay(value => value + 1);
    if (next === "entry") stage.current?.scrollIntoView({ behavior: "instant", block: "start" });
    else {
      const artwork = stage.current?.querySelector(".advantage-diagram");
      if (artwork) window.scrollTo({ top: window.scrollY + artwork.getBoundingClientRect().top - window.innerHeight * 0.9, behavior: "instant" });
    }
  }
  return <main className="motion-review">
    <header className="motion-review-header">
      <a href="/">← Index review</a>
      <h1>Forward Deployed Advantage — motion review</h1>
      <p>The planes open, the curve traces, then the illustration settles. Native scrolling throughout.</p>
      <p>Scroll down to compare the two versions. Reduced motion shows the completed artwork.</p>
    </header>
    <nav className="motion-review-controls" aria-label="Motion comparison">
      <button aria-pressed={mode === "entry"} onClick={() => choose("entry")}>A · Play once on entry</button>
      <button aria-pressed={mode === "scroll"} onClick={() => choose("scroll")}>B · Scroll controlled</button>
      <button onClick={() => choose(mode)}>Replay / reset</button>
    </nav>
    <div ref={stage} className="motion-review-stage">
      <div className="motion-review-note" role="status">
        {mode === "entry" ? "A · Opens in 0.8 seconds, then holds. Scrolling back does not replay it." : "B · Opens as you scroll down. Scroll upward to close it. No pinning or snapping."}
      </div>
      <ForwardDeployedAdvantage artwork={<AdvantageMotion mode={mode} replay={replay} />} />
    </div>
    <section className="motion-review-reference">
      <h2>Your MP4 reference</h2>
      <p>Original six-second reference. Manual playback, no loop. The SVG prototypes above preserve the website’s existing artwork and colors.</p>
      <video controls playsInline preload="none" src={referenceVideo} aria-label="Supplied graph opening motion reference" />
      <p><a href="/">Return to the Index</a></p>
    </section>
  </main>;
}
