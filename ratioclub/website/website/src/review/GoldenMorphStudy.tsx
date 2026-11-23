import {GoldenObject} from "../components/GoldenRatioShape";
export function GoldenMorphStudy(){return <section className="sacred-density-section"><h1>Golden ratio · flat, helical and folded</h1><div className="sacred-morph-row">{[0,1,2].map(offset=><GoldenObject key={offset} offset={offset}/>)}</div></section>;}
