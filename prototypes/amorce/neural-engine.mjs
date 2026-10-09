import {synthesize as phoneticReference} from './engine.mjs';
import {phonemeInput} from './neural-core.mjs';
let worker,sequence=0;const pending=new Map();
export async function synthesize(text,language='fr'){
 const reference=await phoneticReference(text,language),input=phonemeInput(reference.events);
 if(!worker){
  worker=new Worker(new URL('./neural-worker.mjs',import.meta.url),{type:'module'});
  worker.onmessage=({data})=>{if(data.progress){window.dispatchEvent(new CustomEvent('amorce-neural-progress',{detail:data.progress}));return;}const job=pending.get(data.id);if(!job)return;pending.delete(data.id);if(data.error)job.reject(new Error(data.error));else job.resolve(data.result);};
  worker.onerror=()=>{for(const job of pending.values())job.reject(new Error('NEURAL_ENGINE_FAILED'));pending.clear();worker.terminate();worker=null;};
 }
 const id=++sequence;
 return new Promise((resolve,reject)=>{pending.set(id,{resolve,reject});worker.postMessage({id,input,language});});
}
