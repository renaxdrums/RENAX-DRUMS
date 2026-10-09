import assert from 'node:assert/strict';
import {synthesize} from '../prototypes/amorce/engine.mjs';
import {lastSyllableCandidate} from '../prototypes/amorce/syllables.mjs';
const cases=[['Introduction','fr','s'],['Couplet','fr','p'],['Chorus','en','ɹ'],['My custom drum breakdown','en','d']];
for(const [text,lang,expected] of cases){
 const r=await synthesize(text,lang),c=lastSyllableCandidate(r.events,lang);
 console.log(text,lang,c);
 assert.equal(c.onsetPhone.replace(/[ˈˌ]/gu,''),expected);
 assert.equal(c.anchorVerified,false);
}
assert.throws(()=>lastSyllableCandidate([], 'fr'),/NO_PHONEME/);
assert.throws(()=>lastSyllableCandidate([], 'de'),/UNSUPPORTED/);
console.log('Four linguistic fixture expectations passed; no acoustic certification claimed.');
