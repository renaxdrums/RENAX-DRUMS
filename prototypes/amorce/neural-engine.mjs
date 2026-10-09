import {synthesize as phoneticReference} from './engine.mjs';
import {phonemeInput} from './neural-core.mjs?v=20261009-levels';
import {joinNumber} from './separate-number.mjs?v=20261009-un-complete';
let worker,sequence=0;const pending=new Map();
async function generate(text,language='fr'){
 const parts=language==='fr'&&text.match(/^(.*\S)\s+(\d+)\s*$/u);
 if(parts){const [prefix,number]=await Promise.all([synthesize(parts[1],language),synthesize(parts[2],language)]);return joinNumber(prefix,number);}
 const reference=await phoneticReference(text,language),input=phonemeInput(reference.events);
 if(!worker){
  worker=new Worker(new URL('./neural-worker.mjs?v=20261009-male-restored',import.meta.url),{type:'module'});
  worker.onmessage=({data})=>{if(data.progress){window.dispatchEvent(new CustomEvent('amorce-neural-progress',{detail:data.progress}));return;}const job=pending.get(data.id);if(!job)return;pending.delete(data.id);if(data.error)job.reject(new Error(data.error));else job.resolve(data.result);};
  worker.onerror=()=>{for(const job of pending.values())job.reject(new Error('NEURAL_ENGINE_FAILED'));pending.clear();worker.terminate();worker=null;};
 }
 const id=++sequence;
 return new Promise((resolve,reject)=>{pending.set(id,{resolve,reject});worker.postMessage({id,input,language,device:'wasm'});});
}

const cache=new Map();
export function synthesize(text,language='fr'){
 const key=JSON.stringify([text,language]);
 if(cache.has(key))return cache.get(key);
 const started=performance.now();
 const job=generate(text,language).then(result=>({...result,preparationMs:performance.now()-started})).catch(error=>{cache.delete(key);throw error;});
 cache.set(key,job);
 // Bound retained PCM, while keeping the three current announcements.
 if(cache.size>24)cache.delete(cache.keys().next().value);
 return job;
}
