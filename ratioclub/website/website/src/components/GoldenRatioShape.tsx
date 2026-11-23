import {useEffect,useRef} from 'react';
import {rotate,type Point3,type WireLine} from '../motion/wireframe/geometry';
import {fibonacciLines} from '../motion/wireframe/fibonacci';
const pathsPerArm=fibonacciLines.length*2+4;
const HOVER_ROTATION_SPEED=2.2;
// Identical curve topology in all poses: golden rectangles and quarter arcs.
function curves(phase:number,symmetric=false,arms=4,depth=0):WireLine[]{
 const pose=Math.floor(phase),fraction=phase-pose,t=fraction*fraction*fraction*(fraction*(fraction*6-15)+10);
 const point=(x:number,y:number,arm:number,_level:number,back:number,mode:number):Point3=>{
  const angle=arm*Math.PI*2/arms;
  const base:Point3=[x,y,0];
  if(symmetric){
   const folded=rotate(rotate(base,.55*depth,.22*depth,0),0,0,angle);
   return [folded[0],folded[1],folded[2]+back*.22*depth];
  }
  const folded=rotate(base,mode===0?0:mode===1?arm*.38:Math.sin(arm*Math.PI/2)*.85,mode===2?.16:0,angle);
  return [folded[0],folded[1],folded[2]+back*.15+(mode===1?-.11:mode===2?Math.sin(arm*Math.PI/2)*.35:0)];
 };
 const at=(x:number,y:number,arm:number,level:number,back:number):Point3=>{
  const a=point(x,y,arm,level,back,((pose%3)+3)%3),b=point(x,y,arm,level,back,((pose+1)%3+3)%3);
  return a.map((n,k)=>n+(b[k]-n)*t) as unknown as Point3;
 };
 const lines:WireLine[]=[];
 for(let arm=0;arm<arms;arm++){
  for(const back of [0,1])for(const line of fibonacciLines){
   lines.push(line.map(([x,y])=>at(x,y,arm,0,back)));
  }
  // Connect the two copies at the outer boundary without changing the 2D construction.
  for(const [x,y] of [fibonacciLines[20][0],fibonacciLines[20][1],fibonacciLines[21][0],fibonacciLines[21][1]]){
   lines.push([at(x,y,arm,0,0),at(x,y,arm,0,1)]);
  }
 }
 return lines;
}
export function GoldenObject({offset,fitToFrame=false,rotationOnly=false,arms=4,always3D=false,scrollRotate=false,returnToRest=false,interactive=true}:{offset:number;fitToFrame?:boolean;rotationOnly?:boolean;arms?:number;always3D?:boolean;scrollRotate?:boolean;returnToRest?:boolean;interactive?:boolean}){
 const root=useRef<HTMLDivElement>(null);
 useEffect(()=>{
  const el=root.current!,paths=[...el.querySelectorAll('path')],reduced=matchMedia('(prefers-reduced-motion:reduce)');
  let current=offset,target=offset,angle=0,depth=always3D?1:0,hoverOrbit=0,velocity=0,scrollVelocity=0,hover=false,frame=0,last=0,previous=scrollY,visible=false,lastScroll=-Infinity;
  const draw=()=>{const lines=curves(current,rotationOnly,arms,depth);paths.forEach((path,i)=>{if(!lines[i]){path.setAttribute('d','');return;}let depth=0;const d=lines[i].map((p,j)=>{const [x,y,z]=rotate(p,scrollRotate&&!returnToRest?.08+angle*.2+hoverOrbit*.55:(rotationOnly?0:.12)+angle*.2,scrollRotate&&!returnToRest?angle+hoverOrbit:angle*.7,scrollRotate&&!returnToRest?hoverOrbit*.35:rotationOnly?0:-.12);depth+=z;return `${j?'L':'M'}${(160+x*72).toFixed(2)},${(160-y*72).toFixed(2)}`;}).join('');path.setAttribute('d',d);path.setAttribute('stroke-opacity',String(.3+Math.max(0,Math.min(1,(depth/lines[i].length+2)/4))*.45));});if(fitToFrame){const svg=el.querySelector('svg')!;svg.setAttribute('viewBox','20 20 280 280');svg.setAttribute('preserveAspectRatio','xMidYMax meet');}el.dataset.phase=String(current);if(scrollRotate)el.dataset.scrollAngle=String(angle);};
  if(!interactive){draw();return;}
  const tick=(now:number)=>{frame=0;if(!visible||document.hidden||reduced.matches)return;const dt=Math.min((now-last)/1000,.05);last=now;if(scrollRotate&&!returnToRest){if(hover)hoverOrbit+=dt*HOVER_ROTATION_SPEED*.5;else hoverOrbit*=Math.exp(-dt/.3);}const scrollActive=returnToRest&&(now-lastScroll<50||Math.abs(scrollVelocity)>.32);depth+=((always3D||hover||scrollActive?1:0)-depth)*(1-Math.exp(-dt/(returnToRest&&!hover&&!scrollActive?.055:.22)));current+=(target-current)*(1-Math.exp(-dt/.22));const speed=hover&&(!scrollRotate||returnToRest)?HOVER_ROTATION_SPEED*(returnToRest?.5:1):0,smoothing=hover?.1:.24,decay=Math.exp(-dt/smoothing),sd=Math.exp(-dt/.28);angle+=speed*dt+(velocity-speed)*smoothing*(1-decay)+scrollVelocity*.28*(1-sd);velocity=speed+(velocity-speed)*decay;scrollVelocity*=sd;if(rotationOnly&&!hover&&(!scrollRotate||(returnToRest&&now-lastScroll>35))){
   angle*=Math.exp(-dt/(returnToRest?.1:.28));
   if(returnToRest&&Math.abs(angle)<.0001&&Math.abs(scrollVelocity)<.01){angle=0;if(Math.abs(depth-(always3D?1:0))<.0001)depth=always3D?1:0;}
  }draw();if(hover||Math.abs(current-target)>.0002||Math.abs(velocity)>.01||Math.abs(scrollVelocity)>.01||(scrollRotate&&Math.abs(hoverOrbit)>.0001)||(rotationOnly&&((((!scrollRotate||returnToRest)&&Math.abs(angle)>.0001))||Math.abs(depth-(always3D||hover?1:0))>.0001)))frame=requestAnimationFrame(tick);};
  const start=()=>{if(!frame&&visible&&!reduced.matches&&!document.hidden){last=performance.now();frame=requestAnimationFrame(tick);}};
  const enter=(e:PointerEvent)=>{if(e.pointerType!=='mouse'||reduced.matches)return;hover=true;if(!rotationOnly)target=Math.floor(target)+1;start();};
  const leave=()=>{hover=false;start();};
  const scroll=()=>{const delta=scrollY-previous;previous=scrollY;if(!visible||reduced.matches||(rotationOnly&&!scrollRotate))return;lastScroll=performance.now();if(!rotationOnly)target+=delta/(520+offset*150);scrollVelocity=Math.sign(delta)*Math.min(3.2,Math.abs(delta)*.08)*(scrollRotate?.5:1);start();};
  const observer=new IntersectionObserver(entries=>{visible=entries.some(e=>e.isIntersecting);if(visible)start();else{cancelAnimationFrame(frame);frame=0;if(returnToRest){hover=false;angle=hoverOrbit=velocity=scrollVelocity=0;depth=always3D?1:0;draw();}}});observer.observe(el);
  const reset=()=>{cancelAnimationFrame(frame);frame=0;hover=false;velocity=scrollVelocity=0;current=target=offset;angle=hoverOrbit=0;depth=always3D?1:0;draw();};
  const visibility=()=>{if(document.hidden){cancelAnimationFrame(frame);frame=0;hover=false;}else start();};
  el.addEventListener('pointerenter',enter);el.addEventListener('pointerleave',leave);window.addEventListener('scroll',scroll,{passive:true});reduced.addEventListener('change',reset);document.addEventListener('visibilitychange',visibility);draw();
  return()=>{cancelAnimationFrame(frame);observer.disconnect();el.removeEventListener('pointerenter',enter);el.removeEventListener('pointerleave',leave);window.removeEventListener('scroll',scroll);reduced.removeEventListener('change',reset);document.removeEventListener('visibilitychange',visibility);};
 },[offset,fitToFrame,rotationOnly,arms,always3D,scrollRotate,returnToRest,interactive]);
 return <div className="sacred-morph-object golden-morph-object" ref={root} role="img" aria-label="Golden-ratio rectangles and spiral arcs folding in three dimensions"><svg viewBox="0 0 320 320" width="320" height="320" fill="none" stroke="#171f23" strokeWidth=".8" aria-hidden="true">{Array.from({length:arms*pathsPerArm},(_,i)=><path key={i} strokeLinejoin="round"/>)}</svg></div>;
}
