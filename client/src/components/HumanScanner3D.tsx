/**
 * HumanScanner3D — React Three Fiber 3D scanner chamber
 *
 * Procedural human figure built from Three.js geometry:
 * - Head (sphere)
 * - Neck (cylinder)
 * - Torso (box + shoulders)
 * - Arms (upper + lower cylinders)
 * - Pelvis (box)
 * - Legs (upper + lower cylinders)
 *
 * Scan states:
 * - idle: dim wireframe, slow rotation
 * - scanning: bright wireframe + animated scan beam sweeping top→bottom
 * - analysis: target rings lock onto body zones
 * - results: thermal color zones light up per metric
 */
import { useRef, useMemo, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Environment } from '@react-three/drei';
import * as THREE from 'three';

type ScanState = 'idle' | 'powering' | 'scanning' | 'analysis' | 'results';

interface HumanScanner3DProps {
  scanState: ScanState;
  scanProgress: number; // 0–100
  activeZones: string[];
}

// ── Colour palette ──────────────────────────────────────────────────────────
const C = {
  wireframe:    new THREE.Color('#2a6040'),
  wireActive:   new THREE.Color('#40c060'),
  scanBeam:     new THREE.Color('#40e8d0'),
  amber:        new THREE.Color('#d4900a'),
  head:         new THREE.Color('#e8a020'),
  chest:        new THREE.Color('#40c0a0'),
  heart:        new THREE.Color('#e05020'),
  gut:          new THREE.Color('#e08030'),
  arms:         new THREE.Color('#60a0e0'),
  legs:         new THREE.Color('#8060d0'),
  full:         new THREE.Color('#d0b040'),
  bg:           new THREE.Color('#0a0908'),
};

// ── Procedural human body parts ────────────────────────────────────────────
interface BodyPart {
  geometry: THREE.BufferGeometry;
  position: [number, number, number];
  rotation?: [number, number, number];
  zone: string;
  name: string;
}

function buildBodyParts(): BodyPart[] {
  return [
    // Head
    { geometry: new THREE.SphereGeometry(0.22, 16, 12), position: [0, 1.72, 0], zone: 'head', name: 'head' },
    // Neck
    { geometry: new THREE.CylinderGeometry(0.08, 0.1, 0.18, 10), position: [0, 1.44, 0], zone: 'head', name: 'neck' },
    // Upper torso
    { geometry: new THREE.BoxGeometry(0.55, 0.45, 0.22), position: [0, 1.12, 0], zone: 'chest', name: 'upper-torso' },
    // Lower torso
    { geometry: new THREE.BoxGeometry(0.48, 0.38, 0.20), position: [0, 0.72, 0], zone: 'gut', name: 'lower-torso' },
    // Pelvis
    { geometry: new THREE.BoxGeometry(0.44, 0.22, 0.20), position: [0, 0.44, 0], zone: 'gut', name: 'pelvis' },
    // Left shoulder
    { geometry: new THREE.SphereGeometry(0.1, 10, 8), position: [-0.34, 1.22, 0], zone: 'arms', name: 'l-shoulder' },
    // Right shoulder
    { geometry: new THREE.SphereGeometry(0.1, 10, 8), position: [0.34, 1.22, 0], zone: 'arms', name: 'r-shoulder' },
    // Left upper arm
    { geometry: new THREE.CylinderGeometry(0.075, 0.065, 0.38, 10), position: [-0.42, 0.95, 0], zone: 'arms', name: 'l-upper-arm' },
    // Right upper arm
    { geometry: new THREE.CylinderGeometry(0.075, 0.065, 0.38, 10), position: [0.42, 0.95, 0], zone: 'arms', name: 'r-upper-arm' },
    // Left elbow
    { geometry: new THREE.SphereGeometry(0.065, 8, 6), position: [-0.42, 0.74, 0], zone: 'arms', name: 'l-elbow' },
    // Right elbow
    { geometry: new THREE.SphereGeometry(0.065, 8, 6), position: [0.42, 0.74, 0], zone: 'arms', name: 'r-elbow' },
    // Left forearm
    { geometry: new THREE.CylinderGeometry(0.06, 0.05, 0.36, 10), position: [-0.42, 0.54, 0], zone: 'arms', name: 'l-forearm' },
    // Right forearm
    { geometry: new THREE.CylinderGeometry(0.06, 0.05, 0.36, 10), position: [0.42, 0.54, 0], zone: 'arms', name: 'r-forearm' },
    // Left hand
    { geometry: new THREE.BoxGeometry(0.09, 0.12, 0.04), position: [-0.42, 0.3, 0], zone: 'arms', name: 'l-hand' },
    // Right hand
    { geometry: new THREE.BoxGeometry(0.09, 0.12, 0.04), position: [0.42, 0.3, 0], zone: 'arms', name: 'r-hand' },
    // Left hip
    { geometry: new THREE.SphereGeometry(0.1, 10, 8), position: [-0.18, 0.32, 0], zone: 'gut', name: 'l-hip' },
    // Right hip
    { geometry: new THREE.SphereGeometry(0.1, 10, 8), position: [0.18, 0.32, 0], zone: 'gut', name: 'r-hip' },
    // Left upper leg
    { geometry: new THREE.CylinderGeometry(0.1, 0.085, 0.48, 12), position: [-0.18, -0.02, 0], zone: 'legs', name: 'l-upper-leg' },
    // Right upper leg
    { geometry: new THREE.CylinderGeometry(0.1, 0.085, 0.48, 12), position: [0.18, -0.02, 0], zone: 'legs', name: 'r-upper-leg' },
    // Left knee
    { geometry: new THREE.SphereGeometry(0.085, 10, 8), position: [-0.18, -0.28, 0], zone: 'legs', name: 'l-knee' },
    // Right knee
    { geometry: new THREE.SphereGeometry(0.085, 10, 8), position: [0.18, -0.28, 0], zone: 'legs', name: 'r-knee' },
    // Left lower leg
    { geometry: new THREE.CylinderGeometry(0.075, 0.06, 0.46, 12), position: [-0.18, -0.54, 0], zone: 'legs', name: 'l-lower-leg' },
    // Right lower leg
    { geometry: new THREE.CylinderGeometry(0.075, 0.06, 0.46, 12), position: [0.18, -0.54, 0], zone: 'legs', name: 'r-lower-leg' },
    // Left foot
    { geometry: new THREE.BoxGeometry(0.1, 0.07, 0.2), position: [-0.18, -0.8, 0.04], zone: 'legs', name: 'l-foot' },
    // Right foot
    { geometry: new THREE.BoxGeometry(0.1, 0.07, 0.2), position: [0.18, -0.8, 0.04], zone: 'legs', name: 'r-foot' },
    // Heart (small sphere inside chest)
    { geometry: new THREE.SphereGeometry(0.07, 8, 6), position: [-0.1, 1.1, 0.06], zone: 'heart', name: 'heart' },
  ];
}

// ── Body part mesh ──────────────────────────────────────────────────────────
function BodyPartMesh({
  part, scanState, scanProgress, activeZones,
}: {
  part: BodyPart;
  scanState: ScanState;
  scanProgress: number;
  activeZones: string[];
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const wireRef = useRef<THREE.Mesh>(null);

  const isActive = activeZones.includes(part.zone) || activeZones.includes('full');
  const isScanning = scanState === 'scanning' || scanState === 'analysis';

  // Part Y position in world space (approx)
  const partY = part.position[1];
  // Scan beam Y: goes from top (~1.9) to bottom (~-0.9), range 2.8
  const scanBeamY = 1.9 - (scanProgress / 100) * 2.8;
  const distFromBeam = Math.abs(partY - scanBeamY);
  const beamProximity = Math.max(0, 1 - distFromBeam / 0.35);

  // Zone color
  const zoneColor = isActive
    ? (C[part.zone as keyof typeof C] as THREE.Color || C.wireActive)
    : (isScanning ? C.wireActive : C.wireframe);

  useFrame((_, delta) => {
    if (!meshRef.current) return;
    // Pulse active zones
    if (isActive && scanState === 'results') {
      const t = Date.now() * 0.002;
      const pulse = 0.7 + Math.sin(t + part.position[0] * 3) * 0.3;
      (meshRef.current.material as THREE.MeshBasicMaterial).opacity = pulse * 0.35;
    }
  });

  const opacity = scanState === 'idle' ? 0.08
    : beamProximity > 0.1 ? 0.5 + beamProximity * 0.4
    : isActive ? 0.35
    : 0.12;

  const color = beamProximity > 0.1 ? C.scanBeam
    : isActive ? zoneColor
    : isScanning ? C.wireframe
    : C.wireframe;

  return (
    <group position={part.position} rotation={part.rotation}>
      {/* Solid fill — very subtle */}
      <mesh ref={meshRef} geometry={part.geometry}>
        <meshBasicMaterial
          color={color}
          transparent
          opacity={opacity * 0.4}
          depthWrite={false}
        />
      </mesh>
      {/* Wireframe */}
      <mesh ref={wireRef} geometry={part.geometry}>
        <meshBasicMaterial
          color={beamProximity > 0.1 ? C.scanBeam : isActive ? zoneColor : isScanning ? C.wireActive : C.wireframe}
          wireframe
          transparent
          opacity={
            scanState === 'idle' ? 0.18
            : beamProximity > 0.1 ? 0.9
            : isActive ? 0.65
            : 0.25
          }
        />
      </mesh>
    </group>
  );
}

// ── Scan beam plane ─────────────────────────────────────────────────────────
function ScanBeam({ scanProgress, visible }: { scanProgress: number; visible: boolean }) {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame(() => {
    if (!meshRef.current) return;
    const y = 1.9 - (scanProgress / 100) * 2.8;
    meshRef.current.position.y = y;
  });

  if (!visible) return null;

  return (
    <mesh ref={meshRef} position={[0, 1.9, 0]}>
      <planeGeometry args={[1.4, 0.04]} />
      <meshBasicMaterial
        color={C.scanBeam}
        transparent
        opacity={0.85}
        side={THREE.DoubleSide}
        depthWrite={false}
      />
    </mesh>
  );
}

// ── Scan beam glow ──────────────────────────────────────────────────────────
function ScanBeamGlow({ scanProgress, visible }: { scanProgress: number; visible: boolean }) {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame(() => {
    if (!meshRef.current) return;
    const y = 1.9 - (scanProgress / 100) * 2.8;
    meshRef.current.position.y = y;
  });

  if (!visible) return null;

  return (
    <mesh ref={meshRef} position={[0, 1.9, 0]}>
      <planeGeometry args={[1.4, 0.25]} />
      <meshBasicMaterial
        color={C.scanBeam}
        transparent
        opacity={0.12}
        side={THREE.DoubleSide}
        depthWrite={false}
      />
    </mesh>
  );
}

// ── Target rings (analysis state) ───────────────────────────────────────────
function TargetRings({ visible }: { visible: boolean }) {
  const ringRef1 = useRef<THREE.Mesh>(null);
  const ringRef2 = useRef<THREE.Mesh>(null);

  useFrame((_, delta) => {
    if (ringRef1.current) ringRef1.current.rotation.z += delta * 0.8;
    if (ringRef2.current) ringRef2.current.rotation.z -= delta * 0.5;
  });

  if (!visible) return null;

  return (
    <group>
      {/* Head ring */}
      <mesh ref={ringRef1} position={[0, 1.72, 0]}>
        <torusGeometry args={[0.32, 0.008, 8, 32]} />
        <meshBasicMaterial color={C.amber} transparent opacity={0.7} />
      </mesh>
      {/* Chest ring */}
      <mesh ref={ringRef2} position={[0, 1.05, 0]}>
        <torusGeometry args={[0.42, 0.006, 8, 32]} />
        <meshBasicMaterial color={C.scanBeam} transparent opacity={0.5} />
      </mesh>
      {/* Gut ring */}
      <mesh position={[0, 0.6, 0]}>
        <torusGeometry args={[0.36, 0.005, 8, 32]} />
        <meshBasicMaterial color={C.amber} transparent opacity={0.4} />
      </mesh>
    </group>
  );
}

// ── Grid floor ──────────────────────────────────────────────────────────────
function GridFloor({ visible }: { visible: boolean }) {
  if (!visible) return null;
  return (
    <gridHelper
      args={[3, 20, '#1a2a1a', '#0d180d']}
      position={[0, -0.88, 0]}
    />
  );
}

// ── Vertical scan lines (background atmosphere) ─────────────────────────────
function ScanLines() {
  const linesRef = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    if (linesRef.current) {
      linesRef.current.children.forEach((child, i) => {
        const mesh = child as THREE.Mesh;
        const mat = mesh.material as THREE.MeshBasicMaterial;
        mat.opacity = 0.04 + Math.sin(Date.now() * 0.001 + i * 0.7) * 0.02;
      });
    }
  });

  return (
    <group ref={linesRef}>
      {Array.from({ length: 8 }, (_, i) => (
        <mesh key={i} position={[(i - 3.5) * 0.4, 0.5, -0.8]}>
          <planeGeometry args={[0.005, 3.5]} />
          <meshBasicMaterial color="#40c060" transparent opacity={0.05} />
        </mesh>
      ))}
    </group>
  );
}

// ── Main 3D scene ────────────────────────────────────────────────────────────
function HumanScene({
  scanState, scanProgress, activeZones,
}: {
  scanState: ScanState;
  scanProgress: number;
  activeZones: string[];
}) {
  const groupRef = useRef<THREE.Group>(null);
  const bodyParts = useMemo(() => buildBodyParts(), []);

  useFrame((_, delta) => {
    if (!groupRef.current) return;
    // Idle: slow auto-rotation
    if (scanState === 'idle') {
      groupRef.current.rotation.y += delta * 0.3;
    }
    // Scanning: slight wobble
    if (scanState === 'scanning') {
      groupRef.current.rotation.y = Math.sin(Date.now() * 0.0005) * 0.15;
    }
    // Analysis: face forward
    if (scanState === 'analysis' || scanState === 'results') {
      groupRef.current.rotation.y *= 0.95;
    }
  });

  const isScanning = scanState === 'scanning';
  const isAnalysis = scanState === 'analysis';

  return (
    <>
      <color attach="background" args={['#0a0908']} />
      <ambientLight intensity={0.1} />
      <pointLight position={[0, 3, 2]} intensity={0.3} color="#40c060" />
      <pointLight position={[0, 0, 2]} intensity={0.2} color="#40b8c0" />

      <ScanLines />
      <GridFloor visible={scanState !== 'idle'} />

      <group ref={groupRef} position={[0, -0.4, 0]}>
        {bodyParts.map(part => (
          <BodyPartMesh
            key={part.name}
            part={part}
            scanState={scanState}
            scanProgress={scanProgress}
            activeZones={activeZones}
          />
        ))}
      </group>

      <ScanBeam scanProgress={scanProgress} visible={isScanning} />
      <ScanBeamGlow scanProgress={scanProgress} visible={isScanning} />
      <TargetRings visible={isAnalysis} />

      <OrbitControls
        enableZoom={false}
        enablePan={false}
        minPolarAngle={Math.PI / 4}
        maxPolarAngle={Math.PI * 0.75}
        autoRotate={false}
      />
    </>
  );
}

// ── Exported component ───────────────────────────────────────────────────────
export function HumanScanner3D({ scanState, scanProgress, activeZones }: HumanScanner3DProps) {
  return (
    <Canvas
      camera={{ position: [0, 0.5, 2.8], fov: 45 }}
      style={{ width: '100%', height: '100%', background: '#0a0908' }}
      gl={{ antialias: true, alpha: false }}
    >
      <HumanScene
        scanState={scanState}
        scanProgress={scanProgress}
        activeZones={activeZones}
      />
    </Canvas>
  );
}
