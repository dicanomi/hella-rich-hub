// Scroll coordinates live only in this tab's history entry, never in a service
// or persistent storage. Keep unrelated history state intact.
const key='ratioclubScroll';
let restoring=false;
let version=0;
let saveTimer=0;
let lastSave=-Infinity;
let initialized=false;
const cleanup:(()=>void)[]=[];
// Safari limits history mutations. Scroll events can arrive 60–120 times/sec;
// persist at most twice/sec, reserving immediate writes for navigation/unload.
const saveInterval=500;

function savedPosition():{x:number;y:number}|null{
 const value=history.state?.[key];
 return value&&Number.isFinite(value.x)&&Number.isFinite(value.y)&&value.x>=0&&value.y>=0?value:null;
}
export function saveScrollPosition(force=false){
 if(restoring&&!force)return;
 if(!force&&performance.now()-lastSave<saveInterval){
  if(!saveTimer)saveTimer=window.setTimeout(()=>{saveTimer=0;saveScrollPosition();},saveInterval);
  return;
 }
 clearTimeout(saveTimer);saveTimer=0;
 const state=history.state&&typeof history.state==='object'?history.state:{};
 const position={x:scrollX,y:scrollY};
 const previous=state[key];
 if(previous?.x===position.x&&previous?.y===position.y)return;
 lastSave=performance.now();
 try{history.replaceState({...state,[key]:position},'');}
 catch{/* Saving scroll must never cancel a link, even if history is unavailable. */}
}
export function restoreScrollPosition(position=savedPosition(),waitForLayout=true){
 let target:HTMLElement|null=null;
 if(!position&&location.hash){
  try{target=document.getElementById(decodeURIComponent(location.hash.slice(1)));}
  catch{/* Malformed fragments must not interrupt navigation. */}
 }
 const token=++version;
 restoring=true;
 const apply=()=>{
  if(position)scrollTo({left:position.x,top:position.y,behavior:'instant'});
  else if(target)target.scrollIntoView({behavior:'instant'});
  else scrollTo({top:0,left:0,behavior:'instant'});
 };
 apply();
 if(!waitForLayout){restoring=false;saveScrollPosition();return;}
 // Font metrics can settle after the React commit. Retry once, unless the user
 // has already interacted or another navigation superseded this restoration.
 void document.fonts.ready.then(()=>{
  requestAnimationFrame(()=>requestAnimationFrame(()=>{
   if(token!==version)return;
   apply();
   restoring=false;saveScrollPosition();
  }));
 });
}
export function scrollForNavigation(){
 // A deliberate page link gets one immediate scroll. Only a section target
 // needs a layout retry; never schedule a late return-to-top after a click.
 restoreScrollPosition(location.hash?null:{x:0,y:0},Boolean(location.hash));
}
export function initializeScrollRestoration(){
 if(initialized)return;
 initialized=true;
 const listen=(type:string,handler:EventListener,options?:AddEventListenerOptions)=>{
  window.addEventListener(type,handler,options);
  cleanup.push(()=>window.removeEventListener(type,handler,options));
 };
 const initialPosition=savedPosition();
 const initialURL=location.href;
 let interacted=false;
 history.scrollRestoration='manual';
 listen('scroll',()=>saveScrollPosition(),{passive:true});
 listen('pagehide',()=>saveScrollPosition(true));
 listen('beforeunload',()=>{version++;restoring=false;saveScrollPosition(true);});
 // WebKit may perform its native fragment jump after the React commit.
 // Restore again at pageshow so a refresh below an anchor keeps the saved spot.
 listen('pageshow',event=>{
  if((event as PageTransitionEvent).persisted)restoreScrollPosition();
  else if(!interacted&&location.href===initialURL)restoreScrollPosition(initialPosition);
 });
 const interrupt=()=>{interacted=true;version++;restoring=false;};
 listen('wheel',interrupt,{passive:true,capture:true});
 listen('touchstart',interrupt,{passive:true,capture:true});
 listen('pointerdown',interrupt,{passive:true,capture:true});
 listen('keydown',interrupt,{capture:true});
}
if(import.meta.hot)import.meta.hot.dispose(()=>{cleanup.splice(0).forEach(remove=>remove());clearTimeout(saveTimer);version++;});
