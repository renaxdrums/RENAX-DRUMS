import assert from 'node:assert/strict';
import {writeFile} from 'node:fs/promises';
import {synthesize,inspectPhonemes,synthesizePhonemes} from '../prototypes/amorce/engine.mjs';
import {lastSyllableCandidate} from '../prototypes/amorce/syllables.mjs';
const phones=r=>r.events.filter(e=>e.type==='phoneme'&&e.id?.trim());
const results=[];
for(const [text,language] of [['Introduction','fr'],['Couplet','fr'],['Chorus','en'],['Bottle','en'],['Fire','en']]){
 const original=await synthesize(text,language);
 const candidate=lastSyllableCandidate(original.events,language);
 const ascii=await inspectPhonemes(text,language);
 const tokens=ascii.trim().split('_');
 const sourcePhones=phones(original);
 // Deliberately restrict this experiment to single-word, one-token-per-event
 // fixtures. General conversion/alignment remains an unsatisfied requirement.
 assert.equal(tokens.length,sourcePhones.length,`${text}: conversion correspondence`);
 const index=sourcePhones.findIndex(e=>e.audio_position/1000===candidate.anchorSeconds);
 assert.ok(index>=0);
 const suffix=tokens.slice(index).join('');
 const isolated=await synthesizePhonemes(suffix,language);
 const firstSample=isolated.pcm.findIndex(x=>x!==0);
 assert.ok(firstSample>=0);
 const reference=sourcePhones.slice(index).map(e=>e.id);
 const regenerated=phones(isolated).map(e=>e.id);
 results.push({text,language,ascii,suffix,reference,regenerated,
   samePhoneSequence:JSON.stringify(reference)===JSON.stringify(regenerated),
   firstNonzeroSample:firstSample,firstNonzeroSeconds:firstSample/isolated.sampleRate,
   firstPhoneEventSeconds:phones(isolated)[0].audio_position/1000,
   durationSeconds:isolated.pcm.length/isolated.sampleRate,
   anchorVerified:false,
   limitation:'A known segment buffer is not proof of syllabification or of audible intelligibility after concatenation.'});
}
await assert.rejects(()=>synthesizePhonemes('x]]hello[[','fr'),/INVALID_PHONEMIC/);
await writeFile(new URL('../prototypes/amorce/phonemic-results.json',import.meta.url),JSON.stringify({
 status:'research-only-unverified',results,
 conclusion:'Do not publish: phoneme sequence preservation and acoustic onset alone do not establish the last syllable of arbitrary text.'},null,2)+'\n');
console.log(JSON.stringify(results,null,2));
