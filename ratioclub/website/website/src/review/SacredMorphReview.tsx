import {GoldenMorphStudy} from "./GoldenMorphStudy";
import {MorphObject} from "../components/SacredMorphShapes";
import "./sacred-morph-review.css";
export default function SacredMorphReview(){return <main className="sacred-morph-review"><GoldenMorphStudy/>{(['medium','high'] as const).map(density=><section className="sacred-density-section" key={density}><h1>{density==='medium'?'Medium density':'High density'}</h1><div className="sacred-morph-row">{[0,1,2].map(offset=><MorphObject key={offset} offset={offset} density={density}/>)}</div></section>)}</main>;}
