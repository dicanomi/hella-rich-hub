/**
 * LOW BATTERY — Fly System v2
 * - One fly at a time
 * - Organic bezier movement, no teleporting
 * - Enters every 20s, circles, lands, crawls, exits
 * - Continuous animation via requestAnimationFrame
 */

import { useCallback, useEffect, useRef, useState } from 'react';

export interface FlyState {
  id: number;
  x: number;
  y: number;
  phase: 'entering' | 'circling' | 'landing' | 'crawling' | 'exiting' | 'splatted' | 'dead';
  rotation: number;
  scale: number;
  opacity: number;
}

interface FlySystemOptions {
  containerWidth: number;
  containerHeight: number;
  detectorCenterX: number;
  detectorCenterY: number;
  detectorRadius: number;
  onSplat: () => void;
  onBuzz: (duration: number) => void;
}

export function useFlySystem({
  containerWidth,
  containerHeight,
  detectorCenterX,
  detectorCenterY,
  detectorRadius,
  onSplat,
  onBuzz,
}: FlySystemOptions) {
  const [fly, setFly] = useState<FlyState | null>(null);
  const [splats, setSplats] = useState<Array<{ id: number; x: number; y: number }>>([]);
  const flyIdRef = useRef(0);
  const flyRef = useRef<FlyState | null>(null);
  const rafRef = useRef<number | null>(null);
  const spawnTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const spawnIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearRaf = () => {
    if (rafRef.current) { cancelAnimationFrame(rafRef.current); rafRef.current = null; }
  };

  const getEdgePoint = useCallback((side?: number) => {
    const s = side !== undefined ? side : Math.floor(Math.random() * 4);
    switch (s) {
      case 0: return { x: Math.random() * containerWidth, y: -20 };
      case 1: return { x: containerWidth + 20, y: Math.random() * containerHeight * 0.7 };
      case 2: return { x: Math.random() * containerWidth, y: containerHeight + 20 };
      default: return { x: -20, y: Math.random() * containerHeight * 0.7 };
    }
  }, [containerWidth, containerHeight]);

  // Smooth bezier interpolation
  const bezier = (p0: {x:number,y:number}, p1: {x:number,y:number}, p2: {x:number,y:number}, t: number) => ({
    x: (1-t)*(1-t)*p0.x + 2*(1-t)*t*p1.x + t*t*p2.x,
    y: (1-t)*(1-t)*p0.y + 2*(1-t)*t*p1.y + t*t*p2.y,
  });

  const spawnFly = useCallback(() => {
    if (flyRef.current && flyRef.current.phase !== 'dead' && flyRef.current.phase !== 'splatted') return;
    if (containerWidth === 0) return;

    clearRaf();
    const id = ++flyIdRef.current;
    const entry = getEdgePoint();

    const newFly: FlyState = {
      id, x: entry.x, y: entry.y,
      phase: 'entering', rotation: Math.random() * 360,
      scale: 1, opacity: 0,
    };
    flyRef.current = newFly;
    setFly({ ...newFly });
    onBuzz(1.2);

    // Phase 1: Enter toward detector
    const approachAngle = Math.random() * Math.PI * 2;
    const approachDist = detectorRadius * (1.2 + Math.random() * 0.6);
    const approach = {
      x: detectorCenterX + Math.cos(approachAngle) * approachDist,
      y: detectorCenterY + Math.sin(approachAngle) * approachDist,
    };
    const midEntry = {
      x: (entry.x + approach.x) / 2 + (Math.random() - 0.5) * 180,
      y: (entry.y + approach.y) / 2 + (Math.random() - 0.5) * 130,
    };

    let t = 0;
    const entrySpeed = 0.007 + Math.random() * 0.005;

    const animEnter = () => {
      if (!flyRef.current || flyRef.current.id !== id) return;
      t = Math.min(t + entrySpeed, 1);
      const pos = bezier(entry, midEntry, approach, t);
      const updated: FlyState = {
        ...flyRef.current,
        x: pos.x, y: pos.y,
        opacity: Math.min(t * 4, 1),
        rotation: flyRef.current.rotation + (Math.random() - 0.5) * 6,
      };
      flyRef.current = updated;
      setFly({ ...updated });
      if (t < 1) {
        rafRef.current = requestAnimationFrame(animEnter);
      } else {
        startCircling(id);
      }
    };
    rafRef.current = requestAnimationFrame(animEnter);
  }, [containerWidth, containerHeight, detectorCenterX, detectorCenterY, detectorRadius, getEdgePoint, onBuzz]);

  const startCircling = useCallback((flyId: number) => {
    if (!flyRef.current || flyRef.current.id !== flyId) return;
    flyRef.current = { ...flyRef.current, phase: 'circling' };
    setFly({ ...flyRef.current });

    let angle = Math.atan2(
      flyRef.current.y - detectorCenterY,
      flyRef.current.x - detectorCenterX
    );
    let orbitR = detectorRadius * (1.15 + Math.random() * 0.5);
    const angSpeed = (0.018 + Math.random() * 0.012) * (Math.random() > 0.3 ? 1 : -1);
    let laps = 0;
    const maxLaps = 1.5 + Math.random() * 2.5;

    const animCircle = () => {
      if (!flyRef.current || flyRef.current.id !== flyId || flyRef.current.phase === 'splatted') return;
      angle += angSpeed;
      orbitR += (Math.random() - 0.5) * 2.5;
      orbitR = Math.max(detectorRadius * 0.95, Math.min(detectorRadius * 2.2, orbitR));
      laps += Math.abs(angSpeed) / (Math.PI * 2);

      const wx = (Math.random() - 0.5) * 3.5;
      const wy = (Math.random() - 0.5) * 3.5;
      const updated: FlyState = {
        ...flyRef.current,
        x: detectorCenterX + Math.cos(angle) * orbitR + wx,
        y: detectorCenterY + Math.sin(angle) * orbitR + wy,
        rotation: (angle * 180 / Math.PI) + 90,
      };
      flyRef.current = updated;
      setFly({ ...updated });

      if (laps < maxLaps) {
        rafRef.current = requestAnimationFrame(animCircle);
      } else {
        // 60% chance to land, 40% to exit
        if (Math.random() > 0.4) {
          startLanding(flyId);
        } else {
          startExiting(flyId);
        }
      }
    };
    rafRef.current = requestAnimationFrame(animCircle);
  }, [detectorCenterX, detectorCenterY, detectorRadius]);

  const startLanding = useCallback((flyId: number) => {
    if (!flyRef.current || flyRef.current.id !== flyId) return;
    flyRef.current = { ...flyRef.current, phase: 'landing' };
    setFly({ ...flyRef.current });

    const landAngle = Math.random() * Math.PI * 2;
    const landR = Math.random() * detectorRadius * 0.65;
    const landX = detectorCenterX + Math.cos(landAngle) * landR;
    const landY = detectorCenterY + Math.sin(landAngle) * landR;
    const startX = flyRef.current.x;
    const startY = flyRef.current.y;
    let t = 0;

    const animLand = () => {
      if (!flyRef.current || flyRef.current.id !== flyId || flyRef.current.phase === 'splatted') return;
      t = Math.min(t + 0.035, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      const updated: FlyState = {
        ...flyRef.current,
        x: startX + (landX - startX) * eased,
        y: startY + (landY - startY) * eased,
      };
      flyRef.current = updated;
      setFly({ ...updated });
      if (t < 1) {
        rafRef.current = requestAnimationFrame(animLand);
      } else {
        startCrawling(flyId, landX, landY);
      }
    };
    rafRef.current = requestAnimationFrame(animLand);
  }, [detectorCenterX, detectorCenterY, detectorRadius]);

  const startCrawling = useCallback((flyId: number, startX: number, startY: number) => {
    if (!flyRef.current || flyRef.current.id !== flyId) return;
    flyRef.current = { ...flyRef.current, phase: 'crawling' };
    setFly({ ...flyRef.current });

    let x = startX, y = startY;
    const crawlDuration = 2000 + Math.random() * 3000;
    const crawlStart = performance.now();

    const animCrawl = () => {
      if (!flyRef.current || flyRef.current.id !== flyId || flyRef.current.phase === 'splatted') return;
      const elapsed = performance.now() - crawlStart;
      x += (Math.random() - 0.5) * 1.8;
      y += (Math.random() - 0.5) * 1.8;

      // Keep on detector
      const dx = x - detectorCenterX;
      const dy = y - detectorCenterY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist > detectorRadius * 0.72) {
        x = detectorCenterX + (dx / dist) * detectorRadius * 0.68;
        y = detectorCenterY + (dy / dist) * detectorRadius * 0.68;
      }

      const updated: FlyState = {
        ...flyRef.current, x, y,
        rotation: flyRef.current.rotation + (Math.random() - 0.5) * 12,
      };
      flyRef.current = updated;
      setFly({ ...updated });

      if (elapsed < crawlDuration) {
        rafRef.current = requestAnimationFrame(animCrawl);
      } else {
        startExiting(flyId);
      }
    };
    rafRef.current = requestAnimationFrame(animCrawl);
  }, [detectorCenterX, detectorCenterY, detectorRadius]);

  const startExiting = useCallback((flyId: number) => {
    if (!flyRef.current || flyRef.current.id !== flyId) return;
    flyRef.current = { ...flyRef.current, phase: 'exiting' };
    setFly({ ...flyRef.current });

    const exit = getEdgePoint();
    const startX = flyRef.current.x;
    const startY = flyRef.current.y;
    const mid = {
      x: (startX + exit.x) / 2 + (Math.random() - 0.5) * 200,
      y: (startY + exit.y) / 2 + (Math.random() - 0.5) * 150,
    };
    let t = 0;
    const exitSpeed = 0.009 + Math.random() * 0.006;

    const animExit = () => {
      if (!flyRef.current || flyRef.current.id !== flyId) return;
      t = Math.min(t + exitSpeed, 1);
      const pos = bezier({ x: startX, y: startY }, mid, exit, t);
      const updated: FlyState = {
        ...flyRef.current,
        x: pos.x, y: pos.y,
        opacity: 1 - Math.pow(t, 2),
        rotation: flyRef.current.rotation + (Math.random() - 0.5) * 8,
      };
      flyRef.current = updated;
      setFly({ ...updated });
      if (t < 1) {
        rafRef.current = requestAnimationFrame(animExit);
      } else {
        flyRef.current = { ...flyRef.current, phase: 'dead' };
        setFly(null);
      }
    };
    rafRef.current = requestAnimationFrame(animExit);
  }, [getEdgePoint]);

  const splatFly = useCallback(() => {
    if (!flyRef.current || flyRef.current.phase === 'splatted' || flyRef.current.phase === 'dead') return;
    clearRaf();
    const splatX = flyRef.current.x;
    const splatY = flyRef.current.y;
    const splatId = flyRef.current.id;
    flyRef.current = { ...flyRef.current, phase: 'splatted' };
    setFly({ ...flyRef.current });
    setSplats(prev => [...prev, { id: splatId, x: splatX, y: splatY }]);
    onSplat();
    setTimeout(() => {
      flyRef.current = { ...flyRef.current!, phase: 'dead' };
      setFly(null);
    }, 500);
  }, [onSplat]);

  // Spawn cycle: first fly after 3s, then every 20s
  useEffect(() => {
    if (containerWidth === 0 || containerHeight === 0) return;

    spawnTimerRef.current = setTimeout(() => {
      spawnFly();
    }, 3000);

    spawnIntervalRef.current = setInterval(() => {
      const current = flyRef.current;
      if (!current || current.phase === 'dead' || current.phase === 'splatted') {
        spawnFly();
      }
    }, 20000);

    return () => {
      if (spawnTimerRef.current) clearTimeout(spawnTimerRef.current);
      if (spawnIntervalRef.current) clearInterval(spawnIntervalRef.current);
      clearRaf();
    };
  }, [containerWidth, containerHeight, spawnFly]);

  return { fly, splats, splatFly };
}
