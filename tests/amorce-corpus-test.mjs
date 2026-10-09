import fs from 'node:fs';
import {synthesize} from '../prototypes/amorce/engine.mjs';
import {lastSyllableCandidate} from '../prototypes/amorce/syllables.mjs';
const corpus={
 fr:['Couplet','Introduction','Refrain personnalisé de David','Transition très longue avant le solo de batterie','Final à','Final un','Solo aérien','Dernier refrain','Section numéro 37','Pont','Renax','Extraordinaire','Fin silencieuse','Changement de métrique','Psst','Flou','Tout'],
 en:['Chorus','Introduction','My custom drum breakdown','Bottle','Button','Rhythm','Fire','Quiet transition before the final chorus','Section number 37','Bridge','Strengths','Extraordinary','Hello Anna','My custom label','Psst','Blue','Shuffle'],
};
const results=[];
for(const [language,labels] of Object.entries(corpus))for(const text of labels){
 const speech=await synthesize(text,language);
 let candidate,error;try{candidate=lastSyllableCandidate(speech.events,language);}catch(e){error=e.message;}
 results.push({text,language,duration:speech.pcm.length/speech.sampleRate,candidate,error,
   phonemes:speech.events.filter(e=>e.type==='phoneme'),acousticOnsetVerified:false});
}
fs.writeFileSync('prototypes/amorce/corpus-results.json',JSON.stringify({date:'2026-10-09',results},null,2));
console.log(JSON.stringify(results.map(r=>({text:r.text,language:r.language,onset:r.candidate?.onsetPhone,phones:r.candidate?.phones,error:r.error})),null,2));
