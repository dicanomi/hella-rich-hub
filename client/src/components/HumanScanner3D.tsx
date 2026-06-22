/**
 * HumanScanner3D — React Three Fiber 3D scanner chamber
 *
 * Uses Xbot.glb (clean neutral human mesh, no armor/clothes)
 * rendered as a cyan wireframe overlay on a dark solid fill.
 *
 * Scan states: idle (slow rotation) → scanning (beam sweep) → analysis (rings) → results (zone glow)
 * Body ALWAYS rotates — never static.
 */
import { useRef, useEffect, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { useGLTF, OrbitControls } from '@react-three/drei';
import * as THREE from 'three';

type ScanState = 'idle' | 'powering' | 'scanning' | 'analysis' | 'results';

interface HumanScanner3DProps {
  scanState: ScanState;
  scanProgress: number; // 0–100
  activeZones: string[];
}

const MODEL_URL = '/human_body.glb';

// ── Scan beam ─────────────────────────────────────────────────────────────────
function ScanBeam({ scanProgress, visible }: { scanProgress: number; visible: boolean }) {
  const lineRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);

  useFrame(() => {
    if (!lineRef.current || !glowRef.current) return;
    const y = 1.8 - (scanProgress / 100) * 1.8;
    lineRef.current.position.y = y;
    glowRef.current.position.y = y;
  });

  if (!visible) return null;

  return (
    <group>
      <mesh ref={lineRef}>
        <planeGeometry args={[1.6, 0.012]} />
        <meshBasicMaterial color="#40e8d0" transparent opacity={0.95} side={THREE.DoubleSide} depthWrite={false} />
      </mesh>
      <mesh ref={glowRef}>
        <planeGeometry args={[1.6, 0.28]} />
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
    if (r1.current) r1.current.rotation.z += dt * 1.1;
    if (r2.current) r2.current.rotation.z -= dt * 0.7;
  });

  if (!visible) return null;

  return (
    <group>
      <mesh ref={r1} position={[0, 1.65, 0]}>
        <torusGeometry args={[0.2, 0.006, 8, 32]} />
        <meshBasicMaterial color="#d4900a" transparent opacity={0.85} />
      </mesh>
      <mesh ref={r2} position={[0, 1.1, 0]}>
        <torusGeometry args={[0.3, 0.005, 8, 32]} />
        <meshBasicMaterial color="#40e8d0" transparent opacity={0.6} />
      </mesh>
      <mesh position={[0, 0.65, 0]}>
        <torusGeometry args={[0.25, 0.004, 8, 32]} />
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
      mat.opacity = 0.03 + Math.sin(t + i * 0.8) * 0.015;
    });
  });
  return (
    <group ref={ref}>
      {Array.from({ length: 10 }, (_, i) => (
        <mesh key={i} position={[(i - 4.5) * 0.32, 0.9, -0.85]}>
          <planeGeometry args={[0.004, 2.0]} />
          <meshBasicMaterial color="#40c060" transparent opacity={0.04} />
        </mesh>
      ))}
    </group>
  );
}

// ── Human model ───────────────────────────────────────────────────────────────
function HumanModel({ scanState, scanProgress, activeZones }: HumanScanner3DProps) {
  const groupRef = useRef<THREE.Group>(null);
  const { scene } = useGLTF(MODEL_URL);

  // Materials refs for dynamic updates
  const wireMatRef = useRef<THREE.MeshBasicMaterial>(
    new THREE.MeshBasicMaterial({ color: '#40c8b0', wireframe: true, transparent: true, opacity: 0.55 })
  );
  // Solid fill: very dark, just enough to occlude what's behind
  const solidMatRef = useRef<THREE.MeshBasicMaterial>(
    new THREE.MeshBasicMaterial({ color: '#040c0a', transparent: true, opacity: 0.75 })
  );

  // Apply materials and scale once scene is available
  useEffect(() => {
    if (!scene) return;

    // Compute bounding box
    const box = new THREE.Box3().setFromObject(scene);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());

    // Scale to 1.5 units tall — fits portrait canvas with head room
    const scale = 1.5 / size.y;
    scene.scale.setScalar(scale);
    scene.position.x = -center.x * scale;
    scene.position.y = -box.min.y * scale;
    scene.position.z = -center.z * scale;

    // Collect all meshes first (avoid traverse mutation loop)
    const meshes: THREE.Mesh[] = [];
    scene.traverse((child) => {
      if (child instanceof THREE.Mesh) meshes.push(child);
    });

    // Now apply materials and add wireframes
    meshes.forEach(child => {
      child.material = solidMatRef.current;
      child.renderOrder = 0;
      const wire = new THREE.Mesh(child.geometry, wireMatRef.current);
      wire.renderOrder = 1;
      child.add(wire);
    });
  }, [scene]);

  // Animation loop
  useFrame((_, dt) => {
    if (!groupRef.current) return;

    // Always rotate — never static
    const speed = scanState === 'idle' ? 0.25
      : scanState === 'scanning' ? 0.35
      : scanState === 'analysis' ? 0.3
      : 0.2;
    groupRef.current.rotation.y += dt * speed;

    // Update wireframe color based on state
    const isScanning = scanState === 'scanning';
    const beamY = 1.7 - (scanProgress / 100) * 1.7;

    if (isScanning) {
      wireMatRef.current.color.set('#40c8b0');
      wireMatRef.current.opacity = 0.4;
    } else if (scanState === 'analysis') {
      wireMatRef.current.color.set('#d4900a');
      wireMatRef.current.opacity = 0.5;
    } else if (scanState === 'results') {
      wireMatRef.current.color.set('#40e8d0');
      wireMatRef.current.opacity = 0.55;
    } else {
      // idle / powering — cyan wireframe, subtle pulse
      wireMatRef.current.color.set('#40c8b0');
      wireMatRef.current.opacity = 0.38 + Math.sin(Date.now() * 0.001) * 0.06;
    }
  });

  return (
    <group ref={groupRef}>
      <primitive object={scene} />
    </group>
  );
}

// ── Loading fallback ──────────────────────────────────────────────────────────
function LoadingFallback() {
  const ref = useRef<THREE.Mesh>(null);
  useFrame((_, dt) => { if (ref.current) ref.current.rotation.y += dt * 1.5; });
  return (
    <mesh ref={ref} position={[0, 0.85, 0]}>
      <torusGeometry args={[0.25, 0.015, 8, 32]} />
      <meshBasicMaterial color="#40c8b0" transparent opacity={0.5} />
    </mesh>
  );
}

// ── Floating particles ────────────────────────────────────────────────────────────────
const PARTICLE_COUNT = 60;

// Pre-compute particle data (stable across renders)
const particleData = Array.from({ length: PARTICLE_COUNT }, (_, i) => ({
  // Orbit radius and angle
  radius: 0.55 + Math.random() * 0.65,
  angle: (i / PARTICLE_COUNT) * Math.PI * 2,
  yBase: 0.1 + Math.random() * 1.6,
  yAmp: 0.08 + Math.random() * 0.12,
  yFreq: 0.4 + Math.random() * 0.8,
  yPhase: Math.random() * Math.PI * 2,
  orbitSpeed: (0.12 + Math.random() * 0.18) * (Math.random() > 0.5 ? 1 : -1),
  size: 0.008 + Math.random() * 0.012,
  brightness: 0.3 + Math.random() * 0.5,
}));

function FloatingParticles({ scanState }: { scanState: ScanState }) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useRef(new THREE.Object3D());

  const isActive = scanState !== 'idle';
  const baseOpacity = scanState === 'idle' ? 0.35 : 0.6;

  useFrame(() => {
    if (!meshRef.current) return;
    const t = Date.now() * 0.001;

    particleData.forEach((p, i) => {
      const angle = p.angle + t * p.orbitSpeed;
      const x = Math.cos(angle) * p.radius;
      const z = Math.sin(angle) * p.radius;
      const y = p.yBase + Math.sin(t * p.yFreq + p.yPhase) * p.yAmp;

      dummy.current.position.set(x, y, z);
      dummy.current.scale.setScalar(p.size * (1 + Math.sin(t * 1.5 + i) * 0.2));
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
        transparent
        opacity={baseOpacity}
        depthWrite={false}
      />
    </instancedMesh>
  );
}

// ── Body glow pulse ────────────────────────────────────────────────────────────────
function BodyGlowPulse({ scanState }: { scanState: ScanState }) {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame(() => {
    if (!meshRef.current) return;
    const mat = meshRef.current.material as THREE.MeshBasicMaterial;
    const t = Date.now() * 0.001;

    if (scanState === 'idle') {
      // Slow ambient pulse
      mat.opacity = 0.025 + Math.sin(t * 0.6) * 0.015;
    } else if (scanState === 'scanning') {
      // Faster pulse during scan
      mat.opacity = 0.04 + Math.sin(t * 2.5) * 0.02;
    } else if (scanState === 'results') {
      // Warm amber glow on results
      mat.color.set('#d4900a');
      mat.opacity = 0.05 + Math.sin(t * 1.2) * 0.02;
    } else {
      mat.opacity = 0.03;
    }
  });

  return (
    <mesh ref={meshRef} position={[0, 0.85, 0]}>
      <cylinderGeometry args={[0.5, 0.4, 1.8, 16, 1, true]} />
      <meshBasicMaterial
        color="#40e8d0"
        transparent
        opacity={0.03}
        side={THREE.BackSide}
        depthWrite={false}
      />
    </mesh>
  );
}

// ── Main scene ────────────────────────────────────────────────────────────────
function Scene(props: HumanScanner3DProps) {
  const { scanState, scanProgress } = props;

  return (
    <>
      <color attach="background" args={['#0a0908']} />
      <ambientLight intensity={0.08} />
      {/* Key light — front cyan tint */}
      <pointLight position={[0, 1.5, 2]} intensity={0.4} color="#40c8b0" />
      {/* Fill light — back warm */}
      <pointLight position={[0, 0.5, -1.5]} intensity={0.12} color="#604020" />
      {/* Top rim light */}
      <pointLight position={[0, 3, 0]} intensity={0.15} color="#40e8d0" />

      <ScanLines />

      {/* Grid floor when active */}
      {scanState !== 'idle' && (
        <gridHelper args={[3, 20, '#1a2a1a', '#0d180d']} position={[0, 0, 0]} />
      )}

      <FloatingParticles scanState={scanState} />
      <BodyGlowPulse scanState={scanState} />

      <Suspense fallback={<LoadingFallback />}>
        <HumanModel {...props} />
      </Suspense>

      <ScanBeam scanProgress={scanProgress} visible={scanState === 'scanning'} />
      <TargetRings visible={scanState === 'analysis'} />

      <OrbitControls
        enableZoom={false}
        enablePan={false}
        minPolarAngle={Math.PI / 4}
        maxPolarAngle={Math.PI * 0.75}
      />
    </>
  );
}

// ── Export ────────────────────────────────────────────────────────────────────
export function HumanScanner3D(props: HumanScanner3DProps) {
  return (
    <Canvas
      camera={{ position: [0, 0.75, 2.8], fov: 50 }}
      style={{ width: '100%', height: '100%', background: '#0a0908' }}
      gl={{ antialias: true, alpha: false }}
    >
      <Scene {...props} />
    </Canvas>
  );
}

useGLTF.preload(MODEL_URL);
