export const PRIVACY_KEY='ratioclub_privacy_v1';
export const RETENTION_DAYS=180;
export function privacySignals(){
 if(typeof navigator==='undefined')return {gpc:false,dnt:false};
 const nav=navigator as Navigator & {globalPrivacyControl?:boolean};
 return {gpc:nav.globalPrivacyControl===true,dnt:nav.doNotTrack==='1'};
}
export function readPrivacyChoice(){
 if(typeof window==='undefined')return null;
 try{
  const value=JSON.parse(localStorage.getItem(PRIVACY_KEY)||'null');
  if(value?.version!==1||value.necessary!==true||typeof value.analytics!=='boolean'||typeof value.marketing!=='boolean'||typeof value.gpc!=='boolean'||typeof value.dnt!=='boolean'||!Number.isFinite(Date.parse(value.timestamp))||!Number.isFinite(Date.parse(value.expiresAt))||Date.parse(value.expiresAt)<=Date.now())return null;
  return value as {version:1;necessary:true;analytics:boolean;marketing:boolean;gpc:boolean;dnt:boolean;timestamp:string;expiresAt:string};
 }catch{return null;}
}
export function savePrivacyChoice(preferences={analytics:false,marketing:false}){
 const now=Date.now(),signals=privacySignals();
 const value={version:1,necessary:true,analytics:preferences.analytics===true&&!signals.dnt,marketing:preferences.marketing===true&&!signals.gpc&&!signals.dnt,...signals,timestamp:new Date(now).toISOString(),expiresAt:new Date(now+RETENTION_DAYS*86400000).toISOString()};
 try{localStorage.setItem(PRIVACY_KEY,JSON.stringify(value));return true;}catch{return false;}
}
// These are saved preferences only. No optional integrations are installed;
// accepting a preference never activates scripts, telemetry, or tracking.
export const optionalProcessingAllowed=()=>false;
