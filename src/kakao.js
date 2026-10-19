// JavaScript keys are public browser identifiers. Never put an Admin/REST key here.
export const KAKAO_CONFIG = Object.freeze({
 javascriptKey: '',
 siteUrl: 'https://clinquant-basbousa-3ff2ce.netlify.app/'
});

// Version and integrity pair published by Kakao support:
// https://devtalk.kakao.com/t/kakao-sdk-integrity/147488
const KAKAO_SDK_URL='https://t1.kakaocdn.net/kakao_js_sdk/2.7.9/kakao.min.js';
const KAKAO_SDK_INTEGRITY='sha384-JpLApTkB8lPskhVMhT+m5Ln8aHlnS0bsIexhaak0jOhAkMYedQoVghPfSpjNi9K1';

export function createKakaoClient({key=KAKAO_CONFIG.javascriptKey,doc=document,win=window,timeout=10000}={}) {
 const configured=/^[a-f0-9]{32}$/i.test(key);
 let pending=null,ready=false;
 function initialize(){
  const sdk=win.Kakao;
  if(!sdk?.Share?.sendDefault)throw new Error('Kakao SDK unavailable');
  if(!sdk.isInitialized())sdk.init(key);
  ready=true;
  return sdk;
 }
 function load(){
  if(!configured)return Promise.reject(new Error('Kakao JavaScript key is missing'));
  if(pending)return pending;
  if(win.Kakao){try{return Promise.resolve(initialize());}catch(error){return Promise.reject(error);}}
  pending=new Promise((resolve,reject)=>{
   const script=doc.createElement('script');
   let settled=false;
   const finish=error=>{
    if(settled)return;settled=true;clearTimeout(timer);
    script.onload=null;script.onerror=null;
    if(error){script.remove();reject(error);}else{try{resolve(initialize());}catch(e){script.remove();reject(e);}}
   };
   const timer=setTimeout(()=>finish(new Error('Kakao SDK timed out')),timeout);
   script.src=KAKAO_SDK_URL;script.integrity=KAKAO_SDK_INTEGRITY;script.crossOrigin='anonymous';script.async=true;
   script.onload=()=>finish();script.onerror=()=>finish(new Error('Kakao SDK failed to load'));
   doc.head.append(script);
  }).catch(error=>{pending=null;ready=false;throw error;});
  return pending;
 }
 return {
  configured,load,
  isReady:()=>ready,
  // Keep this synchronous inside the user's click to preserve popup permission.
  send(payload){if(!ready)throw new Error('Kakao SDK is not ready');return win.Kakao.Share.sendDefault(payload);}
 };
}
