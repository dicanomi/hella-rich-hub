import {useEffect,useState} from 'react';
import {RotatingWireframe} from '../motion/wireframe/RotatingWireframe';
import type {WireframeShape} from '../motion/wireframe/geometry';

const orders:readonly (readonly WireframeShape[])[]=[
 ['torus','cubes','sphere'],['torus','sphere','cubes'],
 ['cubes','torus','sphere'],['cubes','sphere','torus'],
 ['sphere','torus','cubes'],['sphere','cubes','torus'],
];
const key='ratioclub_legal_shape_order';
export function LegalShapes(){
 const [order]=useState(()=>{
  if(typeof window==='undefined')return orders[0];
  let previous='';
  try{previous=sessionStorage.getItem(key)??'';}catch{/* Randomize even when storage is unavailable. */}
  const candidates=orders.filter(order=>order.join(',')!==previous);
  return candidates[Math.floor(Math.random()*candidates.length)];
 });
 useEffect(()=>{try{sessionStorage.setItem(key,order.join(','));}catch{/* Shapes never depend on storage access. */}},[order]);
 return <div className="legal-shape-row" aria-hidden="true">
  {order.map(shape=><div className="legal-shape-slot" key={shape}><RotatingWireframe shape={shape} label="" controls={false} scrollRotate/></div>)}
 </div>;
}
