export type Point3 = readonly [number, number, number];
export type WireframeShape = "sphere" | "horn" | "cubes" | "torus" | "rosette-08" | "rosette-09" | "rosette-10" | "rosette-11" | "rosette-12" | "rosette-13";
export type WireLine = Point3[];
const tau = Math.PI * 2;
const sample = (fn: (t: number) => Point3, count = 48): WireLine =>
  Array.from({ length: count + 1 }, (_, index) => fn(index / count));

function rotation(rx: number, ry: number, rz: number) {
  // Reuse the six trigonometric values across every vertex in a frame.
  const sx = Math.sin(rx), cx = Math.cos(rx);
  const sy = Math.sin(ry), cy = Math.cos(ry);
  const sz = Math.sin(rz), cz = Math.cos(rz);
  return ([x, y, z]: Point3): Point3 => {
    const y1 = y * cx - z * sx;
    const z1 = y * sx + z * cx;
    const x2 = x * cy + z1 * sy;
    return [x2 * cz - y1 * sz, x2 * sz + y1 * cz, -x * sy + z1 * cy];
  };
}

export function rotate(point: Point3, rx: number, ry: number, rz: number): Point3 {
  return rotation(rx, ry, rz)(point);
}

// Orthographic rotation preserves this radius at every possible orientation.
// Keep 20 SVG units of padding, including room for strokes.
export function fittedScale(lines: WireLine[], shape?: WireframeShape) {
  let radius = 0;
  for (const line of lines) for (const point of line) radius = Math.max(radius, Math.hypot(...point));
  const visualBalance = shape === "sphere" || shape === "torus" ? 0.8 : 1;
  return radius > 0 ? (140 / radius) * visualBalance : 1;
}

export function makeWireframe(shape: WireframeShape): WireLine[] {
  if (shape.startsWith("rosette-")) {
    // Parametric studies, not inferred depth from the flat source SVGs.
    const index=Number(shape.slice(-2))-8;
    const petals=[12,7,10,12,7,10][index];
    const layered=index<3;
    const at=(u:number,v:number):Point3=>{
      // Separate silhouettes: pointed crown, swept seven-lobe ribbon, rounded
      // ten-lobe ring, long sunburst, pinwheel and soft scalloped membrane.
      let radius:number, depth:number, azimuth=u;
      if(index===0) {
        const peak=Math.pow((1+Math.cos(petals*u))/2,3);
        radius=.52+.30*peak+.13*Math.cos(v);
        depth=.32*Math.sin(v);
      } else if(index===1) {
        azimuth=u+.32*Math.sin(v);
        radius=.63+.20*Math.cos(petals*u+v)+.13*Math.cos(v);
        depth=.34*Math.sin(v)+.10*Math.sin(petals*u);
      } else if(index===2) {
        radius=.69+.17*Math.cos(petals*u)+.12*Math.cos(v);
        depth=.18*Math.sin(v)*(.8+.2*Math.cos(petals*u));
      } else if(index===3) {
        const peak=Math.pow((1+Math.cos(petals*u))/2,4);
        radius=.15+v*(.43+.48*peak);
        depth=.12*Math.sin(petals*u)*v;
      } else if(index===4) {
        azimuth=u+.65*v*v;
        radius=.18+v*(.52+.23*Math.cos(petals*u));
        depth=.30*Math.sin(petals*u+.8*v)*v;
      } else {
        radius=.24+v*(.58+.13*Math.cos(petals*u));
        depth=.09*Math.sin(petals*u)*Math.sin(v*Math.PI/2);
      }
      return [radius*Math.cos(azimuth),radius*Math.sin(azimuth),depth];
    };
    return [
      ...Array.from({length:layered?12:7},(_,i)=>sample(t=>at(t*tau,layered?i/12*tau:i/6),144)),
      ...Array.from({length:36},(_,i)=>sample(t=>at(i/36*tau,layered?t*tau:t),layered?36:16)),
    ];
  }
  if (shape === "sphere") {
    const at = (u: number, v: number): Point3 => [Math.cos(u) * Math.cos(v), Math.sin(v), Math.sin(u) * Math.cos(v)];
    return [
      ...Array.from({ length: 9 }, (_, i) => sample(t => at(t * tau, -Math.PI / 2 + ((i + 1) / 10) * Math.PI))),
      ...Array.from({ length: 12 }, (_, i) => sample(t => at((i / 12) * tau, (t - 0.5) * Math.PI))),
    ];
  }
  if (shape === "horn") {
    const at = (u: number, v: number): Point3 => {
      const radius = 0.95 * Math.pow(1 - v, 0.8) + 0.04;
      return [radius * Math.cos(u) + 0.7 * v * v - 0.2, (v - 0.5) * 1.9, radius * Math.sin(u)];
    };
    return [
      ...Array.from({ length: 11 }, (_, i) => sample(t => at(t * tau, i / 10))),
      ...Array.from({ length: 12 }, (_, i) => sample(t => at((i / 12) * tau, t))),
    ];
  }
  if (shape === "torus") {
    const at = (u: number, v: number): Point3 => [(0.78 + 0.31 * Math.cos(v)) * Math.cos(u), 0.31 * Math.sin(v), (0.78 + 0.31 * Math.cos(v)) * Math.sin(u)];
    return [
      ...Array.from({ length: 14 }, (_, i) => sample(t => at((i / 14) * tau, t * tau))),
      ...Array.from({ length: 10 }, (_, i) => sample(t => at(t * tau, (i / 10) * tau))),
    ];
  }
  const vertices: Point3[] = Array.from({ length: 8 }, (_, i) => [i & 1 ? 1 : -1, i & 2 ? 1 : -1, i & 4 ? 1 : -1]);
  return Array.from({ length: 5 }, (_, layer) => {
    const scale = 0.64 - layer * 0.09;
    const points = vertices.map(([x, y, z]) => rotate([x * scale, y * scale, z * scale], layer * 0.23, layer * 0.18, layer * 0.25));
    return vertices.flatMap((_, i) => [1, 2, 4].filter(bit => !(i & bit)).map(bit => [points[i], points[i | bit]]));
  }).flat();
}

const poses: Record<WireframeShape, Point3> = {
  sphere: [0.3, 0.25, -0.2], horn: [0.35, -0.3, -0.65],
  cubes: [0.45, 0.65, 0.15], torus: [0.85, 0.35, 0.3],
  "rosette-08":[.65,.12,0], "rosette-09":[.65,.12,0], "rosette-10":[.65,.12,0],
  "rosette-11":[.18,.12,0], "rosette-12":[.18,.12,0], "rosette-13":[.18,.12,0],
};

export function makeProjector(shape: WireframeShape, angle: number, scale: number) {
  const [rx, ry, rz] = poses[shape];
  const rotatePoint = rotation(rx + angle * 0.2, ry + angle, rz);
  return (line: WireLine) => {
    let depth = 0;
    const path = line.map((point, index) => {
      const [x, y, z] = rotatePoint(point);
      depth += z;
      return `${index === 0 ? "M" : "L"}${(160 + x * scale).toFixed(2)},${(160 - y * scale).toFixed(2)}`;
    }).join("");
    return { path, opacity: 0.22 + Math.max(0, Math.min(1, (depth / line.length + 1.2) / 2.4)) * 0.38 };
  };
}
