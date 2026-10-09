import initialize from './runtime-loader.mjs';
let worker,module,initializing;
async function prepare(language){
 if(!['fr','en'].includes(language))throw new Error('UNSUPPORTED_LANGUAGE');
 if(!initializing)initializing=initialize().then(m=>{module=m;worker=new m.eSpeakNGWorker();}).catch(error=>{initializing=null;throw error;});
 await initializing;
 worker.set_voice(language);worker.set_rate(175);
}
function collect(text){
 const chunks=[],events=[];worker.synthesize(text,(pcm,ev)=>{chunks.push(pcm);events.push(...ev);return 0;});
 const pcm=new Float32Array(chunks.reduce((n,c)=>n+c.length,0));let pos=0;
 for(const chunk of chunks)for(const sample of chunk)pcm[pos++]=sample/32768;
 return {pcm,sampleRate:worker.get_samplerate(),events,anchorVerified:false};
}
export async function synthesize(text,language='fr'){
 if(typeof text!=='string'||!text.trim())throw new Error('EMPTY_LABEL');
 await prepare(language);
 return collect(text);
}

// Research API only. An explicit phonemic segment gives a buffer boundary,
// but that boundary does not certify that it represents the correct syllable.
export async function inspectPhonemes(text,language='fr'){
 if(typeof text!=='string'||!text.trim())throw new Error('EMPTY_LABEL');
 await prepare(language);
 const pointer=worker.convert_to_phonemes(text,false).ptr;
 let end=pointer;while(module.HEAPU8[end])end++;
 return new TextDecoder().decode(module.HEAPU8.subarray(pointer,end));
}
export async function synthesizePhonemes(phonemes,language='fr'){
 if(typeof phonemes!=='string'||!phonemes.trim()||/[\[\]\r\n]/u.test(phonemes))throw new Error('INVALID_PHONEMIC_SEGMENT');
 await prepare(language);
 return collect(`[[${phonemes}]]`);
}
