import { useState } from "react";
import { CoreSolutions } from "../components/CoreSolutions";
import { SolutionGraph } from "../motion/solutions/SolutionGraph";
import "./graph-review.css";
export default function GraphReview() {
  const [replay, setReplay] = useState(0);
  return <main className="graph-review">
    <header className="graph-review-header">
      <a href="/">← Index review</a>
      <h1>Core Solutions — motion review</h1>
      <p>The dot travels back and forth as the line shifts from dark to cyan and back. The cycle repeats while visible. Hover to open the mesh layers; move away to let them settle.</p>
      <div className="graph-review-controls">
        <button className="graph-replay" onClick={() => setReplay(value => value + 1)}>Restart loop</button>
      </div>
      <p>Animation pauses offscreen and in background tabs. Reduced motion shows the static artwork.</p>
    </header>
    <CoreSolutions artworks={(["gpu", "inference", "operations"] as const).map(variant => <SolutionGraph key={`${variant}-${replay}`} variant={variant} />)} />
  </main>;
}
