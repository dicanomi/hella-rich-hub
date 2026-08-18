import { useEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import { Canvas, useFrame, useThree } from '@react-three/fiber'

const POINTS = 257

interface WireformProps {
  /** Idle sine amplitude in px */
  idleAmp: number
  /** Amplitude when excited (hover) */
  exciteAmp: number
  /** Vertical position of the line as a fraction of canvas height */
  heightFrac: number
  /** Hover excitation */
  excited: boolean
  /** Slow amplitude breathing (final CTA) */
  breathe?: boolean
}

function Wireform({ idleAmp, exciteAmp, heightFrac, excited, breathe = false }: WireformProps) {
  const lineRef = useRef<THREE.Line>(null)
  const { size } = useThree()
  const state = useRef({ excite: 0, reveal: 0 })

  const geometry = useMemo(() => {
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(POINTS * 3), 3))
    return g
  }, [])

  const line = useMemo(
    () =>
      new THREE.Line(
        geometry,
        new THREE.LineBasicMaterial({ color: '#00E5C7', transparent: true, opacity: 0.85 }),
      ),
    [geometry],
  )

  useFrame((_, dt) => {
    const s = state.current
    // excitation attack ~400ms, release ~800ms
    const target = excited ? 1 : 0
    const tau = excited ? 0.4 : 0.8
    s.excite += (target - s.excite) * Math.min(1, dt / tau)
    // draw-in from left, 800ms
    s.reveal = Math.min(1, s.reveal + dt / 0.8)

    const t = performance.now() / 1000
    const baseY = size.height * heightFrac
    const breatheAmp = breathe ? (idleAmp + 8 * Math.sin(t * ((2 * Math.PI) / 3))) : idleAmp
    const amp = breatheAmp + (exciteAmp - breatheAmp) * s.excite

    const pos = geometry.getAttribute('position') as THREE.BufferAttribute
    const w = size.width
    const k = (Math.PI * 2) / (w / 1.5) // primary spatial frequency
    const speed = Math.PI * 2 * 0.2 // 0.2 Hz idle LFO
    for (let i = 0; i < POINTS; i++) {
      const f = i / (POINTS - 1)
      const x = f * w
      // unrevealed portion collapses to the baseline (line "draws in" from left)
      const env = f <= s.reveal ? 1 : 0
      const primary = Math.sin(k * x + t * speed)
      const h3 = 0.6 * Math.sin(3 * k * x + t * speed * 1.7 + 1.2)
      const h5 = 0.4 * Math.sin(5 * k * x - t * speed * 2.3 + 2.1)
      const edge = Math.sin(f * Math.PI) ** 0.5 // taper the ends
      const y = baseY + env * edge * amp * (primary + s.excite * (h3 + h5))
      pos.setXYZ(i, x, y, 0)
    }
    pos.needsUpdate = true
  })

  return <primitive object={line} ref={lineRef} />
}

/**
 * The hero/final-CTA "wireform" — a thin 1px cyan polyline spanning the
 * viewport, oscillating with a slow idle sine LFO; excites into harmonics on
 * hover (design.md home §2/§8). A demo of the visualizer — no mic needed.
 */
export default function WireformCanvas(props: WireformProps & { className?: string }) {
  const { className, ...wire } = props
  const wrapRef = useRef<HTMLDivElement>(null)
  const [inView, setInView] = useState(true)

  // pause the render loop when the wireform leaves the viewport
  useEffect(() => {
    const el = wrapRef.current
    if (!el) return
    const io = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting))
    io.observe(el)
    return () => io.disconnect()
  }, [])

  return (
    <div className={className} aria-hidden ref={wrapRef}>
      <Canvas
        orthographic
        gl={{ alpha: true, antialias: true }}
        style={{ width: '100%', height: '100%', display: 'block' }}
        dpr={[1, 2]}
        frameloop={inView ? 'always' : 'never'}
        camera={{ left: 0, right: 1, top: 0, bottom: 1, near: -10, far: 10, position: [0, 0, 1] }}
        onCreated={({ camera, size }) => {
          // keep pixel-space ortho frustum in sync with canvas size
          const cam = camera as THREE.OrthographicCamera
          cam.right = size.width
          cam.bottom = size.height
          cam.updateProjectionMatrix()
        }}
      >
        <ResizeSync />
        <Wireform {...wire} />
      </Canvas>
    </div>
  )
}

function ResizeSync() {
  const { camera, size } = useThree()
  const cam = camera as THREE.OrthographicCamera
  useMemo(() => {
    cam.left = 0
    cam.right = size.width
    cam.top = 0
    cam.bottom = size.height
    cam.updateProjectionMatrix()
  }, [cam, size.width, size.height])
  return null
}
