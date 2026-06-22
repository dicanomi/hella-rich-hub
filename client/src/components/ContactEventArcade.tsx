/**
 * ContactEventArcade — HUMAN.EXE Act 8-9
 *
 * Simple canvas-based arcade game. Space Invaders / Galaga style.
 * Terminal green phosphor CRT aesthetic.
 *
 * Controls: ← → move, SPACE shoot
 * Player: NODE_1956 at bottom
 * Enemies: HOSTILE SIGNALS descending from top
 * Win: clear all enemies → scanner returns, alien rotates peacefully
 * Lose: enemies reach bottom → SYSTEM COMPROMISED, retry
 */
import { useEffect, useRef, useCallback, useState } from 'react';

interface ContactEventArcadeProps {
  onComplete: () => void; // called when player wins
  onExit: () => void;     // called when player exits
}

const G = '#33ff33';
const DIM = 'rgba(51,255,51,0.4)';
const FONT = "'Courier New', monospace";

// ── Game constants ────────────────────────────────────────────────────────
const PLAYER_W = 32;
const PLAYER_H = 20;
const BULLET_W = 3;
const BULLET_H = 12;
const ENEMY_W = 28;
const ENEMY_H = 20;
const ENEMY_COLS = 8;
const ENEMY_ROWS = 4;
const ENEMY_GAP_X = 52;
const ENEMY_GAP_Y = 36;
const ENEMY_SPEED_X = 1.2;
const ENEMY_DROP = 16;
const BULLET_SPEED = 8;
const ENEMY_BULLET_SPEED = 3.5;
const PLAYER_SPEED = 5;
const ENEMY_SHOOT_INTERVAL = 1200; // ms

interface Entity {
  x: number; y: number; w: number; h: number; alive: boolean;
}

interface Bullet {
  x: number; y: number; active: boolean; fromEnemy: boolean;
}

export function ContactEventArcade({ onComplete, onExit }: ContactEventArcadeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({
    player: { x: 0, y: 0 },
    enemies: [] as Entity[],
    bullets: [] as Bullet[],
    enemyDir: 1,
    keys: { left: false, right: false, space: false },
    lastShot: 0,
    lastEnemyShot: 0,
    score: 0,
    lives: 3,
    phase: 'playing' as 'playing' | 'win' | 'lose',
    animId: 0,
    lastTime: 0,
    canShoot: true,
  });
  const [phase, setPhase] = useState<'intro' | 'playing' | 'win' | 'lose'>('intro');
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [wave, setWave] = useState(1);

  const initGame = useCallback((canvas: HTMLCanvasElement) => {
    const s = stateRef.current;
    const W = canvas.width;
    const H = canvas.height;

    s.player = { x: W / 2 - PLAYER_W / 2, y: H - 50 };
    s.bullets = [];
    s.score = 0;
    s.lives = 3;
    s.phase = 'playing';
    s.enemyDir = 1;
    s.canShoot = true;

    // Build enemy grid
    const startX = (W - ENEMY_COLS * ENEMY_GAP_X) / 2;
    const startY = 60;
    s.enemies = [];
    for (let r = 0; r < ENEMY_ROWS; r++) {
      for (let c = 0; c < ENEMY_COLS; c++) {
        s.enemies.push({
          x: startX + c * ENEMY_GAP_X,
          y: startY + r * ENEMY_GAP_Y,
          w: ENEMY_W, h: ENEMY_H, alive: true,
        });
      }
    }
    setScore(0);
    setLives(3);
  }, []);

  const drawPlayer = (ctx: CanvasRenderingContext2D, x: number, y: number) => {
    ctx.strokeStyle = G;
    ctx.lineWidth = 1.5;
    // Ship shape: triangle with base
    ctx.beginPath();
    ctx.moveTo(x + PLAYER_W / 2, y);
    ctx.lineTo(x + PLAYER_W, y + PLAYER_H);
    ctx.lineTo(x + PLAYER_W * 0.7, y + PLAYER_H - 4);
    ctx.lineTo(x + PLAYER_W * 0.3, y + PLAYER_H - 4);
    ctx.lineTo(x, y + PLAYER_H);
    ctx.closePath();
    ctx.stroke();
    // Engine glow
    ctx.fillStyle = 'rgba(51,255,51,0.15)';
    ctx.fill();
    // Label
    ctx.fillStyle = G;
    ctx.font = `7px ${FONT}`;
    ctx.textAlign = 'center';
    ctx.fillText('N1956', x + PLAYER_W / 2, y + PLAYER_H + 10);
  };

  const drawEnemy = (ctx: CanvasRenderingContext2D, x: number, y: number, idx: number) => {
    ctx.strokeStyle = G;
    ctx.lineWidth = 1;
    // Simple alien glyph — diamond with legs
    const cx = x + ENEMY_W / 2;
    const cy = y + ENEMY_H / 2;
    ctx.beginPath();
    ctx.moveTo(cx, y);
    ctx.lineTo(x + ENEMY_W, cy);
    ctx.lineTo(cx, y + ENEMY_H);
    ctx.lineTo(x, cy);
    ctx.closePath();
    ctx.stroke();
    // Inner cross
    ctx.beginPath();
    ctx.moveTo(cx - 4, cy); ctx.lineTo(cx + 4, cy);
    ctx.moveTo(cx, cy - 4); ctx.lineTo(cx, cy + 4);
    ctx.stroke();
  };

  const gameLoop = useCallback((canvas: HTMLCanvasElement) => {
    const ctx = canvas.getContext('2d')!;
    const W = canvas.width;
    const H = canvas.height;
    const s = stateRef.current;

    const loop = (time: number) => {
      if (s.phase !== 'playing') return;
      const dt = Math.min(time - s.lastTime, 50);
      s.lastTime = time;

      // ── Update player ──
      if (s.keys.left) s.player.x = Math.max(0, s.player.x - PLAYER_SPEED);
      if (s.keys.right) s.player.x = Math.min(W - PLAYER_W, s.player.x + PLAYER_SPEED);

      // ── Player shoot ──
      if (s.keys.space && s.canShoot && time - s.lastShot > 300) {
        s.bullets.push({
          x: s.player.x + PLAYER_W / 2 - BULLET_W / 2,
          y: s.player.y,
          active: true,
          fromEnemy: false,
        });
        s.lastShot = time;
        s.canShoot = false;
      }
      if (!s.keys.space) s.canShoot = true;

      // ── Enemy shoot ──
      if (time - s.lastEnemyShot > ENEMY_SHOOT_INTERVAL) {
        const alive = s.enemies.filter(e => e.alive);
        if (alive.length > 0) {
          const shooter = alive[Math.floor(Math.random() * alive.length)];
          s.bullets.push({
            x: shooter.x + ENEMY_W / 2,
            y: shooter.y + ENEMY_H,
            active: true,
            fromEnemy: true,
          });
        }
        s.lastEnemyShot = time;
      }

      // ── Move bullets ──
      s.bullets.forEach(b => {
        if (!b.active) return;
        b.y += b.fromEnemy ? ENEMY_BULLET_SPEED : -BULLET_SPEED;
        if (b.y < -20 || b.y > H + 20) b.active = false;
      });

      // ── Move enemies ──
      const alive = s.enemies.filter(e => e.alive);
      let hitWall = false;
      alive.forEach(e => {
        e.x += ENEMY_SPEED_X * s.enemyDir;
        if (e.x <= 0 || e.x + ENEMY_W >= W) hitWall = true;
      });
      if (hitWall) {
        s.enemyDir *= -1;
        alive.forEach(e => { e.y += ENEMY_DROP; });
      }

      // ── Collision: player bullets vs enemies ──
      s.bullets.filter(b => b.active && !b.fromEnemy).forEach(b => {
        s.enemies.forEach(e => {
          if (!e.alive) return;
          if (b.x < e.x + e.w && b.x + BULLET_W > e.x &&
              b.y < e.y + e.h && b.y + BULLET_H > e.y) {
            e.alive = false;
            b.active = false;
            s.score += 10;
            setScore(s.score);
          }
        });
      });

      // ── Collision: enemy bullets vs player ──
      s.bullets.filter(b => b.active && b.fromEnemy).forEach(b => {
        if (b.x < s.player.x + PLAYER_W && b.x + BULLET_W > s.player.x &&
            b.y < s.player.y + PLAYER_H && b.y + BULLET_H > s.player.y) {
          b.active = false;
          s.lives -= 1;
          setLives(s.lives);
          if (s.lives <= 0) {
            s.phase = 'lose';
            setPhase('lose');
            return;
          }
          // Reset player position
          s.player.x = W / 2 - PLAYER_W / 2;
        }
      });

      // ── Check win ──
      if (s.enemies.every(e => !e.alive)) {
        s.phase = 'win';
        setPhase('win');
        setTimeout(() => onComplete(), 1500);
        return;
      }

      // ── Check lose: enemies reach player ──
      if (alive.some(e => e.y + e.h >= s.player.y)) {
        s.phase = 'lose';
        setPhase('lose');
        return;
      }

      // ── Draw ──
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = '#010601';
      ctx.fillRect(0, 0, W, H);

      // Scanlines
      ctx.fillStyle = 'rgba(0,0,0,0.08)';
      for (let y = 0; y < H; y += 4) ctx.fillRect(0, y, W, 2);

      // Score / lives
      ctx.fillStyle = G;
      ctx.font = `10px ${FONT}`;
      ctx.textAlign = 'left';
      ctx.fillText(`SCORE: ${s.score}`, 8, 16);
      ctx.textAlign = 'right';
      ctx.fillText(`LIVES: ${'▮'.repeat(s.lives)}`, W - 8, 16);
      ctx.textAlign = 'center';
      ctx.fillStyle = 'rgba(51,255,51,0.3)';
      ctx.fillText('HOSTILE SIGNALS INBOUND', W / 2, 16);

      // Enemies
      s.enemies.forEach((e, i) => {
        if (e.alive) drawEnemy(ctx, e.x, e.y, i);
      });

      // Player
      drawPlayer(ctx, s.player.x, s.player.y);

      // Bullets
      s.bullets.forEach(b => {
        if (!b.active) return;
        ctx.fillStyle = b.fromEnemy ? 'rgba(51,255,51,0.6)' : G;
        ctx.fillRect(b.x, b.y, BULLET_W, BULLET_H);
      });

      // Bottom line
      ctx.strokeStyle = 'rgba(51,255,51,0.2)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, H - 30); ctx.lineTo(W, H - 30);
      ctx.stroke();

      s.animId = requestAnimationFrame(loop);
    };

    s.lastTime = performance.now();
    s.animId = requestAnimationFrame(loop);
  }, [onComplete]);

  // ── Setup ──────────────────────────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || phase !== 'playing') return;

    initGame(canvas);
    gameLoop(canvas);

    const onKey = (e: KeyboardEvent) => {
      const s = stateRef.current;
      if (e.key === 'ArrowLeft')  s.keys.left  = e.type === 'keydown';
      if (e.key === 'ArrowRight') s.keys.right = e.type === 'keydown';
      if (e.key === ' ')          s.keys.space = e.type === 'keydown';
      if (e.key === 'Escape' && e.type === 'keydown') onExit();
      if (e.type === 'keydown' && e.key !== 'Escape') e.preventDefault();
    };

    window.addEventListener('keydown', onKey);
    window.addEventListener('keyup', onKey);

    return () => {
      cancelAnimationFrame(stateRef.current.animId);
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('keyup', onKey);
    };
  }, [phase, initGame, gameLoop]);

  // ── Render ─────────────────────────────────────────────────────────────
  const containerStyle: React.CSSProperties = {
    position: 'fixed', inset: 0,
    background: '#010601',
    display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center',
    fontFamily: FONT,
    zIndex: 1000,
  };

  if (phase === 'intro') {
    return (
      <div style={containerStyle}>
        <div style={{ textAlign: 'center', maxWidth: '480px', padding: '24px' }}>
          <div style={{ color: G, fontSize: 'clamp(11px,1.2vw,14px)', letterSpacing: '0.3em', marginBottom: '24px' }}>
            TERMINAL OVERRIDE ACTIVE
          </div>
          <pre style={{ color: 'rgba(51,255,51,0.5)', fontSize: 'clamp(8px,0.8vw,10px)', lineHeight: 1.8, margin: '0 0 24px' }}>
{`DEFENSIVE SYSTEMS ONLINE
NODE_1956 ENGAGED
HOSTILE SIGNALS INBOUND
THE MACHINE NEEDS ASSISTANCE`}
          </pre>
          <div style={{ color: G, fontSize: 'clamp(9px,1vw,12px)', letterSpacing: '0.2em', marginBottom: '32px', animation: 'cursorBlink 0.7s steps(1) infinite' }}>
            PRESS ENTER TO DEFEND NODE_1956
          </div>
          <div style={{ color: 'rgba(51,255,51,0.35)', fontSize: '9px', letterSpacing: '0.15em', lineHeight: 2 }}>
            ← → MOVE &nbsp;&nbsp; SPACE FIRE
          </div>
          <button
            onClick={() => setPhase('playing')}
            style={{
              marginTop: '24px',
              background: 'none',
              border: `1px solid ${G}`,
              color: G,
              fontFamily: FONT,
              fontSize: '11px',
              letterSpacing: '0.3em',
              padding: '10px 24px',
              cursor: 'pointer',
            }}
          >
            [ ENGAGE ]
          </button>
          <div style={{ marginTop: '12px' }}>
            <button
              onClick={onExit}
              style={{
                background: 'none', border: 'none',
                color: 'rgba(51,255,51,0.3)',
                fontFamily: FONT, fontSize: '9px',
                letterSpacing: '0.2em', cursor: 'pointer',
              }}
            >
              RETURN TO HELLA.RICH
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (phase === 'lose') {
    return (
      <div style={containerStyle}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ color: G, fontSize: 'clamp(14px,2vw,22px)', letterSpacing: '0.3em', marginBottom: '16px' }}>
            SYSTEM COMPROMISED
          </div>
          <div style={{ color: 'rgba(51,255,51,0.5)', fontSize: '10px', letterSpacing: '0.2em', marginBottom: '24px' }}>
            SCORE: {score}
          </div>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
            <button
              onClick={() => { stateRef.current.phase = 'playing'; setPhase('playing'); }}
              style={{ background: 'none', border: `1px solid ${G}`, color: G, fontFamily: FONT, fontSize: '10px', letterSpacing: '0.2em', padding: '8px 16px', cursor: 'pointer' }}
            >
              [ RESTART CONTACT EVENT ]
            </button>
            <button
              onClick={onExit}
              style={{ background: 'none', border: 'none', color: 'rgba(51,255,51,0.4)', fontFamily: FONT, fontSize: '10px', letterSpacing: '0.2em', cursor: 'pointer' }}
            >
              RETURN TO HELLA.RICH
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (phase === 'win') {
    return (
      <div style={containerStyle}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ color: G, fontSize: 'clamp(12px,1.5vw,18px)', letterSpacing: '0.3em', marginBottom: '8px' }}>
            CONTACT COMPLETE
          </div>
          <div style={{ color: 'rgba(51,255,51,0.5)', fontSize: '10px', letterSpacing: '0.2em' }}>
            IDENTITY VERIFIED — RETURNING TO SCANNER
          </div>
        </div>
      </div>
    );
  }

  // Playing
  return (
    <div style={containerStyle}>
      <canvas
        ref={canvasRef}
        width={Math.min(window.innerWidth - 32, 640)}
        height={Math.min(window.innerHeight - 80, 520)}
        style={{ border: `1px solid rgba(51,255,51,0.3)`, imageRendering: 'pixelated' }}
      />
      <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', maxWidth: `${Math.min(window.innerWidth - 32, 640)}px`, fontFamily: FONT }}>
        <div style={{ color: 'rgba(51,255,51,0.35)', fontSize: '9px', letterSpacing: '0.15em' }}>← → MOVE &nbsp; SPACE FIRE</div>
        <button
          onClick={onExit}
          style={{
            background: 'none',
            border: '1px solid rgba(51,255,51,0.4)',
            color: 'rgba(51,255,51,0.7)',
            fontFamily: FONT,
            fontSize: '9px',
            letterSpacing: '0.2em',
            padding: '4px 10px',
            cursor: 'pointer',
          }}
        >
          [ RETURN TO SCAN ] ESC
        </button>
      </div>
    </div>
  );
}
