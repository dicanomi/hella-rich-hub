/**
 * THE_MACHINE.EXE — The Machine
 *
 * Industrial mechanical organism built from SVG + CSS.
 * Components: outer ring, inner ring, radar sweep, pressure arc,
 * heartbeat trace, LED array, breathing glow, particle drift.
 *
 * All movement communicates market state.
 * Nothing moves without purpose.
 *
 * Health states: healthy | weak | panic
 */
import { useEffect, useRef } from 'react';

export type MachineState = 'healthy' | 'weak' | 'panic';

interface TheMachineProps {
  state?: MachineState;
  score?: number; // 0–100
  size?: number;  // px, default 320
  holdingSymbols?: string[]; // portfolio positions for radar dots
}

// Heartbeat waveform path (normalized 0–100 viewBox)
// Traced from reference: flat → P-wave → QRS spike → S-wave → T-wave → flat
const HEARTBEAT_D = `
  M 0,50
  L 28,50
  C 30,50 31,48 32,48
  C 33,48 34,47 35,46
  C 36,45 37,46 38,47
  C 39,48 40,49 41,50
  L 43,50
  L 44,51
  L 46,50
  L 47,8
  L 49,82
  L 50,78
  L 51,50
  L 53,45
  L 55,48
  L 57,52
  L 59,51
  L 61,50
  L 63,49
  L 65,47
  L 67,49
  L 69,50
  L 100,50
`;

export function TheMachine({ state = 'healthy', score = 65, size = 320, holdingSymbols = [] }: TheMachineProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const radarRef = useRef<number>(0);
  const breathRef = useRef<number>(0);
  const particlesRef = useRef<Array<{ x: number; y: number; vx: number; vy: number; life: number; el: SVGCircleElement }>>([]);
  const rafRef = useRef<number>(0);

  // State-dependent speeds
  const pulseSpeed = state === 'panic' ? 0.8 : state === 'weak' ? 2.2 : 1.6;
  const radarSpeed = state === 'panic' ? 1.4 : state === 'weak' ? 0.6 : 1.0;
  const glowIntensity = state === 'panic' ? 0.9 : state === 'weak' ? 0.4 : 0.65;

  const cx = size / 2;
  const cy = size / 2;
  const R1 = size * 0.44; // outer ring
  const R2 = size * 0.34; // inner ring
  const R3 = size * 0.24; // pressure arc
  const R4 = size * 0.16; // core

  const amberColor = '#FFA84A';
  const dimColor = '#3A3530';

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;

    const radarLine = svg.querySelector('#machine-radar') as SVGLineElement;
    const radarSweep = svg.querySelector('#machine-sweep') as SVGElement;
    const breathCircle = svg.querySelector('#machine-breath') as SVGCircleElement;
    const hbPath = svg.querySelector('#machine-hb') as SVGPathElement;
    const hbGlow = svg.querySelector('#machine-hb-glow') as SVGPathElement;
    const particleGroup = svg.querySelector('#machine-particles') as SVGGElement;
    const warnLed1 = svg.querySelector('#led-warn-1') as SVGCircleElement;
    const warnLed2 = svg.querySelector('#led-warn-2') as SVGCircleElement;

    let startTime: number | null = null;
    let lastParticle = 0;

    const animate = (ts: number) => {
      if (!startTime) startTime = ts;
      const elapsed = (ts - startTime) / 1000;

      // ── Radar sweep ──
      const radarAngle = (elapsed * radarSpeed * 60) % 360;
      if (radarLine) {
        const rad = (radarAngle - 90) * (Math.PI / 180);
        const x2 = cx + R2 * Math.cos(rad);
        const y2 = cy + R2 * Math.sin(rad);
        radarLine.setAttribute('x2', String(x2));
        radarLine.setAttribute('y2', String(y2));
      }
      if (radarSweep) {
        radarSweep.setAttribute('transform', `rotate(${radarAngle}, ${cx}, ${cy})`);
      }

      // ── Breathing glow ──
      const breathCycle = Math.sin(elapsed * (2 * Math.PI / pulseSpeed));
      const breathScale = 0.92 + breathCycle * 0.08 * glowIntensity;
      if (breathCircle) {
        breathCircle.setAttribute('r', String(R4 * breathScale));
        breathCircle.setAttribute('opacity', String(0.15 + breathCycle * 0.12 * glowIntensity));
      }

      // ── Heartbeat trace scroll ──
      if (hbPath && hbGlow) {
        const hbOffset = -(elapsed * 40 * (1 / pulseSpeed)) % 100;
        hbPath.setAttribute('stroke-dashoffset', String(hbOffset));
        hbGlow.setAttribute('stroke-dashoffset', String(hbOffset));
      }

      // ── Warning LEDs (panic state) ──
      if (state === 'panic') {
        const flickerOn = Math.sin(elapsed * 8) > 0.3;
        if (warnLed1) warnLed1.setAttribute('opacity', flickerOn ? '0.9' : '0.2');
        if (warnLed2) warnLed2.setAttribute('opacity', flickerOn ? '0.7' : '0.1');
      }

      // ── Portfolio radar dots: pulse when sweep passes over ──
      const radarAngleDeg = (elapsed * radarSpeed * 60) % 360;
      const svg2 = svgRef.current;
      if (svg2) {
        const dotEls = svg2.querySelectorAll('.portfolio-dot');
        dotEls.forEach((el, i) => {
          const dotAngle = parseFloat((el as SVGElement).getAttribute('data-angle') ?? '0');
          const diff = ((radarAngleDeg - dotAngle + 360) % 360);
          // Glow for 30 degrees after sweep passes
          const proximity = diff < 30 ? 1 - diff / 30 : 0;
          const baseOpacity = 0.75;
          const glowOpacity = baseOpacity + proximity * 0.25;
          (el as SVGElement).setAttribute('opacity', String(glowOpacity));
          (el as SVGElement).setAttribute('r', String(proximity > 0.1 ? 3.5 + proximity * 2 : 3));
        });
      }

      // ── Particles from core ──
      if (ts - lastParticle > (state === 'panic' ? 200 : 600) && particleGroup) {
        lastParticle = ts;
        const angle = Math.random() * Math.PI * 2;
        const speed = 0.3 + Math.random() * 0.4;
        const el = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        el.setAttribute('r', String(0.8 + Math.random() * 1.2));
        el.setAttribute('fill', amberColor);
        el.setAttribute('opacity', '0.7');
        el.setAttribute('cx', String(cx));
        el.setAttribute('cy', String(cy));
        particleGroup.appendChild(el);
        particlesRef.current.push({
          x: cx, y: cy,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          life: 1.0,
          el,
        });
      }

      // Update particles
      particlesRef.current = particlesRef.current.filter(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.01; // slight gravity
        p.life -= 0.02;
        if (p.life <= 0) {
          p.el.remove();
          return false;
        }
        p.el.setAttribute('cx', String(p.x));
        p.el.setAttribute('cy', String(p.y));
        p.el.setAttribute('opacity', String(p.life * 0.6));
        return true;
      });

      rafRef.current = requestAnimationFrame(animate);
    };

    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
  }, [state, score, pulseSpeed, radarSpeed, glowIntensity, cx, cy, R2, R4]);

  // Pressure arc angle based on score
  const pressureAngle = (score / 100) * 270 - 135; // -135 to +135 degrees
  const pressureRad = (pressureAngle) * (Math.PI / 180);
  const pressureX = cx + R3 * Math.cos(pressureRad - Math.PI / 2);
  const pressureY = cy + R3 * Math.sin(pressureRad - Math.PI / 2);

  // Score arc path
  const arcStart = -135 * (Math.PI / 180);
  const arcEnd = (pressureAngle - 90) * (Math.PI / 180);
  const arcLargeFlag = arcEnd - arcStart > Math.PI ? 1 : 0;
  const arcX1 = cx + R3 * Math.cos(arcStart);
  const arcY1 = cy + R3 * Math.sin(arcStart);
  const arcX2 = cx + R3 * Math.cos(arcEnd);
  const arcY2 = cy + R3 * Math.sin(arcEnd);

  // Portfolio position dots — evenly spaced around the radar ring
  // If no holdings, show score-based decorative dots
  const dotSymbols = holdingSymbols.length > 0 ? holdingSymbols : [];
  const dotCount = dotSymbols.length > 0 ? dotSymbols.length : Math.round((score / 100) * 8);
  const portfolioDots = Array.from({ length: dotCount }, (_, i) => {
    const angleDeg = (i / dotCount) * 360 - 90; // degrees, 0 = top
    const angleRad = angleDeg * (Math.PI / 180);
    return {
      x: cx + (R2 - 6) * Math.cos(angleRad),
      y: cy + (R2 - 6) * Math.sin(angleRad),
      angleDeg,
      symbol: dotSymbols[i] ?? '',
    };
  });

  // Tick marks on outer ring
  const ticks = Array.from({ length: 60 }, (_, i) => {
    const angle = (i / 60) * Math.PI * 2 - Math.PI / 2;
    const isMajor = i % 5 === 0;
    const r1 = R1 - (isMajor ? 10 : 5);
    const r2 = R1 - 2;
    return {
      x1: cx + r1 * Math.cos(angle),
      y1: cy + r1 * Math.sin(angle),
      x2: cx + r2 * Math.cos(angle),
      y2: cy + r2 * Math.sin(angle),
      major: isMajor,
    };
  });

  const stateColor = state === 'panic' ? '#FF5A5A' : state === 'weak' ? '#B8A070' : amberColor;

  return (
    <svg
      ref={svgRef}
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      style={{ display: 'block', overflow: 'visible' }}
      aria-label="The Machine"
    >
      <defs>
        {/* Amber glow filter */}
        <filter id="machine-glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <filter id="machine-glow-soft" x="-100%" y="-100%" width="300%" height="300%">
          <feGaussianBlur stdDeviation="8" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        {/* Radar sweep gradient */}
        <radialGradient id="radar-gradient" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse"
          gradientTransform={`translate(${cx},${cy}) scale(${R2})`}>
          <stop offset="0%" stopColor={amberColor} stopOpacity="0.18" />
          <stop offset="100%" stopColor={amberColor} stopOpacity="0" />
        </radialGradient>
        {/* Heartbeat clip */}
        <clipPath id="hb-clip">
          <rect x={cx - R3 + 4} y={cy - 18} width={(R3 - 4) * 2} height={36} />
        </clipPath>
      </defs>

      {/* ── Outer ring ── */}
      <circle cx={cx} cy={cy} r={R1} fill="none" stroke={dimColor} strokeWidth="1" />
      {/* Tick marks */}
      {ticks.map((t, i) => (
        <line key={i} x1={t.x1} y1={t.y1} x2={t.x2} y2={t.y2}
          stroke={t.major ? '#5A5550' : '#2A2520'} strokeWidth={t.major ? 1 : 0.5} />
      ))}

      {/* ── Inner ring ── */}
      <circle cx={cx} cy={cy} r={R2} fill="none" stroke={dimColor} strokeWidth="1" />

      {/* ── Radar sweep ── */}
      <g id="machine-sweep">
        <path
          d={`M ${cx} ${cy} L ${cx} ${cy - R2} A ${R2} ${R2} 0 0 1 ${cx + R2 * Math.sin(Math.PI / 3)} ${cy - R2 * Math.cos(Math.PI / 3)} Z`}
          fill="url(#radar-gradient)"
          opacity="0.6"
        />
      </g>
      <line id="machine-radar"
        x1={cx} y1={cy}
        x2={cx} y2={cy - R2}
        stroke={amberColor} strokeWidth="0.8" opacity="0.7"
        filter="url(#machine-glow)"
      />
      {/* Radar center dot */}
      <circle cx={cx} cy={cy} r="2" fill={amberColor} opacity="0.5" />

      {/* ── Pressure arc (score) ── */}
      {/* Background arc */}
      <path
        d={`M ${cx + R3 * Math.cos(arcStart)} ${cy + R3 * Math.sin(arcStart)} A ${R3} ${R3} 0 1 1 ${cx + R3 * Math.cos((45) * Math.PI / 180)} ${cy + R3 * Math.sin((45) * Math.PI / 180)}`}
        fill="none" stroke={dimColor} strokeWidth="2" strokeLinecap="round"
      />
      {/* Score arc */}
      {score > 0 && (
        <path
          d={`M ${arcX1} ${arcY1} A ${R3} ${R3} 0 ${arcLargeFlag} 1 ${arcX2} ${arcY2}`}
          fill="none" stroke={stateColor} strokeWidth="2" strokeLinecap="round"
          filter="url(#machine-glow)"
          opacity="0.85"
        />
      )}
      {/* Score needle */}
      <circle cx={pressureX} cy={pressureY} r="3" fill={stateColor} filter="url(#machine-glow)" />

      {/* ── Portfolio position dots on radar ring ── */}
      {portfolioDots.map((dot, i) => (
        <circle
          key={i}
          className="portfolio-dot"
          data-angle={dot.angleDeg}
          cx={dot.x} cy={dot.y} r="3"
          fill={stateColor}
          opacity="0.75"
          filter="url(#machine-glow)"
        />
      ))}

      {/* ── Heartbeat trace ── */}
      <g clipPath="url(#hb-clip)">
        {/* Glow layer */}
        <path id="machine-hb-glow"
          d={HEARTBEAT_D}
          fill="none"
          stroke={amberColor}
          strokeWidth="4"
          strokeOpacity="0.15"
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
          transform={`translate(${cx - R3 + 4}, ${cy - 18}) scale(${(R3 - 4) * 2 / 100}, ${36 / 100})`}
          style={{ filter: 'blur(3px)' }}
          strokeDasharray="200"
          strokeDashoffset="0"
        />
        {/* Core line */}
        <path id="machine-hb"
          d={HEARTBEAT_D}
          fill="none"
          stroke={amberColor}
          strokeWidth="1.2"
          strokeOpacity="0.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
          transform={`translate(${cx - R3 + 4}, ${cy - 18}) scale(${(R3 - 4) * 2 / 100}, ${36 / 100})`}
          strokeDasharray="200"
          strokeDashoffset="0"
        />
      </g>

      {/* ── Core breathing glow ── */}
      <circle id="machine-breath"
        cx={cx} cy={cy} r={R4}
        fill={stateColor}
        opacity="0.15"
        filter="url(#machine-glow-soft)"
      />

      {/* ── Core circle ── */}
      <circle cx={cx} cy={cy} r={R4}
        fill="#000" stroke={stateColor} strokeWidth="1.5" opacity="0.9"
      />
      {/* Inner core ring */}
      <circle cx={cx} cy={cy} r={R4 * 0.65}
        fill="none" stroke={dimColor} strokeWidth="0.8"
      />

      {/* ── Score text in core ── */}
      <text x={cx} y={cy - 4}
        textAnchor="middle"
        fontFamily="'DM Mono', monospace"
        fontSize={size * 0.075}
        fontWeight="400"
        fill={stateColor}
        letterSpacing="0.05em"
      >
        {score}
      </text>
      <text x={cx} y={cy + size * 0.055}
        textAnchor="middle"
        fontFamily="'DM Mono', monospace"
        fontSize={size * 0.028}
        fill="#8E877B"
        letterSpacing="0.15em"
        textTransform="uppercase"
      >
        /100
      </text>

      {/* ── Warning LEDs (panic) ── */}
      {state === 'panic' && (
        <>
          <circle id="led-warn-1" cx={cx - R1 + 16} cy={cy} r="3.5" fill="#FF5A5A" opacity="0.9" filter="url(#machine-glow)" />
          <circle id="led-warn-2" cx={cx + R1 - 16} cy={cy} r="3.5" fill="#FF5A5A" opacity="0.7" filter="url(#machine-glow)" />
        </>
      )}

      {/* ── Cross-hairs ── */}
      <line x1={cx - R1} y1={cy} x2={cx - R2 - 4} y2={cy} stroke={dimColor} strokeWidth="0.5" />
      <line x1={cx + R2 + 4} y1={cy} x2={cx + R1} y2={cy} stroke={dimColor} strokeWidth="0.5" />
      <line x1={cx} y1={cy - R1} x2={cx} y2={cy - R2 - 4} stroke={dimColor} strokeWidth="0.5" />
      <line x1={cx} y1={cy + R2 + 4} x2={cx} y2={cy + R1} stroke={dimColor} strokeWidth="0.5" />

      {/* ── Particle container ── */}
      <g id="machine-particles" />
    </svg>
  );
}
