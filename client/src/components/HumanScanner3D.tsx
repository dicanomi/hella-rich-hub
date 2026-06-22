/**
 * HumanScanner3D — React Three Fiber scanner chamber
 *
 * Image-plane approach: SVG wireframes on flat planes in 3D space.
 * Human and alien SVGs loaded as textures, displayed on rotating planes.
 * Terminal green only: #33ff33
 * No GLB, no complex geometry — clean and reliable.
 */
import { useRef, useMemo, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { useTexture, OrbitControls } from '@react-three/drei';
import * as THREE from 'three';

export type ScanState = 'idle' | 'powering' | 'scanning' | 'analysis' | 'results'
  | 'anomaly' | 'glitch' | 'morphing' | 'alien' | 'emergency' | 'final' | 'empty';

interface HumanScanner3DProps {
  scanState: ScanState;
  scanProgress: number;
  activeZones: string[];
  morphProgress?: number;
}

const GREEN = '#33ff33';
const GREEN_DIM = '#1a8c1a';

// ── Floating particles ────────────────────────────────────────────────────────
const PARTICLE_COUNT = 40;
const particleData = Array.from({ length: PARTICLE_COUNT }, (_, i) => ({
  radius: 0.4 + Math.random() * 0.7,
  angle: (i / PARTICLE_COUNT) * Math.PI * 2,
  yBase: 0.05 + Math.random() * 1.7,
  yAmp: 0.05 + Math.random() * 0.1,
  yFreq: 0.3 + Math.random() * 0.7,
  yPhase: Math.random() * Math.PI * 2,
  orbitSpeed: (0.08 + Math.random() * 0.14) * (Math.random() > 0.5 ? 1 : -1),
  size: 0.006 + Math.random() * 0.009,
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
      dummy.current.scale.setScalar(p.size * (1 + Math.sin(t * 1.5 + i) * 0.2));
      dummy.current.updateMatrix();
      meshRef.current!.setMatrixAt(i, dummy.current.matrix);
    });
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  const isAlien = ['alien', 'emergency', 'final'].includes(scanState);

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, PARTICLE_COUNT]}>
      <sphereGeometry args={[1, 4, 4]} />
      <meshBasicMaterial
        color={GREEN}
        transparent
        opacity={isAlien ? 0.25 : 0.35}
        depthWrite={false}
      />
    </instancedMesh>
  );
}

// ── Scan beam ─────────────────────────────────────────────────────────────────
function ScanBeam({ scanProgress, visible }: { scanProgress: number; visible: boolean }) {
  const lineRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);
  useFrame(() => {
    if (!lineRef.current || !glowRef.current) return;
    const y = 1.72 - (scanProgress / 100) * 1.9;
    lineRef.current.position.y = y;
    glowRef.current.position.y = y;
  });
  if (!visible) return null;
  return (
    <group>
      <mesh ref={lineRef}>
        <planeGeometry args={[0.9, 0.008]} />
        <meshBasicMaterial color={GREEN} transparent opacity={0.9} side={THREE.DoubleSide} depthWrite={false} />
      </mesh>
      <mesh ref={glowRef}>
        <planeGeometry args={[0.9, 0.2]} />
        <meshBasicMaterial color={GREEN} transparent opacity={0.06} side={THREE.DoubleSide} depthWrite={false} />
      </mesh>
    </group>
  );
}

// ── Target rings ──────────────────────────────────────────────────────────────
function TargetRings({ visible }: { visible: boolean }) {
  const r1 = useRef<THREE.Mesh>(null);
  const r2 = useRef<THREE.Mesh>(null);
  useFrame((_, dt) => {
    if (r1.current) r1.current.rotation.z += dt * 1.2;
    if (r2.current) r2.current.rotation.z -= dt * 0.8;
  });
  if (!visible) return null;
  return (
    <group>
      <mesh ref={r1} position={[0, 1.62, 0]}>
        <torusGeometry args={[0.18, 0.005, 6, 24]} />
        <meshBasicMaterial color={GREEN} transparent opacity={0.8} />
      </mesh>
      <mesh ref={r2} position={[0, 0.9, 0]}>
        <torusGeometry args={[0.24, 0.004, 6, 24]} />
        <meshBasicMaterial color={GREEN} transparent opacity={0.5} />
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
      mat.opacity = 0.02 + Math.sin(t + i * 0.9) * 0.01;
    });
  });
  return (
    <group ref={ref}>
      {Array.from({ length: 8 }, (_, i) => (
        <mesh key={i} position={[(i - 3.5) * 0.28, 0.9, -0.7]}>
          <planeGeometry args={[0.003, 1.9]} />
          <meshBasicMaterial color={GREEN} transparent opacity={0.02} />
        </mesh>
      ))}
    </group>
  );
}

// ── Image plane figure ────────────────────────────────────────────────────────
function FigurePlane({
  texturePath, scanState, morphProgress = 0, isAlien = false,
}: {
  texturePath: string;
  scanState: ScanState;
  morphProgress?: number;
  isAlien?: boolean;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const texture = useTexture(texturePath);
  const mat = useMemo(() => new THREE.MeshBasicMaterial({
    map: texture,
    transparent: true,
    opacity: isAlien ? 0 : 0.9,
    side: THREE.DoubleSide,
    depthWrite: false,
  }), [texture, isAlien]);

  useFrame((_, dt) => {
    if (!groupRef.current) return;

    // Always rotate
    const speed = scanState === 'idle' ? 0.22 : scanState === 'scanning' ? 0.3 : 0.18;
    groupRef.current.rotation.y += dt * speed;

    // Opacity based on morph and state
    if (isAlien) {
      // Alien fades in as morph progresses past 0.5
      const vis = Math.max(0, morphProgress * 2 - 1);
      mat.opacity = vis * 0.9;
      // Glitch flicker during emergency
      if (scanState === 'emergency') {
        mat.opacity = vis * (0.6 + Math.sin(Date.now() * 0.01) * 0.3);
      }
    } else {
      // Human fades out as morph progresses
      const fade = Math.max(0, 1 - morphProgress * 2);
      if (scanState === 'glitch') {
        // Rapid flicker
        mat.opacity = Math.random() > 0.4 ? fade * 0.9 : fade * 0.2;
      } else {
        mat.opacity = fade * 0.9;
      }
    }
  });

  // SVG viewBox 200x480, ratio 0.417
  // Height 1.4 units, width 0.58. Center at y=0.7 (feet ~0, head ~1.4)
  return (
    <group ref={groupRef} position={[0, 0, 0]}>
      <mesh material={mat} position={[0, 0.7, 0]}>
        <planeGeometry args={[0.58, 1.4]} />
      </mesh>
    </group>
  );
}

// ── Main scene ────────────────────────────────────────────────────────────────
function Scene(props: HumanScanner3DProps) {
  const { scanState, scanProgress, morphProgress = 0 } = props;
  const isReveal = ['morphing', 'alien', 'emergency', 'final'].includes(scanState);

  return (
    <>
      <color attach="background" args={['#020a02']} />
      <ambientLight intensity={0.1} />
      <pointLight position={[0, 1.5, 1.5]} intensity={0.3} color={GREEN} />

      <ScanLines />

      {scanState !== 'idle' && (
        <gridHelper args={[2.5, 16, GREEN_DIM, '#0a1a0a']} position={[0, 0, 0]} />
      )}

      <FloatingParticles scanState={scanState} />

      <Suspense fallback={null}>
        <FigurePlane
          texturePath="/human-wire.png"
          scanState={scanState}
          morphProgress={morphProgress}
          isAlien={false}
        />
        {(morphProgress > 0 || isReveal) && (
          <FigurePlane
            texturePath="/alien-wire.png"
            scanState={scanState}
            morphProgress={morphProgress}
            isAlien={true}
          />
        )}
      </Suspense>

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
      camera={{ position: [0, 0.7, 1.6], fov: 52 }}
      style={{ width: '100%', height: '100%', background: '#020a02' }}
      gl={{ antialias: true, alpha: false }}
    >
      <Scene {...props} />
    </Canvas>
  );
}
