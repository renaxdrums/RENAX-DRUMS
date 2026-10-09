import assert from 'node:assert/strict';
import {scoreBeats,scoreRows} from '../rhythm-score-core.mjs';
for(const denominator of [1,2,4,8,16,32])for(const count of [1,2,3,4,5,6,7,8]){
 const normal=count===3?2:count>=5&&count<=7?4:count;if(denominator*normal>32)continue;
 const model={numerator:4,denominator,beatSubdivisions:Array(4).fill(count),beatStates:Array.from({length:4},()=>Array.from({length:count},(_,i)=>i%4))},before=JSON.stringify(model),beats=scoreBeats(model);
 for(const beat of beats){const quarterFraction=count/Number(beat.duration)*(beat.tuplet?beat.tuplet.normal/beat.tuplet.count:1);assert(Math.abs(quarterFraction-1/denominator)<1e-10);assert.deepEqual(beat.notes.map(n=>n.state),model.beatStates[beat.beat]);}
 assert.deepEqual(scoreRows(beats,320).flat(),beats);assert.equal(JSON.stringify(model),before);
}
console.log('PASS: all supported subdivisions preserve exact duration, states and source data.');
