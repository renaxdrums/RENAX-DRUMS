import {normalizeVoice} from './voice-loudness.mjs?v=20261009-levels';
// Kokoro's durations are model-predicted phoneme timings, not independent
// acoustic annotations. Keep the existing unverified syllable gate intact.
export function phonemeInput(events){
 const source=events.filter(e=>e.type==='phoneme'&&e.id?.trim());
 let text='',word;const offsets=[];
 for(const e of source){
  if(word!==undefined&&word!==e.text_position)text+=' ';
  word=e.text_position;offsets.push(Array.from(text).length);text+=e.id;
 }
 if(!text)throw new Error('NO_PHONEME_EVENTS');
 if(Array.from(text).length>508)throw new Error('LABEL_TOO_LONG_FOR_NEURAL_MODEL');
 return {text,source,offsets};
}
export async function neuralAudio(runtime,model,tokenizer,voiceData,input){
 const {input_ids}=tokenizer(input.text,{truncation:false});
 const characters=Array.from(input.text).length;
 if(input_ids.size!==characters+2)throw new Error('UNSUPPORTED_PHONEME');
 const style=voiceData.slice(characters*256,(characters+1)*256);
 if(style.length!==256)throw new Error('INVALID_VOICE_STYLE');
 const {waveform,durations}=await model({input_ids,style:new runtime.Tensor('float32',style,[1,256]),speed:new runtime.Tensor('float32',[1],[1])});
 const ds=Array.from(durations.data,Number);
 if(ds.length!==input_ids.size||ds.some(d=>!Number.isFinite(d)||d<0))throw new Error('INVALID_NEURAL_DURATIONS');
 const starts=[0];for(const d of ds)starts.push(starts.at(-1)+d/40);
 const events=input.source.map((e,i)=>({...e,audio_position:starts[input.offsets[i]+1]*1000,timingSource:'kokoro-predicted-duration'}));
 const pcm=new Float32Array(waveform.data);
 if(!pcm.length||pcm.some(v=>!Number.isFinite(v)))throw new Error('INVALID_NEURAL_AUDIO');
 const level=normalizeSpeech(pcm);
 return {level,pcm,sampleRate:24000,events,anchorVerified:false,model:'Kokoro-82M',timingSource:'model-predicted-phoneme-durations'};
}

export function normalizeSpeech(pcm){
 return normalizeVoice(pcm,24000);
}
