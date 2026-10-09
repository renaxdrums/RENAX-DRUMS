import {neuralAudio} from './neural-core.mjs';
const modelId='onnx-community/Kokoro-82M-v1.0-ONNX-timestamped',revision='dd4401a9add81ac692d20e240d22ec9dda82cc29';
let initialized,model,tokenizer,runtime;const voices=new Map();
async function initialize(){
 self.postMessage({progress:'Chargement du moteur neuronal…'});
 runtime=await import('https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.8.1/dist/transformers.min.js');
 runtime.env.allowLocalModels=false;runtime.env.backends.onnx.wasm.numThreads=1;
 self.postMessage({progress:'Chargement du modèle Kokoro…'});
 [model,tokenizer]=await Promise.all([
  runtime.StyleTextToSpeech2Model.from_pretrained(modelId,{revision,dtype:'q8',device:'wasm'}),
  runtime.AutoTokenizer.from_pretrained(modelId,{revision})
 ]);
 self.postMessage({progress:'Modèle chargé. Préparation de la voix…'});
}
let queue=Promise.resolve();
self.onmessage=({data})=>{queue=queue.then(async()=>{
 const {id,input,language}=data;
 try{
  if(!initialized)initialized=initialize().catch(e=>{initialized=null;throw e;});
  await initialized;
  const voice=language==='fr'?'ff_siwis':'bm_george';
  if(!voices.has(voice)){
   const response=await fetch(`https://huggingface.co/${modelId}/resolve/${revision}/voices/${voice}.bin`);
   if(!response.ok)throw new Error('NEURAL_VOICE_DOWNLOAD_FAILED');
   voices.set(voice,new Float32Array(await response.arrayBuffer()));
  }
  self.postMessage({progress:'Synthèse de la voix naturelle…'});
  const r=await neuralAudio(runtime,model,tokenizer,voices.get(voice),input);
  self.postMessage({id,result:{...r,voice}},[r.pcm.buffer]);
 }catch(e){self.postMessage({id,error:e.message});}
});};
