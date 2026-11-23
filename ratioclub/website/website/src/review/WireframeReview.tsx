import { RotatingWireframe } from "../motion/wireframe/RotatingWireframe";
import "./wireframe-review.css";
export default function WireframeReview() {
  return <main className="wireframe-review">
    <header>
      <a href="/">← Index review</a>
      <h1>Real 3D geometry, rendered as SVG</h1>
      <p>Hover over a shape to rotate it. Move away to let it coast smoothly to a stop. The Rotate buttons turn it through 81° and also work with touch and keyboard.</p>
      <p>These are procedural studies of the four shapes—not exact replacements for your approved artwork. No WebGL, model downloads or animation library. Motion stops at rest and offscreen; reduced motion stays static.</p>
    </header>
    <section className="wireframe-review-grid" aria-label="Rotating wireframe studies">
      <RotatingWireframe shape="sphere" label="Sphere" />
      <RotatingWireframe shape="horn" label="Tapered surface" />
      <RotatingWireframe shape="cubes" label="Nested cubes" />
      <RotatingWireframe shape="torus" label="Torus" />
    </section>
  </main>;
}
