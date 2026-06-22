/**
 * HumanScanner3D — React Three Fiber 3D scanner chamber
 *
 * Procedural human built entirely in Three.js — no GLB, no external assets.
 * Each body part is a smooth Three.js geometry (sphere, capsule, cylinder).
 * Rendered as: dark solid fill + cyan wireframe overlay.
 * Matches reference: clean polygon grid on a dark figure.
 *
 * Body ALWAYS rotates — never static.
 */
import { useRef, useMemo, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';

type ScanState = 'idle' | 'powering' | 'scanning' | 'analysis' | 'results';

interface HumanScanner3DProps {
  scanState: ScanState;
  scanProgress: number;
  activeZones: string[];
}

// ── Body part definition ──────────────────────────────────────────────────────
interface BodyPart {
  geo: THREE.BufferGeometry;
  pos: [number, number, number];
  rot?: [number, number, number];
  zone: string;
}

// ── Build human geometry ──────────────────────────────────────────────────────
function buildHuman(): BodyPart[] {
  const parts: BodyPart[] = [];

  // HEAD — smooth sphere
  parts.push({ geo: new THREE.SphereGeometry(0.115, 16, 12), pos: [0, 1.62, 0], zone: 'head' });

  // NECK
  parts.push({ geo: new THREE.CylinderGeometry(0.055, 0.065, 0.14, 12), pos: [0, 1.49, 0], zone: 'head' });

  // CHEST — wider at top, tapered
  parts.push({ geo: new THREE.CylinderGeometry(0.17, 0.19, 0.38, 18), pos: [0, 1.22, 0], zone: 'chest' });

  // ABDOMEN
  parts.push({ geo: new THREE.CylinderGeometry(0.15, 0.16, 0.26, 18), pos: [0, 0.9, 0], zone: 'gut' });

  // PELVIS
  parts.push({ geo: new THREE.CylinderGeometry(0.16, 0.14, 0.18, 18), pos: [0, 0.68, 0], zone: 'gut' });

  // SHOULDERS
  parts.push({ geo: new THREE.SphereGeometry(0.075, 12, 8), pos: [-0.22, 1.35, 0], zone: 'arms' });
  parts.push({ geo: new THREE.SphereGeometry(0.075, 12, 8), pos: [0.22, 1.35, 0], zone: 'arms' });

  // LEFT ARM — upper
  parts.push({ geo: new THREE.CylinderGeometry(0.052, 0.058, 0.34, 12), pos: [-0.29, 1.1, 0], zone: 'arms' });
  // LEFT ELBOW
  parts.push({ geo: new THREE.SphereGeometry(0.055, 10, 8), pos: [-0.29, 0.91, 0], zone: 'arms' });
  // LEFT FOREARM
  parts.push({ geo: new THREE.CylinderGeometry(0.042, 0.05, 0.3, 12), pos: [-0.29, 0.74, 0], zone: 'arms' });
  // LEFT HAND
  parts.push({ geo: new THREE.BoxGeometry(0.08, 0.12, 0.04), pos: [-0.29, 0.56, 0], zone: 'arms' });

  // RIGHT ARM — upper
  parts.push({ geo: new THREE.CylinderGeometry(0.052, 0.058, 0.34, 12), pos: [0.29, 1.1, 0], zone: 'arms' });
  // RIGHT ELBOW
  parts.push({ geo: new THREE.SphereGeometry(0.055, 10, 8), pos: [0.29, 0.91, 0], zone: 'arms' });
  // RIGHT FOREARM
  parts.push({ geo: new THREE.CylinderGeometry(0.042, 0.05, 0.3, 12), pos: [0.29, 0.74, 0], zone: 'arms' });
  // RIGHT HAND
  parts.push({ geo: new THREE.BoxGeometry(0.08, 0.12, 0.04), pos: [0.29, 0.56, 0], zone: 'arms' });

  // LEFT UPPER LEG
  parts.push({ geo: new THREE.CylinderGeometry(0.082, 0.088, 0.44, 14), pos: [-0.1, 0.36, 0], zone: 'legs' });
  // LEFT KNEE
  parts.push({ geo: new THREE.SphereGeometry(0.075, 12, 8), pos: [-0.1, 0.08, 0], zone: 'legs' });
  // LEFT LOWER LEG
  parts.push({ geo: new THREE.CylinderGeometry(0.065, 0.072, 0.4, 14), pos: [-0.1, -0.14, 0], zone: 'legs' });
  // LEFT FOOT
  parts.push({ geo: new THREE.BoxGeometry(0.1, 0.07, 0.22), pos: [-0.1, -0.37, 0.05], zone: 'legs' });

  // RIGHT UPPER LEG
  parts.push({ geo: new THREE.CylinderGeometry(0.082, 0.088, 0.44, 14), pos: [0.1, 0.36, 0], zone: 'legs' });
  // RIGHT KNEE
  parts.push({ geo: new THREE.SphereGeometry(0.075, 12, 8), pos: [0.1, 0.08, 0], zone: 'legs' });
  // RIGHT LOWER LEG
  parts.push({ geo: new THREE.CylinderGeometry(0.065, 0.072, 0.4, 14), pos: [0.1, -0.14, 0], zone: 'legs' });
  // RIGHT FOOT
  parts.push({ geo: new THREE.BoxGeometry(0.1, 0.07, 0.22), pos: [0.1, -0.37, 0.05], zone: 'legs' });

  // HEART (small sphere inside chest)
  parts.push({ geo: new THREE.SphereGeometry(0.05, 8, 6), pos: [-0.08, 1.18, 0.08], zone: 'heart' });

  return parts;
}

// Zone colors for results state
const ZONE_COLORS: Record<string, string> = {
  head:   '#e8a020',
  chest:  '#40c0a0',
  heart:  '#e05020',
  gut:    '#e08030',
  arms:   '#60a0e0',
  legs:   '#8060d0',
  full:   '#d0b040',
};

// ── Floating particles ────────────────────────────────────────────────────────
const PARTICLE_COUNT = 55;
const particleData = Array.from({ length: PARTICLE_COUNT }, (_, i) => ({
  radius: 0.5 + Math.random() * 0.6,
  angle: (i / PARTICLE_COUNT) * Math.PI * 2,
  yBase: 0.05 + Math.random() * 1.55,
  yAmp: 0.06 + Math.random() * 0.1,
  yFreq: 0.3 + Math.random() * 0.7,
  yPhase: Math.random() * Math.PI * 2,
  orbitSpeed: (0.1 + Math.random() * 0.15) * (Math.random() > 0.5 ? 1 : -1),
  size: 0.007 + Math.random() * 0.01,
}));

function FloatingParticles({ scanState }: { scanState: ScanState }) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useRef(new THREE.Object3D());

  useFrame(() => {
    if (!meshRef.current) return;
    const t = Date.now() * 0.001;
    particleData.forEach((p, i) => {
      const angle = p.angle + t * p.orbitSpeed;
      const x = Math.cos(angle) * p.radius;
      const z = Math.sin(angle) * p.radius;
      const y = p.yBase + Math.sin(t * p.yFreq + p.yPhase) * p.yAmp;
      dummy.current.position.set(x, y, z);
      dummy.current.scale.setScalar(p.size * (1 + Math.sin(t * 1.5 + i) * 0.18));
      dummy.current.updateMatrix();
      meshRef.current!.setMatrixAt(i, dummy.current.matrix);
    });
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, PARTICLE_COUNT]}>
      <sphereGeometry args={[1, 4, 4]} />
      <meshBasicMaterial
        color={scanState === 'results' ? '#d4900a' : '#40e8d0'}
        transparent opacity={0.4} depthWrite={false}
      />
    </instancedMesh>
  );
}

// ── Body glow pulse ───────────────────────────────────────────────────────────
function BodyGlowPulse({ scanState }: { scanState: ScanState }) {
  const ref = useRef<THREE.Mesh>(null);
  useFrame(() => {
    if (!ref.current) return;
    const mat = ref.current.material as THREE.MeshBasicMaterial;
    const t = Date.now() * 0.001;
    if (scanState === 'idle') {
      mat.opacity = 0.022 + Math.sin(t * 0.55) * 0.012;
    } else if (scanState === 'scanning') {
      mat.opacity = 0.038 + Math.sin(t * 2.2) * 0.018;
    } else if (scanState === 'results') {
      mat.color.set('#d4900a');
      mat.opacity = 0.045 + Math.sin(t * 1.1) * 0.018;
    } else {
      mat.opacity = 0.028;
    }
  });
  return (
    <mesh ref={ref} position={[0, 0.8, 0]}>
      <cylinderGeometry args={[0.48, 0.38, 1.7, 16, 1, true]} />
      <meshBasicMaterial color="#40e8d0" transparent opacity={0.025} side={THREE.BackSide} depthWrite={false} />
    </mesh>
  );
}

// ── Scan beam ─────────────────────────────────────────────────────────────────
function ScanBeam({ scanProgress, visible }: { scanProgress: number; visible: boolean }) {
  const lineRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);
  useFrame(() => {
    if (!lineRef.current || !glowRef.current) return;
    const y = 1.62 - (scanProgress / 100) * 2.02;
    lineRef.current.position.y = y;
    glowRef.current.position.y = y;
  });
  if (!visible) return null;
  return (
    <group>
      <mesh ref={lineRef}>
        <planeGeometry args={[1.4, 0.01]} />
        <meshBasicMaterial color="#40e8d0" transparent opacity={0.95} side={THREE.DoubleSide} depthWrite={false} />
      </mesh>
      <mesh ref={glowRef}>
        <planeGeometry args={[1.4, 0.25]} />
        <meshBasicMaterial color="#40e8d0" transparent opacity={0.07} side={THREE.DoubleSide} depthWrite={false} />
      </mesh>
    </group>
  );
}

// ── Target rings ──────────────────────────────────────────────────────────────
function TargetRings({ visible }: { visible: boolean }) {
  const r1 = useRef<THREE.Mesh>(null);
  const r2 = useRef<THREE.Mesh>(null);
  useFrame((_, dt) => {
    if (r1.current) r1.current.rotation.z += dt * 1.0;
    if (r2.current) r2.current.rotation.z -= dt * 0.65;
  });
  if (!visible) return null;
  return (
    <group>
      <mesh ref={r1} position={[0, 1.62, 0]}>
        <torusGeometry args={[0.2, 0.006, 8, 32]} />
        <meshBasicMaterial color="#d4900a" transparent opacity={0.85} />
      </mesh>
      <mesh ref={r2} position={[0, 1.1, 0]}>
        <torusGeometry args={[0.28, 0.005, 8, 32]} />
        <meshBasicMaterial color="#40e8d0" transparent opacity={0.6} />
      </mesh>
      <mesh position={[0, 0.6, 0]}>
        <torusGeometry args={[0.24, 0.004, 8, 32]} />
        <meshBasicMaterial color="#d4900a" transparent opacity={0.4} />
      </mesh>
    </group>
  );
}

// ── Atmospheric scan lines ────────────────────────────────────────────────────
function ScanLines() {
  const ref = useRef<THREE.Group>(null);
  useFrame(() => {
    if (!ref.current) return;
    const t = Date.now() * 0.001;
    ref.current.children.forEach((child, i) => {
      const mat = (child as THREE.Mesh).material as THREE.MeshBasicMaterial;
      mat.opacity = 0.025 + Math.sin(t + i * 0.8) * 0.012;
    });
  });
  return (
    <group ref={ref}>
      {Array.from({ length: 10 }, (_, i) => (
        <mesh key={i} position={[(i - 4.5) * 0.3, 0.8, -0.8]}>
          <planeGeometry args={[0.003, 1.9]} />
          <meshBasicMaterial color="#40c060" transparent opacity={0.025} />
        </mesh>
      ))}
    </group>
  );
}

// ── Human figure ──────────────────────────────────────────────────────────────
function HumanFigure({ scanState, scanProgress, activeZones }: HumanScanner3DProps) {
  const groupRef = useRef<THREE.Group>(null);
  const parts = useMemo(() => buildHuman(), []);

  // Shared materials
  const solidMat = useMemo(() => new THREE.MeshBasicMaterial({
    color: '#030a07', transparent: true, opacity: 0.82,
  }), []);
  const wireMat = useMemo(() => new THREE.MeshBasicMaterial({
    color: '#40c8b0', wireframe: true, transparent: true, opacity: 0.6,
  }), []);

  useFrame((_, dt) => {
    if (!groupRef.current) return;

    // Always rotate
    const speed = scanState === 'idle' ? 0.22 : scanState === 'scanning' ? 0.32 : 0.18;
    groupRef.current.rotation.y += dt * speed;

    // Update wireframe color
    const t = Date.now() * 0.001;
    const beamY = 1.62 - (scanProgress / 100) * 2.02;
    const isScanning = scanState === 'scanning';

    if (scanState === 'idle') {
      wireMat.color.set('#40c8b0');
      wireMat.opacity = 0.5 + Math.sin(t * 0.8) * 0.08;
    } else if (isScanning) {
      wireMat.color.set('#40e8d0');
      wireMat.opacity = 0.55;
    } else if (scanState === 'analysis') {
      wireMat.color.set('#d4900a');
      wireMat.opacity = 0.55;
    } else if (scanState === 'results') {
      wireMat.color.set('#40e8d0');
      wireMat.opacity = 0.6;
    }
  });

  return (
    <group ref={groupRef}>
      {parts.map((part, i) => (
        <group key={i} position={part.pos} rotation={part.rot}>
          {/* Solid fill — occludes what's behind */}
          <mesh geometry={part.geo} material={solidMat} renderOrder={0} />
          {/* Wireframe overlay */}
          <mesh geometry={part.geo} material={wireMat} renderOrder={1} />
        </group>
      ))}
    </group>
  );
}

// ── Main scene ────────────────────────────────────────────────────────────────
function Scene(props: HumanScanner3DProps) {
  const { scanState, scanProgress } = props;

  return (
    <>
      <color attach="background" args={['#0a0908']} />
      <ambientLight intensity={0.06} />
      <pointLight position={[0, 1.5, 2]} intensity={0.5} color="#40c8b0" />
      <pointLight position={[0, 0.5, -1.5]} intensity={0.1} color="#604020" />
      <pointLight position={[0, 3, 0]} intensity={0.12} color="#40e8d0" />

      <ScanLines />

      {scanState !== 'idle' && (
        <gridHelper args={[3, 20, '#1a2a1a', '#0d180d']} position={[0, 0, 0]} />
      )}

      <FloatingParticles scanState={scanState} />
      <BodyGlowPulse scanState={scanState} />
      <HumanFigure {...props} />
      <ScanBeam scanProgress={scanProgress} visible={scanState === 'scanning'} />
      <TargetRings visible={scanState === 'analysis'} />

      <OrbitControls enableZoom={false} enablePan={false}
        minPolarAngle={Math.PI / 4} maxPolarAngle={Math.PI * 0.75} />
    </>
  );
}

// ── Export ────────────────────────────────────────────────────────────────────
export function HumanScanner3D(props: HumanScanner3DProps) {
  return (
    <Canvas
      camera={{ position: [0, 0.72, 3.0], fov: 46 }}
      style={{ width: '100%', height: '100%', background: '#0a0908' }}
      gl={{ antialias: true, alpha: false }}
    >
      <Scene {...props} />
    </Canvas>
  );
}
