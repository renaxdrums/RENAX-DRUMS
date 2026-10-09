import {normalizeVoice} from './voice-loudness.mjs?v=20261009-levels';
export function joinNumber(prefix,number){
 if(prefix.sampleRate!==number.sampleRate)throw new Error('VOICE_SAMPLE_RATE_MISMATCH');
 const rate=prefix.sampleRate;
 function bounds(pcm){let peak=0;for(const v of pcm)peak=Math.max(peak,Math.abs(v));let first=0,last=pcm.length;while(first<last&&Math.abs(pcm[first])<peak*.01)first++;while(last>first&&Math.abs(pcm[last-1])<peak*.01)last--;return [Math.max(0,first-Math.round(rate*.005)),Math.min(pcm.length,last+Math.round(rate*.005))];}
 const [pa,pb]=bounds(prefix.pcm),numberBounds=bounds(number.pcm);
 const phones=number.events.filter(e=>e.type==='phoneme'&&e.id?.trim());
 // French "un" is a single nasal vowel: retain its complete attack and decay.
 // The acoustic landmark moves with the retained pre-roll, not with the buffer edge.
 const preserveUn=phones.length===1&&/^[ˈˌ]?œ̃$/u.test(phones[0].id);
 const [na,nb]=preserveUn?[0,number.pcm.length]:numberBounds;
 const gap=Math.round(rate*.08),offset=pb-pa+gap;
 const pcm=new Float32Array(offset+nb-na);pcm.set(prefix.pcm.subarray(pa,pb));pcm.set(number.pcm.subarray(na,nb),offset);
 const prefixEvents=prefix.events.filter(e=>e.type==='phoneme'&&e.id?.trim()).map(e=>({...e,audio_position:Math.max(0,e.audio_position-pa/rate*1000)}));
 const wordOffset=Math.max(0,...prefixEvents.map(e=>e.text_position))+1;
 const numberEvents=number.events.filter(e=>e.type==='phoneme'&&e.id?.trim()).map(e=>({...e,text_position:e.text_position+wordOffset,audio_position:Math.max(0,e.audio_position-na/rate*1000)+offset/rate*1000}));
 // A standalone single-phoneme number (e.g. French "un") starts at its PCM attack.
 if(numberEvents.length===1)numberEvents[0].audio_position=(offset+numberBounds[0]-na+Math.round(rate*.005))/rate*1000;
 return {...number,pcm,events:[...prefixEvents,...numberEvents],level:normalizeVoice(pcm,rate),separateNumber:true};
}
