import {useEffect,useState} from 'react';

export function useLocalCopyrightYear(){
 const [year,setYear]=useState(()=>new Date().getFullYear());
 useEffect(()=>{
  let timer:ReturnType<typeof setTimeout>;
  const sync=()=>{
   clearTimeout(timer);
   const now=new Date();
   setYear(now.getFullYear());
   // Recheck at local midnight, accounting for daylight-saving changes and
   // staying within the browser's maximum timeout duration.
   const midnight=new Date(now.getFullYear(),now.getMonth(),now.getDate()+1);
   timer=setTimeout(sync,Math.max(1,midnight.getTime()-now.getTime()));
  };
  sync();
  document.addEventListener('visibilitychange',sync);
  window.addEventListener('focus',sync);
  return()=>{clearTimeout(timer);document.removeEventListener('visibilitychange',sync);window.removeEventListener('focus',sync);};
 },[]);
 return year;
}
