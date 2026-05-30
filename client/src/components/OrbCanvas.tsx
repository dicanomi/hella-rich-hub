// OrbCanvas — Seven Deadly Sins mood system
// Interaction handlers, progression system, mood state machine

import { useEffect, useRef, useCallback } from 'react';
import { OrbRenderer } from '../lib/orbRenderer';
import { orbAudio } from '../lib/orbAudio';
import {
  MOODS, MOOD_TRANSITIONS, MoodName, getRandomMessage,
  weightedRandom, PROGRESSION_MESSAGES
} from '../lib/orbMoods';

interface OrbCanvasProps {
  onMoodChange: (mood: MoodName) => void;
  onMessage: (msg: string, isRare?: boolean) => void;
  currentMood: MoodName;
  onInteractionStart: () => void;
  onProgressionUpdate: (level: number, count: number) => void;
}

export default function OrbCanvas({
  onMoodChange,
  onMessage,
  currentMood,
  onInteractionStart,
  onProgressionUpdate,
}: OrbCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<OrbRenderer | null>(null);
  const moodRef = useRef<MoodName>(currentMood);
  const particleModeRef = useRef<string>('drift');

  const audioStartedRef = useRef(false);
  const interactionCountRef = useRef(0);
  const lastMoodChangeRef = useRef(0);
  const holdTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const moodTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isDraggingRef = useRef(false);
  const lastPointerRef = useRef({ x: 0, y: 0, time: 0 });
  const rubCountRef = useRef(0);
  const fastTapCountRef = useRef(0);
  const fastTapTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const circularRubRef = useRef<{ angles: number[], lastAngle: number }>({ angles: [], lastAngle: 0 });
  const progressionLevelRef = useRef(0);
  const isHoldingRef = useRef(false);
  const holdIntensityRef = useRef(0);
  const holdRampRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => { moodRef.current = currentMood; }, [currentMood]);

  // Initialize renderer
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const updateSize = () => {
      const dpr = window.devicePixelRatio || 1;
      const w = canvas.offsetWidth * dpr;
      const h = canvas.offsetHeight * dpr;
      if (rendererRef.current) rendererRef.current.resize(w, h);
    };

    let animId = 0;
    try {
      const renderer = new OrbRenderer(canvas);
      rendererRef.current = renderer;
      updateSize();
      const loop = () => {
        renderer.render(particleModeRef.current);
        animId = requestAnimationFrame(loop);
      };
      animId = requestAnimationFrame(loop);
    } catch (e) {
      console.error('WebGL init failed:', e);
    }

    const ro = new ResizeObserver(updateSize);
    ro.observe(canvas);
    return () => {
      ro.disconnect();
      cancelAnimationFrame(animId);
      rendererRef.current = null;
    };
  }, []);

  // Apply mood to renderer
  const applyMood = useCallback((mood: MoodName) => {
    const cfg = MOODS[mood];
    if (!cfg) return;
    particleModeRef.current = cfg.particleMode;
    rendererRef.current?.setState({
      liquidColor: cfg.liquidColor,
      rimColor: cfg.rimColor,
      turbulenceSpeed: cfg.turbulenceSpeed,
      turbulenceScale: cfg.turbulenceScale,
      rotationSpeed: cfg.rotationSpeed,
      glowIntensity: cfg.glowIntensity,
    });
    if (audioStartedRef.current) orbAudio.setMode(cfg.audioMode);
  }, []);

  useEffect(() => { applyMood(currentMood); }, [currentMood, applyMood]);

  // Progression
  const updateProgression = useCallback((count: number) => {
    const level = Math.min(1.0, Math.log(count + 1) / Math.log(120));
    progressionLevelRef.current = level;
    rendererRef.current?.setState({ progressionLevel: level });
    onProgressionUpdate(level, count);

    const milestones = Object.keys(PROGRESSION_MESSAGES).map(Number).sort((a, b) => a - b);
    for (const milestone of milestones) {
      if (count === milestone) {
        const msgs = PROGRESSION_MESSAGES[milestone];
        onMessage(msgs[Math.floor(Math.random() * msgs.length)], true);
        if (count === 50 || count === 100) {
          const special: MoodName = count >= 100 ? 'PRIDE' : 'ENVY';
          moodRef.current = special;
          onMoodChange(special);
          applyMood(special);
        }
        break;
      }
    }
  }, [onMessage, onMoodChange, applyMood, onProgressionUpdate]);

  // Autonomous mood transitions
  const scheduleMoodTransition = useCallback(() => {
    if (moodTimerRef.current) clearTimeout(moodTimerRef.current);
    const delay = 7000 + Math.random() * 14000;
    moodTimerRef.current = setTimeout(() => {
      const now = Date.now();
      if (now - lastMoodChangeRef.current < 4000) { scheduleMoodTransition(); return; }
      const current = moodRef.current;
      const transitions = MOOD_TRANSITIONS[current];
      if (!transitions) { scheduleMoodTransition(); return; }
      const nextMood = weightedRandom(transitions);
      if (nextMood !== current || Math.random() < 0.25) {
        moodRef.current = nextMood;
        onMoodChange(nextMood);
        onMessage(getRandomMessage(nextMood));
        applyMood(nextMood);
      }
      scheduleMoodTransition();
    }, delay);
  }, [onMoodChange, onMessage, applyMood]);

  useEffect(() => {
    scheduleMoodTransition();
    return () => { if (moodTimerRef.current) clearTimeout(moodTimerRef.current); };
  }, [scheduleMoodTransition]);

  // Idle detection
  const resetIdleTimer = useCallback(() => {
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    idleTimerRef.current = setTimeout(() => {
      rendererRef.current?.setState({ interactionIntensity: 0, touchPressure: 0 });
      if (Math.random() < 0.45) {
        const current = moodRef.current;
        const transitions = MOOD_TRANSITIONS[current];
        if (!transitions) return;
        const nextMood = weightedRandom(transitions);
        onMoodChange(nextMood);
        onMessage(getRandomMessage(nextMood));
        applyMood(nextMood);
        moodRef.current = nextMood;
        if (audioStartedRef.current) orbAudio.triggerThud();
      }
    }, 7000);
  }, [onMoodChange, onMessage, applyMood]);

  // Convert client coords to orb space
  const clientToOrb = useCallback((cx: number, cy: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0, onOrb: false, dist: 1 };
    const rect = canvas.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const orbRadius = Math.min(rect.width, rect.height) * 0.35;
    const dx = cx - centerX;
    const dy = cy - centerY;
    const dist = Math.sqrt(dx * dx + dy * dy);
    return { x: dx / orbRadius, y: -dy / orbRadius, onOrb: dist < orbRadius * 1.08, dist: dist / orbRadius };
  }, []);

  // Core interaction trigger — updated for Seven Deadly Sins
  const triggerInteraction = useCallback((
    type: 'tap' | 'hold' | 'rub' | 'drag' | 'circular' | 'fast-tap' | 'hover',
    intensity: number = 0.5
  ) => {
    if (!audioStartedRef.current) return;

    interactionCountRef.current++;
    lastMoodChangeRef.current = Date.now();
    updateProgression(interactionCountRef.current);

    const current = moodRef.current;
    const count = interactionCountRef.current;
    const useRare = count > 15 && Math.random() < 0.10;

    // Resistance / ignore
    if (Math.random() < 0.06) { onMessage('NOT NOW.'); return; }
    if (Math.random() < 0.04) {
      const avoidMood: MoodName = 'SLOTH';
      moodRef.current = avoidMood;
      onMoodChange(avoidMood); applyMood(avoidMood);
      onMessage('THE ORB WITHDRAWS.'); return;
    }

    // Rare UNKNOWN trigger
    const isUnknownTrigger = count > 20 && count % 23 === 0;
    const isPrideTrigger = count > 40 && count % 37 === 0;

    let nextMood: MoodName = current;

    if (isUnknownTrigger) {
      nextMood = 'UNKNOWN';
    } else if (isPrideTrigger) {
      nextMood = 'PRIDE';
    } else {
      switch (type) {
        case 'tap':
          nextMood = weightedRandom([
            ['LUST',22],['ENVY',18],['GREED',16],['WRATH',14],
            ['GLUTTONY',12],['PRIDE',10],['SLOTH',5],['UNKNOWN',3],
          ]);
          break;
        case 'hold':
          nextMood = weightedRandom([
            ['SLOTH',25],['PRIDE',22],['LUST',18],['ENVY',15],
            ['GREED',10],['GLUTTONY',6],['WRATH',3],['UNKNOWN',1],
          ]);
          break;
        case 'rub':
          nextMood = weightedRandom([
            ['LUST',28],['GLUTTONY',22],['ENVY',18],['GREED',14],
            ['WRATH',10],['PRIDE',5],['SLOTH',2],['UNKNOWN',1],
          ]);
          break;
        case 'circular':
          nextMood = weightedRandom([
            ['GLUTTONY',28],['LUST',22],['GREED',18],['ENVY',16],
            ['WRATH',10],['UNKNOWN',6],
          ]);
          break;
        case 'drag':
          nextMood = weightedRandom([
            ['WRATH',25],['ENVY',22],['GREED',18],['GLUTTONY',15],
            ['LUST',12],['SLOTH',5],['UNKNOWN',3],
          ]);
          break;
        case 'fast-tap':
          nextMood = weightedRandom([
            ['WRATH',30],['GLUTTONY',22],['ENVY',18],['GREED',14],
            ['UNKNOWN',10],['LUST',4],['SLOTH',2],
          ]);
          break;
        case 'hover':
          nextMood = weightedRandom([
            ['ENVY',30],['LUST',22],['PRIDE',20],['SLOTH',15],
            ['GREED',8],['UNKNOWN',3],['WRATH',2],
          ]);
          break;
      }
    }

    const message = getRandomMessage(nextMood);
    if (nextMood !== current || Math.random() < 0.35) {
      moodRef.current = nextMood;
      onMoodChange(nextMood);
      applyMood(nextMood);
    }
    onMessage(message, useRare);

    orbAudio.setIntensity(intensity);
    if (type === 'tap') orbAudio.triggerPing(440 + Math.random() * 440);
    if (type === 'hold') orbAudio.triggerThud(55 + progressionLevelRef.current * 20);
    if (type === 'rub') orbAudio.triggerRubHarmonics(intensity);
    if (type === 'circular') orbAudio.triggerPing(660 + Math.random() * 220, 0.35);
    if (type === 'drag') orbAudio.triggerDrag(intensity);
    if (type === 'fast-tap') orbAudio.triggerThud(80);
  }, [onMoodChange, onMessage, applyMood, updateProgression]);

  // Pointer down
  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    const { x, y, onOrb } = clientToOrb(e.clientX, e.clientY);
    if (!onOrb) return;

    if (!audioStartedRef.current) {
      audioStartedRef.current = true;
      onInteractionStart();
    }

    isDraggingRef.current = false;
    isHoldingRef.current = true;
    holdIntensityRef.current = 0;
    lastPointerRef.current = { x: e.clientX, y: e.clientY, time: Date.now() };
    circularRubRef.current = { angles: [], lastAngle: Math.atan2(y, x) };

    rendererRef.current?.setState({ touchX: x, touchY: y, touchPressure: 0.5, interactionIntensity: 0.7 });

    if (holdRampRef.current) clearInterval(holdRampRef.current);
    holdRampRef.current = setInterval(() => {
      holdIntensityRef.current = Math.min(1.0, holdIntensityRef.current + 0.04);
      rendererRef.current?.setState({
        touchPressure: 0.5 + holdIntensityRef.current * 0.5,
        interactionIntensity: 0.7 + holdIntensityRef.current * 0.3,
      });
      if (audioStartedRef.current) orbAudio.triggerHoldOpen(holdIntensityRef.current);
    }, 50);

    holdTimerRef.current = setTimeout(() => {
      if (!isDraggingRef.current && isHoldingRef.current) {
        triggerInteraction('hold', 0.75);
        rendererRef.current?.setState({ touchPressure: 0.9, interactionIntensity: 1.0 });
      }
    }, 550);

    resetIdleTimer();
  }, [clientToOrb, triggerInteraction, resetIdleTimer, onInteractionStart]);

  // Pointer move
  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    const { x, y, onOrb } = clientToOrb(e.clientX, e.clientY);

    if (e.buttons === 0) {
      if (onOrb) {
        rendererRef.current?.setState({ touchX: x, touchY: y, interactionIntensity: 0.25 });
        if (audioStartedRef.current && Math.random() < 0.004) triggerInteraction('hover', 0.15);
      } else {
        rendererRef.current?.setState({ interactionIntensity: 0 });
      }
      return;
    }

    if (!onOrb && !isDraggingRef.current) return;

    const dx = e.clientX - lastPointerRef.current.x;
    const dy = e.clientY - lastPointerRef.current.y;
    const moveDist = Math.sqrt(dx * dx + dy * dy);
    const dt = Date.now() - lastPointerRef.current.time;

    if (moveDist > 4) {
      isDraggingRef.current = true;
      if (holdTimerRef.current) clearTimeout(holdTimerRef.current);
    }

    // Circular rub detection
    const currentAngle = Math.atan2(y, x);
    const angleDelta = currentAngle - circularRubRef.current.lastAngle;
    const normDelta = ((angleDelta + Math.PI * 3) % (Math.PI * 2)) - Math.PI;
    circularRubRef.current.angles.push(normDelta);
    circularRubRef.current.lastAngle = currentAngle;
    if (circularRubRef.current.angles.length > 20) circularRubRef.current.angles.shift();
    const totalRotation = circularRubRef.current.angles.reduce((a, b) => a + b, 0);
    if (Math.abs(totalRotation) > Math.PI * 1.2) {
      circularRubRef.current.angles = [];
      triggerInteraction('circular', 0.8);
    }

    if (dt < 120 && moveDist > 2 && moveDist < 35) {
      rubCountRef.current++;
      if (rubCountRef.current >= 5) { rubCountRef.current = 0; triggerInteraction('rub', 0.65); }
    }

    if (moveDist < 8 && dt < 80) {
      fastTapCountRef.current++;
      if (fastTapTimerRef.current) clearTimeout(fastTapTimerRef.current);
      fastTapTimerRef.current = setTimeout(() => { fastTapCountRef.current = 0; }, 800);
      if (fastTapCountRef.current >= 8) { fastTapCountRef.current = 0; triggerInteraction('fast-tap', 0.85); }
    }

    lastPointerRef.current = { x: e.clientX, y: e.clientY, time: Date.now() };
    rendererRef.current?.setState({ touchX: x, touchY: y, touchPressure: 0.7, interactionIntensity: 0.9 });
    resetIdleTimer();
  }, [clientToOrb, triggerInteraction, resetIdleTimer]);

  // Pointer up
  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    if (holdTimerRef.current) clearTimeout(holdTimerRef.current);
    if (holdRampRef.current) clearInterval(holdRampRef.current);
    isHoldingRef.current = false;

    const { onOrb } = clientToOrb(e.clientX, e.clientY);
    const dt = Date.now() - lastPointerRef.current.time;

    if (onOrb && !isDraggingRef.current && dt < 350) triggerInteraction('tap', 0.5);
    else if (isDraggingRef.current) triggerInteraction('drag', 0.6);

    isDraggingRef.current = false;
    rubCountRef.current = 0;
    circularRubRef.current = { angles: [], lastAngle: 0 };

    rendererRef.current?.setState({ touchPressure: 0 });
    setTimeout(() => rendererRef.current?.setState({ interactionIntensity: 0.2 }), 600);
    setTimeout(() => rendererRef.current?.setState({ interactionIntensity: 0 }), 1800);
    resetIdleTimer();
  }, [clientToOrb, triggerInteraction, resetIdleTimer]);

  const handlePointerLeave = useCallback(() => {
    if (holdTimerRef.current) clearTimeout(holdTimerRef.current);
    if (holdRampRef.current) clearInterval(holdRampRef.current);
    isHoldingRef.current = false;
    isDraggingRef.current = false;
    rendererRef.current?.setState({ touchPressure: 0, interactionIntensity: 0 });
  }, []);

  // Touch events
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    const t = e.touches[0];
    handlePointerDown({ clientX: t.clientX, clientY: t.clientY, buttons: 1 } as React.PointerEvent);
  }, [handlePointerDown]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    const t = e.touches[0];
    handlePointerMove({ clientX: t.clientX, clientY: t.clientY, buttons: 1 } as React.PointerEvent);
  }, [handlePointerMove]);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    const t = e.changedTouches[0];
    handlePointerUp({ clientX: t.clientX, clientY: t.clientY, buttons: 0 } as React.PointerEvent);
  }, [handlePointerUp]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        display: 'block', width: '100%', height: '100%',
        cursor: 'default', touchAction: 'none',
        userSelect: 'none', WebkitUserSelect: 'none',
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerLeave}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    />
  );
}
