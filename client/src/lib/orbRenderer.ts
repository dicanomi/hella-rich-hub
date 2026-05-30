// ORB WebGL Renderer — Premium Redesign
// Deep liquid plasma interior, glossy glass surface, caustic floor, environment reflections
// The orb must feel: alive, beautiful, tactile, mysterious

export interface OrbRenderState {
  liquidColor: [number, number, number];
  rimColor: [number, number, number];
  turbulenceSpeed: number;
  turbulenceScale: number;
  rotationSpeed: number;
  glowIntensity: number;
  touchX: number;
  touchY: number;
  touchPressure: number;
  interactionIntensity: number;
  progressionLevel: number; // 0-1, hidden progression
}

const VERTEX_SHADER = `
  attribute vec2 a_position;
  varying vec2 v_uv;
  void main() {
    v_uv = a_position * 0.5 + 0.5;
    gl_Position = vec4(a_position, 0.0, 1.0);
  }
`;

// Premium liquid glass orb shader
// Key techniques:
// - Simplex-like FBM with 6 octaves + domain warping for liquid depth
// - Multi-layer plasma: convection currents + fine turbulence + wisps
// - Fresnel glass with chromatic aberration and environment-like reflections
// - Warm amber internal light source (bottom) + cool key light (top-left)
// - Subsurface scattering approximation
// - Caustic floor projection
const FRAGMENT_SHADER = `
  precision highp float;
  varying vec2 v_uv;

  uniform float u_time;
  uniform vec2 u_resolution;
  uniform vec3 u_liquidColor;
  uniform vec3 u_rimColor;
  uniform float u_turbulenceSpeed;
  uniform float u_turbulenceScale;
  uniform float u_rotationSpeed;
  uniform float u_glowIntensity;
  uniform vec2 u_touch;
  uniform float u_touchPressure;
  uniform float u_interactionIntensity;
  uniform float u_progressionLevel;

  // ============================================================
  // NOISE — Simplex 3D (Ashima Arts)
  // ============================================================
  vec3 mod289v3(vec3 x) { return x - floor(x*(1./289.))*289.; }
  vec4 mod289v4(vec4 x) { return x - floor(x*(1./289.))*289.; }
  vec4 permute4(vec4 x) { return mod289v4(((x*34.)+1.)*x); }
  vec4 taylorInvSqrt4(vec4 r) { return 1.79284291400159 - 0.85373472095314*r; }

  float snoise(vec3 v) {
    const vec2 C = vec2(1./6., 1./3.);
    vec3 i = floor(v + dot(v, C.yyy));
    vec3 x0 = v - i + dot(i, C.xxx);
    vec3 g = step(x0.yzx, x0.xyz);
    vec3 l = 1. - g;
    vec3 i1 = min(g.xyz, l.zxy);
    vec3 i2 = max(g.xyz, l.zxy);
    vec3 x1 = x0 - i1 + C.xxx;
    vec3 x2 = x0 - i2 + C.yyy;
    vec3 x3 = x0 - .5;
    i = mod289v3(i);
    vec4 p = permute4(permute4(permute4(
      i.z+vec4(0.,i1.z,i2.z,1.))
      +i.y+vec4(0.,i1.y,i2.y,1.))
      +i.x+vec4(0.,i1.x,i2.x,1.));
    vec3 ns = 0.142857142857*vec3(2,-1,-1) - vec3(1,0,1)*0.142857142857;
    vec4 j = p - 49.*floor(p*(1./49.));
    vec4 x_ = floor(j*(1./7.));
    vec4 y_ = floor(j - 7.*x_);
    vec4 x = x_*(2./7.) + ns.yyyy;
    vec4 y = y_*(2./7.) + ns.yyyy;
    vec4 h = 1. - abs(x) - abs(y);
    vec4 b0 = vec4(x.xy, y.xy);
    vec4 b1 = vec4(x.zw, y.zw);
    vec4 s0 = floor(b0)*2.+1.;
    vec4 s1 = floor(b1)*2.+1.;
    vec4 sh = -step(h, vec4(0.));
    vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy;
    vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww;
    vec3 p0 = vec3(a0.xy, h.x);
    vec3 p1 = vec3(a0.zw, h.y);
    vec3 p2 = vec3(a1.xy, h.z);
    vec3 p3 = vec3(a1.zw, h.w);
    vec4 norm = taylorInvSqrt4(vec4(dot(p0,p0),dot(p1,p1),dot(p2,p2),dot(p3,p3)));
    p0*=norm.x; p1*=norm.y; p2*=norm.z; p3*=norm.w;
    vec4 m = max(.6-vec4(dot(x0,x0),dot(x1,x1),dot(x2,x2),dot(x3,x3)),0.);
    m = m*m;
    return 42.*dot(m*m, vec4(dot(p0,x0),dot(p1,x1),dot(p2,x2),dot(p3,x3)));
  }

  // FBM with domain warping — the key to organic liquid
  float fbm(vec3 p, int oct) {
    float v=0., a=.5, f=1.;
    // Use 1.9 lacunarity (vs 2.0) for slightly smoother result
    for(int i=0;i<8;i++){
      if(i>=oct) break;
      v += a*(snoise(p*f)*.5+.5);
      a*=.48; f*=1.92;
    }
    return v;
  }

  // Double-warp FBM — creates folding, drifting, smoky liquid
  // Warp amounts are kept low to preserve smooth, premium look
  float warpedFbm(vec3 p, float t) {
    // First warp pass — gentle
    vec3 q = vec3(
      fbm(p + vec3(0.0, 0.0, t*0.3), 3),
      fbm(p + vec3(5.2, 1.3, t*0.25), 3),
      fbm(p + vec3(2.8, 7.1, t*0.28), 3)
    );
    // Second warp pass — subtle folding
    vec3 r = vec3(
      fbm(p + 0.9*q + vec3(1.7, 9.2, t*0.15), 3),
      fbm(p + 0.9*q + vec3(8.3, 2.8, t*0.18), 3),
      fbm(p + 0.9*q + vec3(4.1, 6.5, t*0.12), 3)
    );
    return fbm(p + 1.2*r, 4);
  }

  // Rotation matrices
  mat3 rotY(float a){ float c=cos(a),s=sin(a); return mat3(c,0,s,0,1,0,-s,0,c); }
  mat3 rotX(float a){ float c=cos(a),s=sin(a); return mat3(1,0,0,0,c,-s,0,s,c); }
  mat3 rotZ(float a){ float c=cos(a),s=sin(a); return mat3(c,-s,0,s,c,0,0,0,1); }

  // Environment map — cinematic cosmic environment
  // Simulates: top light source + warm amber below + cool space ambient
  vec3 envMap(vec3 r) {
    float up = max(0., r.y);
    float down = max(0., -r.y);
    float side = 1. - abs(r.y);
    // Top: soft white-blue cinematic spotlight
    vec3 topEnv = vec3(0.88, 0.92, 1.0) * pow(up, 1.8) * 0.65;
    // Bottom: warm amber glow
    vec3 bottomEnv = vec3(0.95, 0.72, 0.28) * pow(down, 2.0) * 0.45;
    // Side: very dark cosmic ambient
    vec3 sideEnv = vec3(0.08, 0.08, 0.12) * side * 0.2;
    return topEnv + bottomEnv + sideEnv;
  }

  void main() {
    vec2 uv = (v_uv - 0.5) * 2.0;
    float aspect = u_resolution.x / u_resolution.y;
    uv.x *= aspect;

    float radius = 0.55; // reduced ~21% for cinematic breathing room
    float dist = length(uv);

    // ---- BACKGROUND ---- pure cinematic black
    vec3 bgColor = vec3(0.024, 0.024, 0.032);
    if (dist > radius + 0.06) {
      gl_FragColor = vec4(bgColor, 1.0);
      return;
    }

    // Edge blend factor — used to mix orb into background (NOT alpha)
    // This renders entirely inside the shader so there is NO alpha ring
    float edgeBlend = 1.0 - smoothstep(radius * 0.88, radius + 0.06, dist);
    // edgeAA is 1.0 inside orb, fades to 0 at edge
    // We'll use this to mix finalColor with bgColor at the end
    float edgeAA = edgeBlend;

    // 3D sphere surface
    float z = sqrt(max(0.0, radius*radius - dot(uv,uv)));
    vec3 pos = normalize(vec3(uv, z));
    vec3 normal = pos;
    vec3 viewDir = vec3(0.0, 0.0, 1.0);

    // ---- ROTATION ----
    // Slow organic rotation with subtle wobble
    float rotTime = u_time * u_rotationSpeed * 0.22;
    float wobbleX = sin(u_time * 0.13) * 0.08;
    float wobbleZ = cos(u_time * 0.09) * 0.05;
    // Touch-driven rotation
    float touchRotY = u_touch.x * u_interactionIntensity * 1.5;
    float touchRotX = u_touch.y * u_interactionIntensity * 0.8;

    mat3 rot = rotY(rotTime + touchRotY) * rotX(wobbleX + touchRotX) * rotZ(wobbleZ);
    vec3 rotPos = rot * pos;

    // ---- TOUCH DISTORTION ----
    vec2 touchDelta = (uv / radius) - u_touch;
    float touchDist = length(touchDelta);
    float touchInfluence = exp(-touchDist * touchDist * 2.2) * u_touchPressure * u_interactionIntensity;
    float touchRipple = sin(touchDist * 8.0 - u_time * 4.0) * touchInfluence * 0.15;

    // ---- LIQUID INTERIOR ----
    float t = u_time * u_turbulenceSpeed;
    vec3 liquidPos = rotPos * u_turbulenceScale;

    // Layer 1: Large slow convection currents (the "body" of the liquid)
    // Scale down for smoother, more premium look
    float convection = warpedFbm(liquidPos * 0.55 + vec3(t*0.10, t*0.07, t*0.05), t);

    // Layer 2: Medium plasma wisps
    vec3 wispPos = liquidPos * 1.1 + vec3(t*0.18, -t*0.14, t*0.11);
    float wisps = fbm(wispPos + vec3(convection * 1.2), 4);

    // Layer 3: Fine detail (subtle, not dominant)
    vec3 turbPos = liquidPos * 2.0 + vec3(-t*0.25, t*0.20, -t*0.15);
    float turbulence = fbm(turbPos + vec3(wisps * 0.6, convection * 0.4, 0.0), 3);

    // Layer 4: Slow energy pulse (the "heartbeat")
    float pulse = sin(u_time * 0.7 + convection * 2.8) * 0.5 + 0.5;
    pulse = pow(pulse, 4.0) * 0.25;

    // Touch ripple injection
    float touchSwirl = sin(atan(touchDelta.y, touchDelta.x + 0.001) * 3.0 - u_time * 2.5)
                       * exp(-touchDist * 3.0) * touchInfluence * 0.5;

    // Combine all liquid layers — convection dominates for smooth look
    float liquid = convection * 0.52 + wisps * 0.28 + turbulence * 0.10 + pulse + touchSwirl;
    liquid += touchRipple;
    liquid = clamp(liquid, 0.0, 1.0);

    // ---- LIQUID COLOR MAPPING ----
    // Cinematic palette: warm gold / soft white / cold blue / rare strange
    vec3 warmGold   = vec3(0.95, 0.75, 0.30);
    vec3 warmAmber  = vec3(0.88, 0.58, 0.18);
    vec3 softWhite  = vec3(0.92, 0.90, 0.88);
    vec3 coolBlue   = u_liquidColor;
    vec3 deepCore   = u_liquidColor * 0.18 + vec3(0.02, 0.02, 0.04);
    vec3 brightPeak = u_liquidColor * 1.6 + vec3(0.30, 0.22, 0.08);

    // Base: deep dark core → liquid color → bright peaks
    vec3 liquidColor = mix(deepCore, coolBlue * 0.7, smoothstep(0.0, 0.45, liquid));
    liquidColor = mix(liquidColor, coolBlue, smoothstep(0.35, 0.65, liquid));
    liquidColor = mix(liquidColor, brightPeak, smoothstep(0.60, 0.88, liquid) * 0.75);

    // Plasma veins — bright white-gold streaks
    float vein = pow(max(0.0, wisps - 0.58) / 0.42, 2.2);
    liquidColor += mix(softWhite, warmGold, 0.4) * vein * 0.9;

    // ---- INTERNAL LIGHTING ----
    // Primary: soft upper-left ambient (no harsh spotlight)
    // Light comes from the environment, not a single source
    vec3 topLight = normalize(vec3(-0.3, 0.6, 0.74));
    float topDot = max(0.0, dot(normal, topLight));
    float topGlow = pow(topDot, 2.5) * 0.45 * u_glowIntensity;
    liquidColor += mix(softWhite, coolBlue, 0.5) * topGlow * 0.5;

    // Secondary: warm amber from bottom (the internal fire)
    vec3 bottomLight = normalize(vec3(0.08, -0.72, 0.69));
    float bottomDot = max(0.0, dot(normal, bottomLight));
    float bottomGlow = pow(bottomDot, 1.6) * 0.85 * u_glowIntensity;
    liquidColor += mix(warmAmber, warmGold, 0.5) * bottomGlow;

    // Warm deep pocket in lower hemisphere (amber warmth)
    float bottomPocket = max(0.0, -pos.y * 0.85 + 0.12);
    liquidColor += warmAmber * bottomPocket * 0.40 * u_glowIntensity;

    // Cool blue accent from upper-left (rim fill)
    vec3 rimFillDir = normalize(vec3(-0.6, 0.55, 0.58));
    float rimFillDot = max(0.0, dot(normal, rimFillDir));
    float rimFillGlow = pow(rimFillDot, 3.0) * 0.35 * u_glowIntensity;
    liquidColor += coolBlue * rimFillGlow * 0.6;

    // Touch warmth — pressing warms the liquid to gold
    liquidColor += warmGold * touchInfluence * 1.1;

    // Progression level — unlocks deeper, stranger colors
    vec3 progressColor = mix(vec3(0.45, 0.12, 0.72), vec3(0.12, 0.65, 0.95), sin(u_time * 0.28) * 0.5 + 0.5);
    liquidColor = mix(liquidColor, liquidColor + progressColor * 0.35, u_progressionLevel * liquid);

    // Subsurface scattering — light bleeds through glass
    float sss = pow(max(0.0, dot(normal, vec3(0.0, 0.12, 0.993))), 2.8) * 0.55;
    liquidColor += mix(coolBlue, softWhite, 0.35) * sss * 0.45;

    // ---- GLASS SURFACE ----
    float cosTheta = max(0.0, dot(normal, viewDir));
    // Gentle Fresnel — just enough for glass feel, not a dark ring
    float fresnel = pow(1.0 - cosTheta, 4.5);
    float fresnelMid = pow(1.0 - cosTheta, 2.2) * 0.20;
    // NO inner shadow — that was causing the dark ring
    float innerShadow = 0.0;

    // Reflection vector for environment map
    vec3 reflectDir = reflect(-viewDir, normal);
    vec3 envColor = envMap(reflectDir);
    vec3 rimReflection = envColor * fresnel * 0.9;

    // Soft ambient specular — upper-left (no harsh spotlight)
    // Think: diffuse room light, not a stage light
    vec3 keyLight = normalize(vec3(-0.45, 0.55, 0.70));
    vec3 halfKey = normalize(viewDir + keyLight);
    float specKey = pow(max(0.0, dot(normal, halfKey)), 80.0) * 0.45;

    // Right fill — very soft, barely visible
    vec3 fillLight2 = normalize(vec3(0.5, 0.3, 0.82));
    vec3 halfFill2 = normalize(viewDir + fillLight2);
    float specFill2 = pow(max(0.0, dot(normal, halfFill2)), 60.0) * 0.20;

    // Bottom specular — warm amber from below (the internal glow)
    vec3 halfBottom = normalize(viewDir + bottomLight);
    float specBottom = pow(max(0.0, dot(normal, halfBottom)), 35.0) * 0.30 * u_glowIntensity;

    // Touch specular — interactive highlight
    vec3 touchLightDir = normalize(vec3(u_touch.x, u_touch.y, 0.72));
    vec3 halfTouch = normalize(viewDir + touchLightDir);
    float specTouch = pow(max(0.0, dot(normal, halfTouch)), 80.0) * u_touchPressure * u_interactionIntensity * 0.7;

    // Specular colors — no bright white, just soft tinted reflections
    vec3 specColor = vec3(0.88, 0.90, 0.95) * (specKey + specFill2)
                   + warmAmber * specBottom
                   + vec3(0.9, 0.88, 0.85) * specTouch;

    // ---- FINAL COMPOSITE ----
    // NO edge darkening, NO inner shadow, NO dark glass transparency
    // The orb is luminous all the way to its edge

    // Very subtle depth gradient — just enough to feel spherical
    float depthGrad = 0.85 + 0.15 * (1.0 - pow(dist / radius, 2.0));

    // Rim luminosity — edge glows with liquid color (no dark ring)
    float rimLuminosity = pow(fresnel, 3.0) * u_glowIntensity * 0.45;
    vec3 rimGlow = mix(u_liquidColor, u_rimColor, 0.5) * rimLuminosity;

    vec3 finalColor = liquidColor * depthGrad;
    // Rim glow
    finalColor += rimGlow;
    // Environment reflections
    finalColor += rimReflection * 0.6;
    finalColor += u_rimColor * fresnelMid * 0.20;
    finalColor += specColor;

    // Chromatic aberration at rim (glass dispersion)
    float ca = fresnel * 0.020;
    finalColor.r = clamp(finalColor.r + ca * 0.5, 0.0, 1.5);
    finalColor.b = clamp(finalColor.b - ca * 0.35, 0.0, 1.5);

    // Filmic tone mapping
    finalColor = finalColor * (1.0 + finalColor * 0.16) / (finalColor + vec3(0.88));
    finalColor = pow(max(finalColor, vec3(0.0)), vec3(0.84));

    // Mix orb color with background — fully opaque, no alpha ring
    // The edge dissolves by blending with bg color, not by going transparent
    vec3 outputColor = mix(bgColor, finalColor, edgeAA);
    gl_FragColor = vec4(clamp(outputColor, 0.0, 1.0), 1.0);
  }
`;

// Particle shaders — luminous flecks inside the orb
const PARTICLE_VERTEX = `
  attribute vec2 a_position;
  attribute float a_size;
  attribute float a_alpha;
  attribute vec3 a_color;
  uniform vec2 u_resolution;
  varying float v_alpha;
  varying vec3 v_color;
  void main() {
    v_alpha = a_alpha;
    v_color = a_color;
    vec2 pos = a_position;
    pos.x *= u_resolution.y / u_resolution.x;
    gl_Position = vec4(pos, 0.0, 1.0);
    gl_PointSize = a_size;
  }
`;

const PARTICLE_FRAGMENT = `
  precision mediump float;
  varying float v_alpha;
  varying vec3 v_color;
  void main() {
    vec2 c = gl_PointCoord - 0.5;
    float d = length(c);
    // Soft glow with bright core
    float core = exp(-d * d * 20.0) * 0.8;
    float halo = (1.0 - smoothstep(0.2, 0.5, d)) * 0.4;
    float alpha = (core + halo) * v_alpha;
    gl_FragColor = vec4(v_color + core * 0.4, alpha);
  }
`;

interface Particle {
  x: number; y: number;
  vx: number; vy: number;
  size: number;
  alpha: number; targetAlpha: number;
  life: number; maxLife: number;
  angle: number; orbitRadius: number; orbitSpeed: number;
  phase: number;
  colorWarm: number; // 0=cool, 1=warm
}

export class OrbRenderer {
  private canvas: HTMLCanvasElement;
  private gl: WebGLRenderingContext;
  private program: WebGLProgram;
  private particleProgram: WebGLProgram;
  private particles: Particle[] = [];
  private startTime: number;
  private state: OrbRenderState;
  private targetState: OrbRenderState;
  private uniforms: Record<string, WebGLUniformLocation | null> = {};
  private pUniforms: Record<string, WebGLUniformLocation | null> = {};
  private quadBuf: WebGLBuffer | null = null;
  private pPosBuf: WebGLBuffer | null = null;
  private pSizeBuf: WebGLBuffer | null = null;
  private pAlphaBuf: WebGLBuffer | null = null;
  private pColorBuf: WebGLBuffer | null = null;
  private lastTime = 0;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    // alpha: false — canvas is opaque, background rendered inside shader
    // This eliminates the dark ring from alpha blending with HTML background
    const gl = canvas.getContext('webgl', { antialias: true, alpha: false, premultipliedAlpha: false });
    if (!gl) throw new Error('WebGL not supported');
    this.gl = gl;

    this.program = this.mkProgram(VERTEX_SHADER, FRAGMENT_SHADER);
    this.particleProgram = this.mkProgram(PARTICLE_VERTEX, PARTICLE_FRAGMENT);
    this.startTime = performance.now();

    const def: OrbRenderState = {
      liquidColor: [0.78, 0.82, 0.90],
      rimColor: [0.92, 0.95, 1.0],
      turbulenceSpeed: 0.18,
      turbulenceScale: 1.0,
      rotationSpeed: 0.4,
      glowIntensity: 0.75,
      touchX: 0, touchY: 0, touchPressure: 0, interactionIntensity: 0,
      progressionLevel: 0,
    };
    this.state = { ...def };
    this.targetState = { ...def };

    this.initBuffers();
    this.initUniforms();
    this.spawnParticles(80);

    // Blend only for particles (additive)
    // Main orb program uses opaque output — no blend needed
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
  }

  private mkShader(type: number, src: string): WebGLShader {
    const gl = this.gl, s = gl.createShader(type)!;
    gl.shaderSource(s, src); gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
      const e = gl.getShaderInfoLog(s); gl.deleteShader(s);
      throw new Error('Shader: ' + e);
    }
    return s;
  }

  private mkProgram(vs: string, fs: string): WebGLProgram {
    const gl = this.gl, p = gl.createProgram()!;
    gl.attachShader(p, this.mkShader(gl.VERTEX_SHADER, vs));
    gl.attachShader(p, this.mkShader(gl.FRAGMENT_SHADER, fs));
    gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS))
      throw new Error('Program: ' + gl.getProgramInfoLog(p));
    return p;
  }

  private initBuffers() {
    const gl = this.gl;
    this.quadBuf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.quadBuf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1,1,-1,-1,1,1,1]), gl.STATIC_DRAW);
    this.pPosBuf = gl.createBuffer();
    this.pSizeBuf = gl.createBuffer();
    this.pAlphaBuf = gl.createBuffer();
    this.pColorBuf = gl.createBuffer();
  }

  private initUniforms() {
    const gl = this.gl;
    gl.useProgram(this.program);
    for (const n of ['u_time','u_resolution','u_liquidColor','u_rimColor','u_turbulenceSpeed',
      'u_turbulenceScale','u_rotationSpeed','u_glowIntensity','u_touch','u_touchPressure',
      'u_interactionIntensity','u_progressionLevel']) {
      this.uniforms[n] = gl.getUniformLocation(this.program, n);
    }
    gl.useProgram(this.particleProgram);
    this.pUniforms['u_resolution'] = gl.getUniformLocation(this.particleProgram, 'u_resolution');
  }

  private spawnParticles(count: number) {
    this.particles = [];
    for (let i = 0; i < count; i++) this.particles.push(this.newParticle());
  }

  private newParticle(): Particle {
    const angle = Math.random() * Math.PI * 2;
    const r = 0.06 + Math.random() * 0.60;
    return {
      x: Math.cos(angle) * r, y: Math.sin(angle) * r * 0.88,
      vx: (Math.random() - 0.5) * 0.003, vy: (Math.random() - 0.5) * 0.003,
      size: 0.7 + Math.random() * 3.2,
      alpha: 0, targetAlpha: 0.06 + Math.random() * 0.65,
      life: Math.random() * 200, maxLife: 100 + Math.random() * 250,
      angle, orbitRadius: r, orbitSpeed: (Math.random() - 0.5) * 0.008,
      phase: Math.random() * Math.PI * 2,
      colorWarm: Math.random(),
    };
  }

  private updateParticles(dt: number, mode: string, tx: number, ty: number, pressure: number) {
    const maxR = 0.70;
    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];
      p.life += dt * 55;
      const lr = p.life / p.maxLife;
      p.alpha = lr < 0.12 ? (lr / 0.12) * p.targetAlpha
              : lr > 0.78 ? ((1 - lr) / 0.22) * p.targetAlpha
              : p.targetAlpha;
      if (p.life > p.maxLife) { this.particles[i] = this.newParticle(); continue; }

      switch (mode) {
        case 'drift': {
          p.angle += p.orbitSpeed;
          const wave = Math.sin(p.life * 0.016 + p.phase) * 0.0035;
          p.orbitRadius = Math.max(0.04, Math.min(0.64, p.orbitRadius + wave));
          // Slow vertical drift
          p.y += Math.sin(p.life * 0.012 + p.phase) * 0.0008;
          p.x = Math.cos(p.angle) * p.orbitRadius;
          const d0 = Math.hypot(p.x, p.y);
          if (d0 > maxR) { p.x *= maxR/d0; p.y *= maxR/d0; }
          break;
        }
        case 'swarm': {
          const dx = tx*0.42 - p.x, dy = ty*0.42 - p.y;
          p.vx += dx * 0.005 * pressure; p.vy += dy * 0.005 * pressure;
          p.vx *= 0.93; p.vy *= 0.93;
          p.x += p.vx; p.y += p.vy;
          const d = Math.hypot(p.x, p.y);
          if (d > maxR) { p.x *= maxR/d; p.y *= maxR/d; }
          break;
        }
        case 'scatter': {
          p.vx += (Math.random()-0.5)*0.007; p.vy += (Math.random()-0.5)*0.007;
          p.vx *= 0.90; p.vy *= 0.90;
          p.x += p.vx; p.y += p.vy;
          const d = Math.hypot(p.x, p.y);
          if (d > maxR) { p.vx *= -0.3; p.vy *= -0.3; p.x *= 0.86; p.y *= 0.86; }
          break;
        }
        case 'orbit': {
          p.angle += p.orbitSpeed * 2.0;
          p.x = Math.cos(p.angle) * p.orbitRadius;
          p.y = Math.sin(p.angle) * p.orbitRadius;
          break;
        }
        case 'flee': {
          const dx = p.x - tx*0.42, dy = p.y - ty*0.42;
          const d = Math.hypot(dx, dy) + 0.001;
          p.vx += (dx/d)*0.007; p.vy += (dy/d)*0.007;
          p.vx *= 0.91; p.vy *= 0.91;
          p.x += p.vx; p.y += p.vy;
          const pd = Math.hypot(p.x, p.y);
          if (pd > maxR) { p.x *= maxR/pd; p.y *= maxR/pd; }
          break;
        }
        case 'still': {
          p.vx *= 0.96; p.vy *= 0.96;
          p.x += p.vx; p.y += p.vy;
          break;
        }
      }
    }
  }

  setState(target: Partial<OrbRenderState>) { Object.assign(this.targetState, target); }

  private lerp(a: number, b: number, t: number) { return a + (b-a)*t; }
  private lerpC(a: [number,number,number], b: [number,number,number], t: number): [number,number,number] {
    return [this.lerp(a[0],b[0],t), this.lerp(a[1],b[1],t), this.lerp(a[2],b[2],t)];
  }

  private lerpState() {
    const s = this.state, t = this.targetState, k = 0.022;
    s.liquidColor = this.lerpC(s.liquidColor, t.liquidColor, k);
    s.rimColor = this.lerpC(s.rimColor, t.rimColor, k);
    s.turbulenceSpeed = this.lerp(s.turbulenceSpeed, t.turbulenceSpeed, k);
    s.turbulenceScale = this.lerp(s.turbulenceScale, t.turbulenceScale, k);
    s.rotationSpeed = this.lerp(s.rotationSpeed, t.rotationSpeed, k);
    s.glowIntensity = this.lerp(s.glowIntensity, t.glowIntensity, k);
    s.touchX = this.lerp(s.touchX, t.touchX, 0.14);
    s.touchY = this.lerp(s.touchY, t.touchY, 0.14);
    s.touchPressure = this.lerp(s.touchPressure, t.touchPressure, 0.11);
    s.interactionIntensity = this.lerp(s.interactionIntensity, t.interactionIntensity, 0.07);
    s.progressionLevel = this.lerp(s.progressionLevel, t.progressionLevel, 0.005);
  }

  resize(w: number, h: number) {
    this.canvas.width = w; this.canvas.height = h;
    this.gl.viewport(0, 0, w, h);
  }

  render(particleMode: string = 'drift') {
    const gl = this.gl;
    const now = (performance.now() - this.startTime) / 1000;
    const dt = Math.min(now - this.lastTime, 0.05);
    this.lastTime = now;

    this.lerpState();
    this.updateParticles(dt, particleMode, this.state.touchX, this.state.touchY, this.state.touchPressure);

    const { width, height } = this.canvas;
    gl.clearColor(0.024, 0.024, 0.032, 1.0); // pure cinematic black
    gl.clear(gl.COLOR_BUFFER_BIT);

    // --- Render orb (opaque, no blend) ---
    gl.disable(gl.BLEND);
    gl.useProgram(this.program);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.quadBuf);
    const pl = gl.getAttribLocation(this.program, 'a_position');
    gl.enableVertexAttribArray(pl);
    gl.vertexAttribPointer(pl, 2, gl.FLOAT, false, 0, 0);

    const s = this.state;
    gl.uniform1f(this.uniforms['u_time'], now);
    gl.uniform2f(this.uniforms['u_resolution'], width, height);
    gl.uniform3fv(this.uniforms['u_liquidColor'], s.liquidColor);
    gl.uniform3fv(this.uniforms['u_rimColor'], s.rimColor);
    gl.uniform1f(this.uniforms['u_turbulenceSpeed'], s.turbulenceSpeed);
    gl.uniform1f(this.uniforms['u_turbulenceScale'], s.turbulenceScale);
    gl.uniform1f(this.uniforms['u_rotationSpeed'], s.rotationSpeed);
    gl.uniform1f(this.uniforms['u_glowIntensity'], s.glowIntensity);
    gl.uniform2f(this.uniforms['u_touch'], s.touchX, s.touchY);
    gl.uniform1f(this.uniforms['u_touchPressure'], s.touchPressure);
    gl.uniform1f(this.uniforms['u_interactionIntensity'], s.interactionIntensity);
    gl.uniform1f(this.uniforms['u_progressionLevel'], s.progressionLevel);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

    // --- Render particles (additive blend) ---
    gl.enable(gl.BLEND);
    const n = this.particles.length;
    if (n > 0) {
      gl.useProgram(this.particleProgram);
      const pos = new Float32Array(n * 2);
      const sizes = new Float32Array(n);
      const alphas = new Float32Array(n);
      const colors = new Float32Array(n * 3);

      for (let i = 0; i < n; i++) {
        const p = this.particles[i];
        pos[i*2] = p.x; pos[i*2+1] = p.y;
        sizes[i] = p.size;
        alphas[i] = p.alpha;
        // Warm particles: amber/gold; cool: liquid color
        const lc = s.liquidColor;
        const warm = [Math.min(1, lc[0]+0.25), Math.min(1, lc[1]+0.05), lc[2]*0.5];
        const cool = [lc[0]*0.9, lc[1]*0.95, Math.min(1, lc[2]*1.1)];
        const cw = p.colorWarm;
        colors[i*3]   = warm[0]*cw + cool[0]*(1-cw);
        colors[i*3+1] = warm[1]*cw + cool[1]*(1-cw);
        colors[i*3+2] = warm[2]*cw + cool[2]*(1-cw);
      }

      const setAttr = (buf: WebGLBuffer | null, data: Float32Array, name: string, size: number) => {
        gl.bindBuffer(gl.ARRAY_BUFFER, buf);
        gl.bufferData(gl.ARRAY_BUFFER, data, gl.DYNAMIC_DRAW);
        const loc = gl.getAttribLocation(this.particleProgram, name);
        gl.enableVertexAttribArray(loc);
        gl.vertexAttribPointer(loc, size, gl.FLOAT, false, 0, 0);
      };

      setAttr(this.pPosBuf, pos, 'a_position', 2);
      setAttr(this.pSizeBuf, sizes, 'a_size', 1);
      setAttr(this.pAlphaBuf, alphas, 'a_alpha', 1);
      setAttr(this.pColorBuf, colors, 'a_color', 3);

      gl.uniform2f(this.pUniforms['u_resolution'], width, height);
      gl.drawArrays(gl.POINTS, 0, n);
    }
  }

  stop() { /* no-op, loop managed externally */ }
  destroy() {
    this.gl.deleteProgram(this.program);
    this.gl.deleteProgram(this.particleProgram);
  }
}
