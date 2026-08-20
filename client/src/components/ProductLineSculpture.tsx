import { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';

type Point2 = [number, number];

type ProductLineSculptureProps = {
  slug: string;
  active: boolean;
  hovered?: boolean;
};

const POINT_COUNT = 180;
const OFFSETS = [
  { color: '#ff304f', x: -0.018, y: 0.012, opacity: 0.68 },
  { color: '#2dfdff', x: 0.018, y: -0.01, opacity: 0.72 },
  { color: '#f7f3ea', x: 0, y: 0, opacity: 0.88 },
];

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

function makeReelPoints(centerX: number, variant: number): Point2[] {
  return Array.from({ length: POINT_COUNT }, (_, i) => {
    const t = i / POINT_COUNT;
    const a = t * Math.PI * 2;
    const reelNotch = Math.sin(a * 6 + variant) * 0.018;
    const r = 0.27 + reelNotch;
    return [
      centerX + Math.cos(a + variant * 0.08) * r,
      Math.sin(a + variant * 0.08) * r,
    ];
  });
}

function makeOrbRingPoints(radius: number, variant: number): Point2[] {
  return Array.from({ length: POINT_COUNT }, (_, i) => {
    const t = i / POINT_COUNT;
    const a = t * Math.PI * 2;
    const pulse = Math.sin(a * 4 + variant) * 0.006;
    return [
      Math.cos(a + variant * 0.04) * (radius + pulse),
      Math.sin(a + variant * 0.04) * (radius + pulse),
    ];
  });
}

function makeSpaceDots(seed: number) {
  return Array.from({ length: 150 }, (_, i) => {
    const t = i / 150;
    const a = i * 2.399963 + seed;
    const radius = Math.sqrt(t) * 0.88;
    return {
      x: Math.cos(a) * radius * 0.72,
      y: Math.sin(a) * radius * 0.44,
      z: -1.8 - ((i * 0.137 + seed) % 1) * 2.4,
      speed: 0.008 + ((i * 17) % 11) * 0.0014,
      size: 0.012 + ((i * 13) % 7) * 0.002,
    };
  });
}

function makePoints(slug: string, variant: number): Point2[] {
  return Array.from({ length: POINT_COUNT }, (_, i) => {
    const t = i / (POINT_COUNT - 1);
    const a = t * Math.PI * 2;
    const turn = t * Math.PI * 8;
    const wobble = Math.sin(a * 3 + variant) * 0.04;

    switch (slug) {
      case 'deck': {
        const reel = t < 0.5 ? -0.32 : 0.32;
        const local = (t % 0.5) * Math.PI * 2;
        const r = 0.27 + Math.sin(local * 6 + variant) * 0.018;
        return [reel + Math.cos(local + variant * 0.08) * r, Math.sin(local + variant * 0.08) * r];
      }
      case 'hella.fm':
        return [(t - 0.5) * 1.48, Math.sin(t * Math.PI * 14 + variant) * 0.22 + Math.sin(t * Math.PI * 31) * 0.04];
      case 'synth':
        return [(t - 0.5) * 1.5, Math.sin(t * Math.PI * 10 + variant) * Math.sin(t * Math.PI * 2) * 0.32];
      case 'radio':
        return [(t - 0.5) * 1.42, Math.sin(t * Math.PI * 18 + variant) * 0.14 + Math.sin(t * Math.PI * 36) * 0.08];
      case 'machine-exe':
        return [(t - 0.5) * 1.38, (Math.sin(t * 19 + variant) * 0.12) + (t > 0.62 ? (t - 0.62) * 0.9 : 0) - 0.12];
      case 'happy-human': {
        const r = 0.42 + Math.sin(a * 5 + variant) * 0.018;
        return [Math.cos(a) * r * 0.72, Math.sin(a) * r + (t > 0.56 && t < 0.68 ? -0.12 : 0)];
      }
      case 'human-exe':
        return [Math.cos(a) * (0.62 + wobble), Math.sin(a) * 0.18 + Math.sin(a * 2 + variant) * 0.04];
      case 'orb': {
        const ring = 0.16 + Math.floor(t * 5) * 0.09;
        return [Math.cos(a + variant * 0.04) * ring, Math.sin(a + variant * 0.04) * ring];
      }
      case 'dead-air': {
        const side = t < 0.5 ? -0.28 : 0.28;
        const local = (t % 0.5) * Math.PI * 2;
        const r = 0.26 + Math.sin(local * 6) * 0.035;
        return [side + Math.cos(local + variant) * r, Math.sin(local + variant) * r];
      }
      case 'aether': {
        const r = 0.54 - t * 0.46;
        return [Math.cos(turn + variant) * r, Math.sin(turn + variant) * r * 0.82];
      }
      case 'space-drone': {
        const r = Math.sqrt(t) * 0.62;
        return [Math.cos(a * 5 + variant) * r, Math.sin(a * 5 + variant) * r];
      }
      case 'low-battery':
        return [(t - 0.5) * 1.18, Math.sin(t * Math.PI * 2 + variant) * 0.04 + (t > 0.74 && t < 0.84 ? 0.28 : -0.02)];
      case 'fourcast':
        return [(t - 0.5) * 1.18 + Math.sin(t * 40) * 0.04, Math.sin(t * 27 + variant) * 0.22 + Math.sign(Math.sin(t * 9)) * 0.08];
      case 'the-eye': {
        const eye = Math.sin(a);
        return [Math.cos(a) * 0.62, eye * 0.22 + Math.sin(a * 2 + variant) * 0.03];
      }
      default:
        return [Math.cos(a) * (0.42 + wobble), Math.sin(a) * (0.3 + wobble)];
    }
  });
}

function writePositions(positions: Float32Array, points: Point2[], phase: number, hover: number) {
  points.forEach(([x, y], index) => {
    const i = index * 3;
    const z = Math.sin(index * 0.18 + phase) * (0.08 + hover * 0.08);
    positions[i] = x;
    positions[i + 1] = y;
    positions[i + 2] = z;
  });
}

function buildGeometry(points: Point2[], phase: number, hover: number) {
  const positions = new Float32Array(points.length * 3);
  writePositions(positions, points, phase, hover);
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  return geometry;
}

function updateGeometry(geometry: THREE.BufferGeometry, points: Point2[], phase: number, hover: number) {
  const position = geometry.getAttribute('position') as THREE.BufferAttribute | undefined;
  if (!position) return;
  writePositions(position.array as Float32Array, points, phase, hover);
  position.needsUpdate = true;
}

export function ProductLineSculpture({ slug, active, hovered = false }: ProductLineSculptureProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const hoverRef = useRef(hovered ? 1 : 0);
  const [ready, setReady] = useState(false);
  const targets = useMemo(() => [makePoints(slug, 0), makePoints(slug, 1.7), makePoints(slug, 3.1)], [slug]);

  useEffect(() => {
    hoverRef.current = hovered ? 1 : 0;
  }, [hovered]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !active) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 10);
    camera.position.z = 2.6;
    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: 'low-power' });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
    renderer.setClearColor(0x000000, 0);

    const group = new THREE.Group();
    scene.add(group);
    const spaceDots = slug === 'space-drone' ? makeSpaceDots(0.38) : [];
    const orbGroups = slug === 'orb'
      ? [0.16, 0.25, 0.34, 0.43, 0.52].map((radius, ringIndex) => {
          const ring = new THREE.Group();
          group.add(ring);
          const geometry = buildGeometry(makeOrbRingPoints(radius, ringIndex * 0.9), 0, 0);
          const ringLines = OFFSETS.map(({ color, opacity, x, y }) => {
            const line = new THREE.Line(
              geometry.clone(),
              new THREE.LineBasicMaterial({ color, transparent: true, opacity: opacity * 0.86, linewidth: 1 }),
            );
            line.position.set(x, y, 0);
            ring.add(line);
            return line;
          });
          return { ring, lines: ringLines, radius, spin: ringIndex % 2 === 0 ? 1 : -1 };
        })
      : [];
    const reelGroups = slug === 'deck'
      ? [-0.32, 0.32].map((centerX, reelIndex) => {
          const reel = new THREE.Group();
          reel.position.x = centerX;
          group.add(reel);
          const geometry = buildGeometry(makeReelPoints(0, reelIndex * 1.4), 0, 0);
          const reelLines = OFFSETS.map(({ color, opacity, x, y }) => {
            const line = new THREE.Line(
              geometry.clone(),
              new THREE.LineBasicMaterial({ color, transparent: true, opacity, linewidth: 1 }),
            );
            line.position.set(x, y, 0);
            reel.add(line);
            return line;
          });
          return { reel, lines: reelLines, spin: reelIndex === 0 ? 1 : -1 };
        })
      : [];
    const points = slug === 'space-drone'
      ? OFFSETS.map(({ color, opacity, x, y }) => {
          const geometry = new THREE.BufferGeometry();
          const positions = new Float32Array(spaceDots.length * 3);
          spaceDots.forEach((dot, index) => {
            const i = index * 3;
            positions[i] = dot.x + x;
            positions[i + 1] = dot.y + y;
            positions[i + 2] = dot.z;
          });
          geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
          const cloud = new THREE.Points(
            geometry,
            new THREE.PointsMaterial({
              color,
              transparent: true,
              opacity,
              size: 0.026,
              sizeAttenuation: true,
              depthWrite: false,
            }),
          );
          group.add(cloud);
          return cloud;
        })
      : [];
    const lines = slug === 'space-drone' || slug === 'deck' || slug === 'orb'
      ? []
      : OFFSETS.map(({ color, opacity, x, y }) => {
          const line = new THREE.Line(
            buildGeometry(targets[0], 0, 0),
            new THREE.LineBasicMaterial({ color, transparent: true, opacity, linewidth: 1 }),
          );
          line.position.set(x, y, 0);
          group.add(line);
          return line;
        });

    let frame = 0;
    let raf = 0;
    let current = targets[0];
    let next = targets[1];
    let morph = 0;
    let targetIndex = 1;
    let hoverValue = 0;

    const resize = () => {
      const parent = canvas.parentElement;
      const width = parent?.clientWidth || 320;
      const height = parent?.clientHeight || 240;
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    };

    const draw = () => {
      frame += 0.016;
      hoverValue += (hoverRef.current - hoverValue) * 0.08;
      morph = clamp(morph + 0.006 + hoverValue * 0.018, 0, 1);
      if (slug === 'deck') {
        reelGroups.forEach(({ reel, lines: reelLines, spin }, reelIndex) => {
          const reelPoints = makeReelPoints(0, frame * spin * 3.4 + reelIndex * 1.4);
          reelLines.forEach((line, index) => {
            updateGeometry(line.geometry, reelPoints, frame + index * 0.26, hoverValue);
          });
          reel.rotation.z += spin * (0.018 + hoverValue * 0.024);
        });
      } else if (slug === 'orb') {
        orbGroups.forEach(({ ring, lines: ringLines, radius, spin }, ringIndex) => {
          const ringPoints = makeOrbRingPoints(radius + Math.sin(frame * 1.2 + ringIndex) * 0.004, frame * spin * 0.8 + ringIndex * 0.9);
          ringLines.forEach((line, index) => {
            updateGeometry(line.geometry, ringPoints, frame + index * 0.22 + ringIndex * 0.18, hoverValue);
          });
          ring.rotation.x = Math.sin(frame * 0.52 + ringIndex) * (0.12 + hoverValue * 0.08);
          ring.rotation.y = Math.cos(frame * 0.47 + ringIndex) * (0.16 + hoverValue * 0.1);
          ring.rotation.z += spin * (0.004 + hoverValue * 0.006);
        });
      } else if (slug === 'space-drone') {
        spaceDots.forEach(dot => {
          dot.z += dot.speed * (1.2 + hoverValue * 3.2);
          if (dot.z > 0.72) {
            dot.z = -3.8;
          }
        });
        points.forEach((cloud, cloudIndex) => {
          const position = cloud.geometry.getAttribute('position') as THREE.BufferAttribute;
          const offset = OFFSETS[cloudIndex];
          spaceDots.forEach((dot, index) => {
            const depth = clamp((dot.z + 3.8) / 4.5, 0, 1);
            const spread = 0.82 + depth * (0.72 + hoverValue * 0.34);
            const i = index * 3;
            position.array[i] = dot.x * spread + offset.x;
            position.array[i + 1] = dot.y * spread + offset.y;
            position.array[i + 2] = dot.z;
          });
          position.needsUpdate = true;
        });
      } else {
        const eased = morph * morph * (3 - 2 * morph);
        const mixed = current.map(([x, y], index) => {
          const [nx, ny] = next[index];
          return [x + (nx - x) * eased, y + (ny - y) * eased] as Point2;
        });
        lines.forEach((line, index) => {
          updateGeometry(line.geometry, mixed, frame + index * 0.26, hoverValue);
        });
      }
      group.rotation.x = Math.sin(frame * 0.7) * 0.16 + hoverValue * 0.08;
      group.rotation.y = Math.sin(frame * 0.55) * 0.22 + hoverValue * 0.22;
      group.rotation.z += slug === 'space-drone' || slug === 'deck' || slug === 'orb' ? 0.0008 : 0.002 + hoverValue * 0.004;
      renderer.render(scene, camera);
      if (slug !== 'space-drone' && slug !== 'deck' && slug !== 'orb' && morph >= 1) {
        current = next;
        targetIndex = (targetIndex + 1) % targets.length;
        next = targets[targetIndex];
        morph = 0;
      }
      raf = window.requestAnimationFrame(draw);
    };

    resize();
    setReady(true);
    draw();
    window.addEventListener('resize', resize);

    return () => {
      window.cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
      lines.forEach(line => {
        line.geometry.dispose();
        (line.material as THREE.Material).dispose();
      });
      points.forEach(point => {
        point.geometry.dispose();
        (point.material as THREE.Material).dispose();
      });
      reelGroups.forEach(({ lines: reelLines }) => {
        reelLines.forEach(line => {
          line.geometry.dispose();
          (line.material as THREE.Material).dispose();
        });
      });
      orbGroups.forEach(({ lines: ringLines }) => {
        ringLines.forEach(line => {
          line.geometry.dispose();
          (line.material as THREE.Material).dispose();
        });
      });
      renderer.dispose();
      setReady(false);
    };
  }, [active, targets]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        opacity: ready ? 1 : 0,
        transition: 'opacity 0.28s ease',
        pointerEvents: 'none',
      }}
    />
  );
}
