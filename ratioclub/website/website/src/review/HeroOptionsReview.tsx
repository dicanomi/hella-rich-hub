import { useCallback, useEffect, useRef, useState } from 'react';
import { HeroIndex } from '../components/HeroIndex';
import { Introduction } from '../components/Introduction';
import desktop from '../assets/hero-disperse-desktop.webp';
import mobile from '../assets/hero-disperse-mobile.webp';
import videoUrl from '../assets/hero-review-updated.mp4';
import './hero-options.css';

type Mode = 'scatter' | 'flow' | 'vortex' | 'video';
const options: {id:Mode;title:string;description:string;size:string}[] = [
  {id:'scatter',title:'Image particles',description:'Thousands of fine dots form the image. Move across it to scatter them; they spring back. No square fragments.',size:'74–344 KB image + JavaScript'},
  {id:'flow',title:'Flowing particle spiral',description:'The image becomes a dense point cloud with a slow, continuous spiral flow. Move across it to disturb the current.',size:'74–344 KB image + JavaScript'},
  {id:'vortex',title:'Living image',description:'The original texture stays continuous while a gentle vortex moves through it. Your cursor bends the surface.',size:'74–344 KB image + JavaScript'},
  {id:'video',title:'Updated film, under 1 MB',description:'Your updated 8-second MP4, used as supplied without further compression. No cursor interaction.',size:'856 KB video · 1024 × 768 · 30 fps'},
];
function automaticMotion() {
  const connection=(navigator as Navigator&{connection?:{saveData?:boolean;effectiveType?:string}}).connection;
  return !matchMedia('(prefers-reduced-motion: reduce)').matches&&!matchMedia('(prefers-reduced-data: reduce)').matches&&!connection?.saveData&&!['2g','slow-2g'].includes(connection?.effectiveType??'');
}

const pointVertex=`
attribute vec2 a_uv;
uniform vec2 u_resolution;
uniform vec2 u_image;
uniform vec2 u_pointer;
uniform float u_time;
uniform float u_flow;
uniform float u_strength;
uniform float u_pixel;
uniform float u_gap;
uniform sampler2D u_texture;
varying vec3 v_color;
void main(){
    float scale=max(u_resolution.x/u_image.x,u_resolution.y/u_image.y);
  vec2 crop=u_resolution/(u_image*scale);
  vec2 uv=(a_uv-.5)*crop+.5;
  vec3 color=texture2D(u_texture,uv).rgb;
  v_color=color*1.7;
  vec2 p=a_uv*u_resolution;
  vec2 center=vec2(.64,.20)*u_resolution;
  vec2 delta=p-center;
  float r=length(delta);
  float angle=atan(delta.y,delta.x);
  float wave=sin(r*.018-u_time*.7+angle*2.0);
  vec2 tangent=vec2(-delta.y,delta.x)/max(r,1.0);
  p+=u_flow*(tangent*(9.0+7.0*wave)+normalize(delta+vec2(.001))*wave*5.0);
  vec2 d=p-u_pointer;
  float dist=length(d);
  float radius=clamp(u_resolution.x*.16,95.0,210.0);
  float influence=pow(max(0.0,1.0-dist/radius),2.0)*u_strength;
  float seed=fract(sin(dot(a_uv,vec2(127.1,311.7)))*43758.5453);
  p+=normalize(d+vec2(.1))*influence*(70.0+seed*110.0);
  p+=vec2(sin(seed*60.0+u_time*3.0),cos(seed*45.0+u_time*2.0))*influence*14.0;
  gl_Position=vec4(p/u_resolution*2.0-1.0,0,1);
  gl_Position.y=-gl_Position.y;
  gl_PointSize=u_gap*u_pixel*(.44+seed*.40);
}`;
const pointFragment=`precision mediump float; varying vec3 v_color;
void main(){float d=length(gl_PointCoord-.5);if(d>.5)discard;
float edge=1.0-smoothstep(.30,.5,d);gl_FragColor=vec4(v_color,edge);}`;
const imageVertex=`attribute vec2 a_uv;varying vec2 v_uv;void main(){v_uv=a_uv;gl_Position=vec4(a_uv*2.0-1.0,0,1);gl_Position.y=-gl_Position.y;}`;
const imageFragment=`precision highp float;
varying vec2 v_uv;uniform sampler2D u_texture;uniform vec2 u_resolution;uniform vec2 u_image;uniform vec2 u_pointer;uniform float u_time;uniform float u_strength;
void main(){
 vec2 p=v_uv;vec2 center=vec2(.64,.20);vec2 aspect=vec2(u_resolution.x/u_resolution.y,1.0);
 vec2 d=(p-center)*aspect;float r=length(d);float a=atan(d.y,d.x);
 float turn=.016*sin(u_time*.48-r*6.0)*smoothstep(.02,.4,r);
 float c=cos(turn),s=sin(turn);d=mat2(c,-s,s,c)*d;
 p=center+d/aspect;
 p+=normalize(d+vec2(.0001))/aspect*sin(r*32.0-u_time*.8+a*2.0)*.0025;
 vec2 cursor=u_pointer/u_resolution;
 vec2 cd=(v_uv-cursor)*aspect;float dist=length(cd);
 float influence=pow(max(0.0,1.0-dist/.22),2.0)*u_strength;
 p+=normalize(cd+vec2(.0001))/aspect*influence*.055;
 float cover=max(u_resolution.x/u_image.x,u_resolution.y/u_image.y);
 vec2 crop=u_resolution/(u_image*cover);
 vec2 uv=clamp((p-.5)*crop*.96+.5,vec2(.001),vec2(.999));
 gl_FragColor=texture2D(u_texture,uv);
}`;

function ShaderMedia({mode,running,onFailure}:{mode:Exclude<Mode,'video'>;running:boolean;onFailure:()=>void}) {
 const canvas=useRef<HTMLCanvasElement>(null);
 const root=useRef<HTMLDivElement>(null);
 const run=useRef(running);
 const wake=useRef<()=>void>(()=>{});
 useEffect(()=>{run.current=running;wake.current();},[running]);
 useEffect(()=>{
  const drawing=canvas.current!,element=root.current!;
  const surface=element.closest<HTMLElement>('.hero-surface')!;
  const gl=drawing.getContext('webgl',{alpha:false,antialias:false,preserveDrawingBuffer:true});
  if(!gl){onFailure();return;}
  let disposed=false,frame=0,visible=true,width=0,height=0,count=0,clock=0,last=0,lastDraw=0,loaded=false;
  let x=-1000,y=-1000,strength=0,target=0,touchTimer:ReturnType<typeof setTimeout>|undefined;
  const shaders:WebGLShader[]=[];
  const compile=(type:number,source:string)=>{const s=gl.createShader(type)!;gl.shaderSource(s,source);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS)){gl.deleteShader(s);throw Error('Shader compilation failed');}shaders.push(s);return s;};
  const program=gl.createProgram()!;
  let buffer:WebGLBuffer|null=null,texture:WebGLTexture|null=null;
  try {
   gl.attachShader(program,compile(gl.VERTEX_SHADER,mode==='vortex'?imageVertex:pointVertex));
   gl.attachShader(program,compile(gl.FRAGMENT_SHADER,mode==='vortex'?imageFragment:pointFragment));
   gl.linkProgram(program);if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw Error('Shader link failed');
   gl.useProgram(program);buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);
   const uv=gl.getAttribLocation(program,'a_uv');gl.enableVertexAttribArray(uv);gl.vertexAttribPointer(uv,2,gl.FLOAT,false,0,0);
   texture=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,texture);
   gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
   gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
  } catch {for(const s of shaders)gl.deleteShader(s);gl.deleteProgram(program);onFailure();return;}
  const uniform=(name:string)=>gl.getUniformLocation(program,name);
  const uniforms={resolution:uniform('u_resolution'),image:uniform('u_image'),pointer:uniform('u_pointer'),time:uniform('u_time'),flow:uniform('u_flow'),strength:uniform('u_strength'),pixel:uniform('u_pixel'),gap:uniform('u_gap')};
  const bitmap=new Image();
  function resize(){
   const rect=element.getBoundingClientRect();width=rect.width;height=rect.height;if(!width||!height)return;
   const pixel=Math.min(devicePixelRatio,1.5,Math.sqrt(2_000_000/(width*height)));
   drawing.width=Math.round(width*pixel);drawing.height=Math.round(height*pixel);gl!.viewport(0,0,drawing.width,drawing.height);
   const points:number[]=[];
   const gap=width<600?3.8:4.5;
   if(mode==='vortex')points.push(0,0,1,0,0,1,0,1,1,0,1,1);
   else {const cols=Math.ceil(width/gap),rows=Math.ceil(height/gap);for(let row=0;row<rows;row++)for(let col=0;col<cols;col++){
    const seed=Math.sin(col*127.1+row*311.7)*43758.5453;const jitter=seed-Math.floor(seed);
    points.push((col+.2+jitter*.6)/cols,(row+.2+jitter*.6)/rows);
   }}
   count=points.length/2;gl!.bufferData(gl!.ARRAY_BUFFER,new Float32Array(points),gl!.STATIC_DRAW);
   gl!.uniform2f(uniforms.resolution,width,height);gl!.uniform1f(uniforms.pixel,pixel);gl!.uniform1f(uniforms.gap,gap);
   element.dataset.points=String(mode==='vortex'?0:count);start();
  }
  function draw(now:number){
   frame=0;if(disposed||!loaded||!visible||document.hidden)return;
   if(lastDraw&&now-lastDraw<30){frame=requestAnimationFrame(draw);return;}
   const dt=Math.min(last?(now-last)/1000:1/30,.05);last=now;lastDraw=now;
   if(run.current)clock+=dt;
   strength+=(target-strength)*Math.min(1,dt*9);
   if(!run.current)strength=0;
   gl!.clearColor(.008,.018,.024,1);gl!.clear(gl!.COLOR_BUFFER_BIT);
   gl!.uniform2f(uniforms.pointer,x,y);gl!.uniform1f(uniforms.strength,strength);
   gl!.uniform1f(uniforms.time,clock);gl!.uniform1f(uniforms.flow,mode==='flow'?1:0);
   if(mode!=='vortex'){gl!.enable(gl!.BLEND);gl!.blendFunc(gl!.SRC_ALPHA,gl!.ONE_MINUS_SRC_ALPHA);}
   gl!.drawArrays(mode==='vortex'?gl!.TRIANGLES:gl!.POINTS,0,count);
   element.dataset.ready='true';element.dataset.frames=String(Number(element.dataset.frames??0)+1);
   const animate=run.current&&(mode!=='scatter'||Math.abs(target-strength)>.001||target>0);
   element.dataset.animating=String(animate);
   if(animate)frame=requestAnimationFrame(draw);
  }
  function start(){if(!frame&&!disposed&&visible&&!document.hidden&&loaded){last=0;lastDraw=0;frame=requestAnimationFrame(draw);}}
  wake.current=start;
  const move=(e:PointerEvent)=>{if(!run.current)return;const bounds=element.getBoundingClientRect();x=e.clientX-bounds.left;y=e.clientY-bounds.top;target=1;start();};
  const leave=()=>{target=0;start();};
  const tap=(e:PointerEvent)=>{if(e.pointerType==='mouse'||(e.target as Element).closest('a,button'))return;move(e);clearTimeout(touchTimer);touchTimer=setTimeout(leave,250);};
  const mouse=(e:PointerEvent)=>{if(e.pointerType==='mouse')move(e);};
  const observer=new IntersectionObserver(entries=>{visible=entries.some(e=>e.isIntersecting);if(visible)start();else{cancelAnimationFrame(frame);frame=0;element.dataset.animating='false';}});
  const visibility=()=>{if(document.hidden){cancelAnimationFrame(frame);frame=0;element.dataset.animating='false';}else start();};
  const resizeObserver=new ResizeObserver(resize);
  const lost=(e:Event)=>{e.preventDefault();cancelAnimationFrame(frame);frame=0;element.dataset.ready='false';onFailure();};
  bitmap.onload=()=>{if(disposed)return;gl!.bindTexture(gl!.TEXTURE_2D,texture);gl!.texImage2D(gl!.TEXTURE_2D,0,gl!.RGBA,gl!.RGBA,gl!.UNSIGNED_BYTE,bitmap);gl!.uniform2f(uniforms.image,bitmap.naturalWidth,bitmap.naturalHeight);loaded=true;resize();};
  bitmap.onerror=onFailure;bitmap.src=matchMedia('(max-width:48rem)').matches?mobile:desktop;
  observer.observe(element);resizeObserver.observe(element);document.addEventListener('visibilitychange',visibility);
  surface.addEventListener('pointermove',mouse,{passive:true});surface.addEventListener('pointerleave',leave,{passive:true});surface.addEventListener('pointerdown',tap,{passive:true});drawing.addEventListener('webglcontextlost',lost);
  return()=>{disposed=true;wake.current=()=>{};cancelAnimationFrame(frame);clearTimeout(touchTimer);bitmap.onload=null;bitmap.onerror=null;observer.disconnect();resizeObserver.disconnect();document.removeEventListener('visibilitychange',visibility);surface.removeEventListener('pointermove',mouse);surface.removeEventListener('pointerleave',leave);surface.removeEventListener('pointerdown',tap);drawing.removeEventListener('webglcontextlost',lost);gl.deleteTexture(texture);gl.deleteBuffer(buffer);gl.deleteProgram(program);for(const shader of shaders)gl.deleteShader(shader);};
 },[mode,onFailure]);
 return <div ref={root} className="hero-media option-shader" aria-hidden="true" data-mode={mode} data-running={running}>
  <picture><source media="(max-width:48rem)" srcSet={mobile}/><img src={desktop} alt="" width="1920" height="1440" fetchPriority="high"/></picture>
  <canvas ref={canvas}/>
 </div>;
}

function OptionMedia({mode}:{mode:Mode}) {
 const [wanted,setWanted]=useState(automaticMotion);
 const [failed,setFailed]=useState(false);
 const [isPlaying,setPlaying]=useState(false);
 const [source,setSource]=useState(()=>mode==='video'&&automaticMotion());
 const [visible,setVisible]=useState(true);
 const [hidden,setHidden]=useState(document.hidden);
 const video=useRef<HTMLVideoElement>(null);
 const root=useRef<HTMLDivElement>(null);
 // Stable failure callback prevents reinitializing the graphics on control changes.
 const failure=useCallback(()=>setFailed(true),[]);
 useEffect(()=>{
  const motion=matchMedia('(prefers-reduced-motion: reduce)'),data=matchMedia('(prefers-reduced-data: reduce)');
  const connection=(navigator as Navigator&{connection?:EventTarget}).connection;
  const update=()=>{const allowed=automaticMotion();setWanted(allowed);if(mode==='video')setSource(allowed);};
  const change=()=>setHidden(document.hidden);
  const observer=new IntersectionObserver(entries=>setVisible(entries.some(e=>e.isIntersecting)));observer.observe(root.current!.closest('.hero-surface')!);
  motion.addEventListener('change',update);data.addEventListener('change',update);connection?.addEventListener('change',update);document.addEventListener('visibilitychange',change);
  return()=>{observer.disconnect();motion.removeEventListener('change',update);data.removeEventListener('change',update);connection?.removeEventListener('change',update);document.removeEventListener('visibilitychange',change);};
 },[mode]);
 const running=wanted&&visible&&!hidden&&!failed;
 useEffect(()=>{if(!video.current)return;if(running)void video.current.play().catch(()=>setPlaying(false));else video.current.pause();},[running,source]);
 return <div ref={root} className="option-media-root">
  {mode==='video'?<div className="hero-media option-video" aria-hidden="true">
   <picture><source media="(max-width:48rem)" srcSet={mobile}/><img src={desktop} alt="" width="1920" height="1440"/></picture>
   {source&&!failed?<video ref={video} src={videoUrl} muted loop playsInline preload="auto" onPlaying={()=>setPlaying(true)} onPause={()=>setPlaying(false)} onError={()=>setFailed(true)}/>:null}
  </div>:failed?<div className="hero-media option-video"><img src={desktop} alt=""/></div>:wanted?<ShaderMedia mode={mode} running={running} onFailure={failure}/>:<div className="hero-media option-video"><picture><source media="(max-width:48rem)" srcSet={mobile}/><img src={desktop} alt=""/></picture></div>}
  {!failed?<button type="button" className="media-toggle" aria-label={`${wanted?'Pause':'Play'} ${mode==='video'?'background video':'background effect'}`} onClick={()=>{if(mode==='video'&&!source){setSource(true);setWanted(true);}else if(mode==='video'&&wanted&&!isPlaying){setWanted(true);void video.current?.play().catch(()=>setPlaying(false));}else setWanted(v=>!v);}}><span className={wanted?'pause-icon':'play-icon'} aria-hidden="true"/></button>:<span className="sr-only" role="status">The still image is shown because motion is unavailable.</span>}
 </div>;
}

export default function HeroOptionsReview(){
 const initial=new URLSearchParams(location.search).get('option');
 const [mode,setMode]=useState<Mode>(options.some(o=>o.id===initial)?initial as Mode:'scatter');
 const selected=options.find(o=>o.id===mode)!;
 useEffect(()=>{document.title='Four hero directions — Ratioclub';},[]);
 return <main className="hero-options-review">
  <section className="hero-option-picker" aria-labelledby="options-title">
   <div className="hero-options-heading"><h1 id="options-title">Four ways to bring the hero to life.</h1><a href="/">Return to Index</a></div>
   <div className="hero-option-buttons" aria-label="Choose a hero direction">
    {options.map((option,i)=><button key={option.id} type="button" aria-pressed={mode===option.id} onClick={()=>{setMode(option.id);history.replaceState(null,'',`?option=${option.id}`);}}><span className="hero-option-number">{String(i+1).padStart(2,'0')}</span><strong>{option.title}</strong><span>{option.size}</span></button>)}
   </div>
   <p className="hero-option-description" aria-live="polite">{selected.description} <span>Pause at the bottom right. Reduced motion and data saving start with a still image.</span></p>
  </section>
  <HeroIndex media={<OptionMedia key={mode} mode={mode}/>}/>
  <Introduction/>
  <section className="hero-options-notes"><h2>Compare the motion at full size.</h2><p>Options 1–3 use the supplied image and native WebGL with no animation library. Option 4 plays your updated film. Each option loads only its own media; nothing has replaced the Index.</p><p>Move across the hero on desktop, or tap its background on a phone. The JavaScript options are new interpretations of the texture; the film is the reference for its original motion.</p></section>
 </main>;
}
