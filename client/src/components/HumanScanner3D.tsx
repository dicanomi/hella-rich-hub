/**
 * HumanScanner3D — React Three Fiber 3D scanner chamber
 *
 * Uses the Three.js Soldier GLTF model (real human mesh) rendered as:
 * - Cyan/teal wireframe overlay (matches reference image)
 * - Semi-transparent solid fill
 * - Animated scan beam sweeping top→bottom
 * - Zone glow overlays per diagnostic metric
 * - Target acquisition rings in analysis state
 * - Idle auto-rotation
 */
import { useRef, useEffect, Suspense } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useGLTF, OrbitControls } from '@react-three/drei';
import * as THREE from 'three';

type ScanState = 'idle' | 'powering' | 'scanning' | 'analysis' | 'results';

interface HumanScanner3DProps {
  scanState: ScanState;
  scanProgress: number; // 0–100
  activeZones: string[];
}

const MODEL_URL = '/manus-storage/Soldier_d8ef56b3.glb';

// Zone Y-ranges in model space (Soldier is ~2 units tall, feet at 0, head at ~1.9)
const ZONE_BOUNDS: Record<string, [number, number]> = {
  head:   [1.55, 1.95],
  chest:  [1.1,  1.55],
  heart:  [1.15, 1.45],
  gut:    [0.65, 1.1],
  arms:   [0.5,  1.4],
  legs:   [0.0,  0.65],
  full:   [0.0,  1.95],
};

const ZONE_COLORS: Record<string, THREE.Color> = {
  head:   new THREE.Color('#e8a020'),
  chest:  new THREE.Color('#40c0a0'),
  heart:  new THREE.Color('#e05020'),
  gut:    new THREE.Color('#e08030'),
  arms:   new THREE.Color('#60a0e0'),
  legs:   new THREE.Color('#8060d0'),
  full:   new THREE.Color('#d0b040'),
};

// ── Scan beam plane ──────────────────────────────────────────────────────────
function ScanBeam({ scanProgress, visible }: { scanProgress: number; visible: boolean }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);

  useFrame(() => {
    if (!meshRef.current || !glowRef.current) return;
    // Model feet ~0, head ~1.9, scan goes top→bottom
    const y = 1.9 - (scanProgress / 100) * 1.9;
    meshRef.current.position.y = y;
    glowRef.current.position.y = y;
  });

  if (!visible) return null;

  return (
    <group>
      {/* Thin bright line */}
      <mesh ref={meshRef}>
        <planeGeometry args={[1.8, 0.015]} />
        <meshBasicMaterial color="#40e8d0" transparent opacity={0.95} side={THREE.DoubleSide} depthWrite={false} />
      </mesh>
      {/* Soft glow */}
      <mesh ref={glowRef}>
        <planeGeometry args={[1.8, 0.3]} />
        <meshBasicMaterial color="#40e8d0" transparent opacity={0.08} side={THREE.DoubleSide} depthWrite={false} />
      </mesh>
    </group>
  );
}

// ── Target rings ─────────────────────────────────────────────────────────────
function TargetRings({ visible }: { visible: boolean }) {
  const r1 = useRef<THREE.Mesh>(null);
  const r2 = useRef<THREE.Mesh>(null);
  const r3 = useRef<THREE.Mesh>(null);

  useFrame((_, dt) => {
    if (r1.current) r1.current.rotation.z += dt * 0.9;
    if (r2.current) r2.current.rotation.z -= dt * 0.6;
    if (r3.current) r3.current.rotation.y += dt * 0.5;
  });

  if (!visible) return null;

  return (
    <group>
      <mesh ref={r1} position={[0, 1.72, 0]}>
        <torusGeometry args={[0.22, 0.006, 8, 32]} />
        <meshBasicMaterial color="#d4900a" transparent opacity={0.8} />
      </mesh>
      <mesh ref={r2} position={[0, 1.25, 0]}>
        <torusGeometry args={[0.32, 0.005, 8, 32]} />
        <meshBasicMaterial color="#40e8d0" transparent opacity={0.6} />
      </mesh>
      <mesh ref={r3} position={[0, 0.8, 0]}>
        <torusGeometry args={[0.28, 0.004, 8, 32]} />
        <meshBasicMaterial color="#d4900a" transparent opacity={0.45} />
      </mesh>
    </group>
  );
}

// ── Zone glow boxes ───────────────────────────────────────────────────────────
function ZoneGlows({ activeZones }: { activeZones: string[] }) {
  if (activeZones.length === 0) return null;

  const zones = activeZones.includes('full') ? Object.keys(ZONE_BOUNDS) : activeZones;

  return (
    <group>
      {zones.map(zone => {
        const bounds = ZONE_BOUNDS[zone];
        if (!bounds) return null;
        const [yMin, yMax] = bounds;
        const height = yMax - yMin;
        const y = yMin + height / 2;
        const color = ZONE_COLORS[zone] || new THREE.Color('#40c060');

        return (
          <mesh key={zone} position={[0, y, 0]}>
            <boxGeometry args={[0.7, height, 0.4]} />
            <meshBasicMaterial color={color} transparent opacity={0.06} depthWrite={false} />
          </mesh>
        );
      })}
    </group>
  );
}

// ── Human model ───────────────────────────────────────────────────────────────
function HumanModel({
  scanState, scanProgress, activeZones,
}: {
  scanState: ScanState;
  scanProgress: number;
  activeZones: string[];
}) {
  const groupRef = useRef<THREE.Group>(null);
  const { scene } = useGLTF(MODEL_URL);
  const { camera } = useThree();

  // Clone scene to avoid mutation issues
  const cloned = useRef<THREE.Group | null>(null);
  const wireframes = useRef<THREE.Mesh[]>([]);
  const solids = useRef<THREE.Mesh[]>([]);

  useEffect(() => {
    const clone = scene.clone(true);

    // Step 1: measure native bounding box (before any scale)
    const nativeBox = new THREE.Box3().setFromObject(clone);
    const nativeSize = nativeBox.getSize(new THREE.Vector3());
    const nativeCenter = nativeBox.getCenter(new THREE.Vector3());

    // Step 2: scale to target height of 2.0 units
    const targetHeight = 1.7; // slightly smaller to fit portrait canvas
    const scale = targetHeight / nativeSize.y;
    clone.scale.setScalar(scale);

    // Step 3: center horizontally, place feet at y=0
    // After scaling, min.y * scale = feet position
    clone.position.x = -nativeCenter.x * scale;
    clone.position.y = -nativeBox.min.y * scale;
    clone.position.z = -nativeCenter.z * scale;

    // Replace all materials with wireframe + solid
    wireframes.current = [];
    solids.current = [];

    clone.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        // Solid fill — very dim
        const solidMat = new THREE.MeshBasicMaterial({
          color: new THREE.Color('#0a1a14'),
          transparent: true,
          opacity: 0.85,
          side: THREE.FrontSide,
        });

        // Wireframe overlay
        const wireMat = new THREE.MeshBasicMaterial({
          color: new THREE.Color('#40c8b0'),
          wireframe: true,
          transparent: true,
          opacity: 0.55,
        });

        child.material = solidMat;
        solids.current.push(child);

        // Add wireframe mesh as sibling
        const wireMesh = new THREE.Mesh(child.geometry, wireMat);
        wireMesh.position.copy(child.position);
        wireMesh.rotation.copy(child.rotation);
        wireMesh.scale.copy(child.scale);
        child.parent?.add(wireMesh);
        wireframes.current.push(wireMesh);
      }
    });

    cloned.current = clone;
    groupRef.current?.add(clone);

    return () => {
      groupRef.current?.remove(clone);
    };
  }, [scene]);

  // Update wireframe colors based on scan state and active zones
  useFrame((_, dt) => {
    if (!groupRef.current) return;

    // Rotation
    if (scanState === 'idle') {
      groupRef.current.rotation.y += dt * 0.3;
    } else if (scanState === 'scanning') {
      groupRef.current.rotation.y = Math.sin(Date.now() * 0.0003) * 0.12;
    } else {
      groupRef.current.rotation.y *= 0.95; // ease to front
    }

    // Scan beam proximity — brighten wireframe near beam
    const beamY = 1.9 - (scanProgress / 100) * 1.9;
    const isScanning = scanState === 'scanning';

    wireframes.current.forEach((wire) => {
      const mat = wire.material as THREE.MeshBasicMaterial;
      if (isScanning) {
        // Get world Y of this mesh
        const worldPos = new THREE.Vector3();
        wire.getWorldPosition(worldPos);
        const dist = Math.abs(worldPos.y - beamY);
        const proximity = Math.max(0, 1 - dist / 0.4);
        if (proximity > 0.05) {
          mat.color.set('#80ffee');
          mat.opacity = 0.5 + proximity * 0.45;
        } else {
          mat.color.set('#40c8b0');
          mat.opacity = 0.35;
        }
      } else if (scanState === 'results' && activeZones.length > 0) {
        // Color by zone
        const worldPos = new THREE.Vector3();
        wire.getWorldPosition(worldPos);
        const y = worldPos.y;
        let zoneColor = new THREE.Color('#40c8b0');
        let opacity = 0.3;

        for (const zone of activeZones) {
          const bounds = ZONE_BOUNDS[zone];
          if (bounds && y >= bounds[0] && y <= bounds[1]) {
            zoneColor = ZONE_COLORS[zone] || zoneColor;
            opacity = 0.65;
            break;
          }
        }
        mat.color.copy(zoneColor);
        mat.opacity = opacity;
      } else if (scanState === 'idle') {
        mat.color.set('#2a6040');
        mat.opacity = 0.22;
      } else {
        mat.color.set('#40c8b0');
        mat.opacity = 0.4;
      }
    });

    // Pulse solid fill in results
    if (scanState === 'results') {
      const pulse = 0.75 + Math.sin(Date.now() * 0.002) * 0.1;
      solids.current.forEach(s => {
        (s.material as THREE.MeshBasicMaterial).opacity = pulse;
      });
    }
  });

  return <group ref={groupRef} />;
}

// ── Grid floor ────────────────────────────────────────────────────────────────
function GridFloor({ visible }: { visible: boolean }) {
  if (!visible) return null;
  return <gridHelper args={[3, 20, '#1a2a1a', '#0d180d']} position={[0, 0, 0]} />;
}

// ── Atmospheric scan lines ────────────────────────────────────────────────────
function ScanLines() {
  const ref = useRef<THREE.Group>(null);
  useFrame(() => {
    if (!ref.current) return;
    ref.current.children.forEach((child, i) => {
      const mat = (child as THREE.Mesh).material as THREE.MeshBasicMaterial;
      mat.opacity = 0.03 + Math.sin(Date.now() * 0.001 + i * 0.9) * 0.015;
    });
  });
  return (
    <group ref={ref}>
      {Array.from({ length: 10 }, (_, i) => (
        <mesh key={i} position={[(i - 4.5) * 0.35, 0.95, -0.9]}>
          <planeGeometry args={[0.004, 2.2]} />
          <meshBasicMaterial color="#40c060" transparent opacity={0.04} />
        </mesh>
      ))}
    </group>
  );
}

// ── Loading fallback ──────────────────────────────────────────────────────────
function LoadingFallback() {
  const ref = useRef<THREE.Mesh>(null);
  useFrame((_, dt) => {
    if (ref.current) ref.current.rotation.y += dt * 1.5;
  });
  return (
    <mesh ref={ref} position={[0, 0.95, 0]}>
      <torusGeometry args={[0.3, 0.02, 8, 32]} />
      <meshBasicMaterial color="#40c8b0" transparent opacity={0.6} />
    </mesh>
  );
}

// ── Main scene ────────────────────────────────────────────────────────────────
function Scene({ scanState, scanProgress, activeZones }: HumanScanner3DProps) {
  return (
    <>
      <color attach="background" args={['#0a0908']} />
      <ambientLight intensity={0.05} />
      <pointLight position={[0, 2, 2]} intensity={0.2} color="#40c060" />

      <ScanLines />
      <GridFloor visible={scanState !== 'idle'} />

      <Suspense fallback={<LoadingFallback />}>
        <HumanModel scanState={scanState} scanProgress={scanProgress} activeZones={activeZones} />
      </Suspense>

      <ScanBeam scanProgress={scanProgress} visible={scanState === 'scanning'} />
      <ZoneGlows activeZones={scanState === 'results' ? activeZones : []} />
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
      camera={{ position: [0, 0.85, 2.5], fov: 50 }}
      style={{ width: '100%', height: '100%', background: '#0a0908' }}
      gl={{ antialias: true, alpha: false }}
    >
      <Scene {...props} />
    </Canvas>
  );
}

// Preload
useGLTF.preload(MODEL_URL);
