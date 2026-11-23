import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import desktop from '../assets/hero-disperse-desktop.webp';
import mobile from '../assets/hero-disperse-mobile.webp';
import './hero-particles.css';

const mobileViewport=matchMedia('(max-width:48rem)');
const subscribeViewport=(callback:()=>void)=>{mobileViewport.addEventListener('change',callback);return()=>mobileViewport.removeEventListener('change',callback);};
function defaultInteraction() {
  const connection=(navigator as Navigator&{connection?:{saveData?:boolean}}).connection;
  return !matchMedia('(prefers-reduced-motion: reduce)').matches&&!matchMedia('(prefers-reduced-data: reduce)').matches&&!connection?.saveData;
}

type Particle={ox:number;oy:number;x:number;y:number;vx:number;vy:number;size:number;tone:number};
export function HeroParticles() {
  const root=useRef<HTMLDivElement>(null);
  const image=useRef<HTMLImageElement>(null);
  const canvas=useRef<HTMLCanvasElement>(null);
  const useMobileImage=useSyncExternalStore(subscribeViewport,()=>mobileViewport.matches);
  const [enabled,setEnabled]=useState(defaultInteraction);
  useEffect(()=>{
    const motion=matchMedia('(prefers-reduced-motion: reduce)');
    const data=matchMedia('(prefers-reduced-data: reduce)');
    const connection=(navigator as Navigator&{connection?:EventTarget}).connection;
    const update=()=>setEnabled(defaultInteraction());
    motion.addEventListener('change',update);data.addEventListener('change',update);connection?.addEventListener('change',update);
    return()=>{motion.removeEventListener('change',update);data.removeEventListener('change',update);connection?.removeEventListener('change',update);};
  },[]);
  useEffect(()=>{
    const element=root.current!, surface=element.closest('.hero-surface')!, bitmap=image.current!, drawing=canvas.current!;
    const context=drawing.getContext('2d',{alpha:true});
    if(!context) return;
    const context2d=context;
    let particles:Particle[]=[], width=0,height=0,scale=1,frame=0,previous=0,frames=0,visible=true,disposed=false;
    let pointer:{x:number;y:number}|null=null;
    let touchTimer:ReturnType<typeof setTimeout>|undefined;
    const allowed=()=>enabled&&visible&&!document.hidden&&!disposed;
    const clear=()=>context2d.clearRect(0,0,width,height);
    function draw() {
      clear();
      const cover=Math.max(width/bitmap.naturalWidth,height/bitmap.naturalHeight);
      const offsetX=(width-bitmap.naturalWidth*cover)/2,offsetY=(height-bitmap.naturalHeight*cover)/2;
      // Each fragment carries its original image pixels, including at rest.
      for(const p of particles) {
        const tileW=p.size,tileH=p.tone;
        context2d.drawImage(bitmap,(p.ox-offsetX)/cover,(p.oy-offsetY)/cover,
          tileW/cover,tileH/cover,p.x,p.y,tileW+.35,tileH+.35);
      }
      element.dataset.ready='true';
    }
    function stop(reset=false) {
      cancelAnimationFrame(frame);frame=0;previous=0;element.dataset.animating='false';element.dataset.frames=String(frames);
      if(reset) {pointer=null;for(const p of particles){p.x=p.ox;p.y=p.oy;p.vx=0;p.vy=0;}if(enabled)draw();else clear();}
    }
    function tick(now:number) {
      frame=0;if(!allowed()){stop(true);return;}
      const dt=Math.min(previous?(now-previous)/1000:1/60,.025);previous=now;
      const radius=Math.min(150,Math.max(90,width*.11));let motion=0;
      for(const p of particles) {
        let ax=(p.ox-p.x)*42, ay=(p.oy-p.y)*42;
        if(pointer) {
          const dx=p.x-pointer.x,dy=p.y-pointer.y,distance=Math.hypot(dx,dy);
          if(distance<radius) {
            const influence=1-distance/radius;
            // Bounded repulsion avoids a singularity when the pointer meets a dot.
            const force=2100*influence*influence, divisor=Math.max(distance,3);
            ax+=dx/divisor*force;ay+=dy/divisor*force;
          }
        }
        const damping=Math.exp(-11*dt);
        p.vx=(p.vx+ax*dt)*damping;p.vy=(p.vy+ay*dt)*damping;
        p.x+=p.vx*dt;p.y+=p.vy*dt;
        motion=Math.max(motion,Math.abs(p.vx),Math.abs(p.vy));
      }
      draw();frames++;
      if(motion>.12){frame=requestAnimationFrame(tick);}else{stop();}
    }
    function start() {if(allowed()&&!frame){element.dataset.animating='true';previous=0;frame=requestAnimationFrame(tick);}}
    function rebuild() {
      if(disposed||!bitmap.complete||!bitmap.naturalWidth)return;
      const bounds=element.getBoundingClientRect();if(width===bounds.width&&height===bounds.height&&particles.length)return;
      stop();width=bounds.width;height=bounds.height;
      if(!width||!height)return;
      scale=Math.min(devicePixelRatio||1,1.5,Math.sqrt(2_000_000/(width*height)));
      drawing.width=Math.round(width*scale);drawing.height=Math.round(height*scale);context2d.setTransform(scale,0,0,scale,0,0);
      if(!enabled){particles=[];element.dataset.ready='false';element.dataset.particles='0';clear();return;}
      const budget=width<=768?900:3200;
      const cols=Math.max(1,Math.floor(Math.sqrt(budget*width/height)));
      const rows=Math.max(1,Math.floor(budget/cols));
      const tileW=width/cols,tileH=height/rows;
      particles=[];
      for(let row=0;row<rows;row++)for(let col=0;col<cols;col++){
        const x=col*tileW,y=row*tileH;
        particles.push({ox:x,oy:y,x,y,vx:0,vy:0,size:tileW,tone:tileH});
      }
      element.dataset.particles=String(particles.length);if(enabled)draw();else clear();
    }
    function move(event:Event) {
      const e=event as PointerEvent;if(e.pointerType!=='mouse'||!allowed())return;
      const bounds=element.getBoundingClientRect();pointer={x:e.clientX-bounds.left,y:e.clientY-bounds.top};start();
    }
    function leave(){pointer=null;start();}
    function tap(event:Event){
      const e=event as PointerEvent;if(e.pointerType==='mouse'||!allowed()||(e.target as Element).closest('a,button'))return;
      const bounds=element.getBoundingClientRect();pointer={x:e.clientX-bounds.left,y:e.clientY-bounds.top};start();
      clearTimeout(touchTimer);touchTimer=setTimeout(leave,160);
    }
    const observer=new IntersectionObserver(entries=>{visible=entries.some(e=>e.isIntersecting);if(!visible)stop(true);});
    const resize=new ResizeObserver(rebuild);
    const visibility=()=>{if(document.hidden)stop(true);};
    observer.observe(element);resize.observe(element);bitmap.addEventListener('load',rebuild);
    surface.addEventListener('pointermove',move,{passive:true});surface.addEventListener('pointerleave',leave,{passive:true});surface.addEventListener('pointerdown',tap,{passive:true});
    document.addEventListener('visibilitychange',visibility);rebuild();
    return()=>{disposed=true;stop();clearTimeout(touchTimer);observer.disconnect();resize.disconnect();bitmap.removeEventListener('load',rebuild);surface.removeEventListener('pointermove',move);surface.removeEventListener('pointerleave',leave);surface.removeEventListener('pointerdown',tap);document.removeEventListener('visibilitychange',visibility);};
  },[enabled,useMobileImage]);
  return <>
    <div className="hero-media hero-particles" ref={root} aria-hidden="true" data-enabled={enabled} data-animating="false">
      <img className="hero-particle-poster" ref={image} src={useMobileImage?mobile:desktop} alt="" width="1600" height="1200" fetchPriority="high"/>
      <canvas ref={canvas} className="hero-particle-canvas"/>
    </div>
    <button type="button" className="media-toggle" aria-label={enabled?'Pause particle interaction':'Play particle interaction'} onClick={()=>setEnabled(value=>!value)}><span className={enabled?'pause-icon':'play-icon'} aria-hidden="true"/></button>
  </>;
}
