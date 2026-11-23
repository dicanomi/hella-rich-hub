import {useEffect,useRef} from 'react';
import {makeProjector,type Point3,type WireLine} from '../motion/wireframe/geometry';

const phi=(1+Math.sqrt(5))/2;
const signs=[-1,1];
const cube:Point3[]=signs.flatMap(x=>signs.flatMap(y=>signs.map(z=>[x,y,z] as Point3)));
const vertices:Point3[][]=[
 cube,
 [0,1,2].flatMap(axis=>signs.flatMap(a=>signs.map(b=>{const p=[a,b] ;p.splice(axis,0,0);return p as unknown as Point3;}))),
 [0,1,2].flatMap(axis=>signs.flatMap(a=>signs.map(b=>{const p:Point3=[0,a,b*phi];return [p[axis],p[(axis+1)%3],p[(axis+2)%3]] as Point3;}))),
 [...cube,...[0,1,2].flatMap(axis=>signs.flatMap(a=>signs.map(b=>{const p:Point3=[0,a/phi,b*phi];return [p[axis],p[(axis+1)%3],p[(axis+2)%3]] as Point3;})))],
 cube,
 [[1,0,0],[-1,0,0],[0,1,0],[0,-1,0],[0,0,1],[0,0,-1]],
 cube.filter(([x,y,z])=>x*y*z>0),
];
const pairs=Array.from({length:20},(_,i)=>Array.from({length:19-i},(_,j)=>[i,i+j+1] as const)).flat();
function geometry(index:number){
 const original=vertices[index];
 const radius=Math.max(...original.map(p=>Math.hypot(...p)));
 // Whole edges share vertex positions throughout the transition. No edge is
 // broken into independently moving segments.
 const points=original.map(p=>p.map(n=>n/radius) as unknown as Point3)
  .sort((a,b)=>a[1]-b[1]||Math.atan2(a[2],a[0])-Math.atan2(b[2],b[0]));
 let shortest=Infinity;
 for(let i=0;i<points.length;i++)for(let j=i+1;j<points.length;j++)shortest=Math.min(shortest,Math.hypot(...points[i].map((n,k)=>n-points[j][k])));
 const slots=Array.from({length:20},(_,i)=>Math.floor(i*points.length/20));
 const nodes=slots.map(i=>points[i]);
 const multiplicities=new Map<string,number>();
 const keys=pairs.map(([i,j])=>{
  const a=slots[i],b=slots[j];if(a===b)return '';
  const distance=Math.hypot(...points[a].map((n,k)=>n-points[b][k]));
  const edge=index===0 ? points[a][0]*points[a][1]*points[a][2]*points[b][0]*points[b][1]*points[b][2]>0 : Math.abs(distance-shortest)<.001;
  if(!edge)return '';
  const key=`${Math.min(a,b)}:${Math.max(a,b)}`;multiplicities.set(key,(multiplicities.get(key)??0)+1);return key;
 });
 // Find planar convex-hull faces, separately for the two Merkaba tetrahedra.
 const faces:number[][]=[];
 const groups=index===0?[points.map((_,i)=>i).filter(i=>points[i][0]*points[i][1]*points[i][2]>0),points.map((_,i)=>i).filter(i=>points[i][0]*points[i][1]*points[i][2]<0)]:[points.map((_,i)=>i)];
 const subtract=(a:Point3,b:Point3)=>a.map((n,k)=>n-b[k]) as unknown as Point3;
 const dot=(a:Point3,b:Point3)=>a.reduce((sum,n,k)=>sum+n*b[k],0);
 const cross=(a:Point3,b:Point3):Point3=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
 for(const group of groups){const seen=new Set<string>();
  for(let i=0;i<group.length;i++)for(let j=i+1;j<group.length;j++)for(let k=j+1;k<group.length;k++){
   const origin=points[group[i]],normal=cross(subtract(points[group[j]],origin),subtract(points[group[k]],origin));if(Math.hypot(...normal)<.0001)continue;
   const distances=group.map(v=>dot(subtract(points[v],origin),normal));if(distances.some(d=>d>.0001)&&distances.some(d=>d<-.0001))continue;
   const face=group.filter((_,n)=>Math.abs(distances[n])<.0001);const key=face.join(',');if(seen.has(key))continue;seen.add(key);
   const center=face.reduce((sum,v)=>sum.map((n,c)=>n+points[v][c]/face.length) as unknown as Point3,[0,0,0] as Point3);
   const u=subtract(points[face[0]],center),v=cross(normal,u);
   face.sort((a,b)=>Math.atan2(dot(subtract(points[a],center),v),dot(subtract(points[a],center),u))-Math.atan2(dot(subtract(points[b],center),v),dot(subtract(points[b],center),u)));
   for(let n=1;n<face.length-1;n++)faces.push([face[0],face[n],face[n+1]].map(v=>slots.indexOf(v)).sort((a,b)=>a-b));
  }
 }
 return {nodes,faces,weights:keys.map(key=>key?1/multiplicities.get(key)!:0)};
}
const shapes=Array.from({length:vertices.length},(_,i)=>geometry(i));
const triangles=[...new Map(shapes.flatMap(shape=>shape.faces).map(face=>[face.join(','),face])).values()];
const faceWeights=shapes.map(shape=>new Set(shape.faces.map(face=>face.join(','))));
const densities={medium:{layers:[1,.65],subdivisions:2},high:{layers:[1,.73,.46],subdivisions:4}};

const names=['Merkaba','Vector Equilibrium','Icosahedron','Dodecahedron','Cube','Octahedron','Tetrahedron'];
const sequences={privacy:[0,1,2,3],terms:[4,5,6],about:[0,1,2,3,4,5]};
const ease=(t:number)=>t*t*t*(t*(t*6-15)+10);
export function MorphObject({offset,density,variant="privacy",calmScroll=false}:{offset:number;density:keyof typeof densities;variant?:keyof typeof sequences;calmScroll?:boolean}){
 const root=useRef<HTMLDivElement>(null);
 useEffect(()=>{
  const configuration=densities[density],sequence=sequences[variant],count=sequence.length;
  const el=root.current!;const paths=[...el.querySelectorAll('path')];const reduced=matchMedia('(prefers-reduced-motion:reduce)');
  let frame=0,last=0,angle=0,velocity=0,scrollVelocity=0,hover=false,current=offset,target=offset,visible=variant!=="about",previousScroll=scrollY;
  const draw=()=>{
   const floor=Math.floor(current),t=ease(current-floor),a=shapes[sequence[((floor%count)+count)%count]],b=shapes[sequence[((floor+1)%count+count)%count]];const project=makeProjector('cubes',angle,130);
   const nodes=a.nodes.map((p,i)=>p.map((n,k)=>n+(b.nodes[i][k]-n)*t) as unknown as Point3);
   const from=sequence[((floor%count)+count)%count],to=sequence[((floor+1)%count+count)%count];
   let pathIndex=0;
   for(const scale of configuration.layers){
    const scaled=nodes.map(p=>p.map(n=>n*scale) as unknown as Point3);
    pairs.forEach(([u,v],i)=>{
     const weight=a.weights[i]+(b.weights[i]-a.weights[i])*t;
     const view=project([scaled[u],scaled[v]] as WireLine),path=paths[pathIndex++];
     path.setAttribute('d',view.path);path.setAttribute('stroke-opacity',String((.4+view.opacity*.6)*weight));
    });
    triangles.forEach(face=>{
     const key=face.join(','),weight=(faceWeights[from].has(key)?1-t:0)+(faceWeights[to].has(key)?t:0);
     const vertices=face.map(v=>scaled[v]);let data='';
     for(let axis=0;axis<3;axis++)for(let n=1;n<configuration.subdivisions;n++){
      const fraction=n/configuration.subdivisions,origin=vertices[axis];
      const line=[vertices[(axis+1)%3],vertices[(axis+2)%3]].map(p=>origin.map((v,k)=>v+(p[k]-v)*fraction) as unknown as Point3);
      data+=project(line).path;
     }
     const path=paths[pathIndex++];path.setAttribute('d',data);path.setAttribute('stroke-opacity',String(weight*.3));
    });
   }
   el.dataset.angle=String(angle);el.dataset.phase=String(current);el.setAttribute('aria-label',names[sequence[((Math.round(current)%count)+count)%count]]);
  };
  const tick=(now:number)=>{
   frame=0;if(!visible||document.hidden||reduced.matches)return;
   const dt=Math.min((now-last)/1000,.05);last=now;
   current+=(target-current)*(1-Math.exp(-dt/.22));
   const speed=hover?2.2:0,smoothing=hover?.10:.24,decay=Math.exp(-dt/smoothing),scrollDecay=Math.exp(-dt/.28);
   angle+=speed*dt+(velocity-speed)*smoothing*(1-decay)+scrollVelocity*.28*(1-scrollDecay);
   velocity=speed+(velocity-speed)*decay;scrollVelocity*=scrollDecay;draw();
   if(Math.abs(target-current)>.0002||Math.abs(velocity)>.01||Math.abs(scrollVelocity)>.01||hover)frame=requestAnimationFrame(tick);
  };
  const start=()=>{if(!frame&&visible&&!document.hidden&&!reduced.matches){last=performance.now();frame=requestAnimationFrame(tick);}};
  const enter=(e:PointerEvent)=>{if(e.pointerType!=='mouse'||reduced.matches)return;hover=true;target=Math.floor(target)+1;start();};
  const leave=()=>{hover=false;start();};
  const scroll=()=>{const delta=scrollY-previousScroll;previousScroll=scrollY;if(variant==="about"||!visible||reduced.matches)return;const movement=calmScroll?Math.max(-24,Math.min(24,delta)):delta;target+=movement/((460+offset*125)*(calmScroll?2.5:1));scrollVelocity=Math.sign(movement)*Math.min(calmScroll?.65:3.2,Math.abs(movement)*(calmScroll?.02:.08));start();};
  const observer=new IntersectionObserver(entries=>{visible=entries.some(e=>e.isIntersecting);if(calmScroll||variant==="about")previousScroll=scrollY;if(visible)start();else{cancelAnimationFrame(frame);frame=0;if(variant==="about"){hover=false;velocity=scrollVelocity=0;target=current;}}});observer.observe(el);
  const preference=()=>{cancelAnimationFrame(frame);frame=0;hover=false;velocity=scrollVelocity=0;current=target=offset;draw();};
  const visibility=()=>{if(document.hidden){cancelAnimationFrame(frame);frame=0;hover=false;}else start();};
  el.addEventListener('pointerenter',enter);el.addEventListener('pointerleave',leave);window.addEventListener('scroll',scroll,{passive:true});reduced.addEventListener('change',preference);document.addEventListener('visibilitychange',visibility);draw();
  return()=>{cancelAnimationFrame(frame);observer.disconnect();el.removeEventListener('pointerenter',enter);el.removeEventListener('pointerleave',leave);window.removeEventListener('scroll',scroll);reduced.removeEventListener('change',preference);document.removeEventListener('visibilitychange',visibility);};
 },[offset,density,variant,calmScroll]);
 return <div ref={root} className="sacred-morph-object" role="img"><svg viewBox="0 0 320 320" width="320" height="320" fill="none" stroke="#171f23" strokeWidth="1" aria-hidden="true">{Array.from({length:(pairs.length+triangles.length)*densities[density].layers.length},(_,i)=><path key={i} strokeLinecap="round" strokeLinejoin="round"/>)}</svg></div>;
}

export function SacredMorphShapes({variant="privacy"}:{variant?:keyof typeof sequences}){return <div className="legal-shape-row sacred-legal-shapes">{[0,1,2].map(offset=><MorphObject key={offset} offset={offset} density="medium" variant={variant} calmScroll/>)}</div>;}
