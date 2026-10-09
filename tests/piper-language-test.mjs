import assert from 'node:assert/strict';
import {piperInput,synthesize} from '../prototypes/amorce/engine.mjs';
const englishPhones=r=>r.events.filter(e=>e.type==='phoneme'&&e.id.trim()).map(e=>e.id);
const expectedEnglish=englishPhones(await synthesize('Custom chorus','en'));
const expectedFrench=await piperInput('Couplet 1');
for(let run=0;run<3;run++){
 const [fr,en,fin]=await Promise.all([piperInput('Couplet 1'),synthesize('Custom chorus','en'),piperInput('Fin')]);
 assert.equal(fr.text,expectedFrench.text);assert.deepEqual(englishPhones(en),expectedEnglish);assert.equal(fin.text,'fˈɛ̃');
}
console.log({french:expectedFrench.text,english:expectedEnglish,concurrentLanguages:'pass'});
