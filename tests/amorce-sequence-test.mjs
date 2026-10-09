import assert from 'node:assert/strict';
import {planSequence,isolatedPlayback} from '../prototypes/amorce/sequence.mjs';
const block=(numerator,denominator,bank='claves')=>({numerator,denominator,bank,measures:2,
 audioDuration:.3,anchorSeconds:.15,anchorVerified:true});
let cases=0;
for(const bpm of [40,60,120,240,320])for(const meter of [[3,4],[4,4],[5,4],[7,8]]){
 const blocks=[block(...meter),block(4,4,'cloche'),block(3,4,'voiceFemale')];
 const p=planSequence(blocks,{bpm});
 assert.ok(p.countInMeasures>=2);
 for(const a of p.layout){
  assert.ok(Math.abs(a.announcementStart+.15-a.target)<1e-12);
  const counting=p.grid.filter(e=>e.announcingIndex===a.index);
  assert.equal(counting.length,blocks[a.index? a.index-1:0].numerator-1);
  assert.ok(counting.every(e=>e.bank==='voiceMale'&&e.number>=2));
  const first=p.grid.find(e=>Math.abs(e.time-a.blockStart)<1e-12);
  assert.equal(first.bank,blocks[a.index].bank);
 }
 assert.equal(p.layout[0].previousMetric.pulse,60/bpm*4/meter[1]);
 cases++;
}
assert.throws(()=>planSequence([{...block(4,4),anchorVerified:false}]),/LAST_SYLLABLE/);
assert.equal(planSequence([{...block(4,4),anchorVerified:false}],{experimentalCandidates:true}).anchorVerified,false);
assert.throws(()=>planSequence([{...block(4,4),audioDuration:5}]),/OVERFLOWS/);
let closed=0;const ctx={state:'running',async close(){closed++;this.state='closed';}};
const playback=isolatedPlayback(ctx);await playback.stop();await playback.stop();
assert.equal(closed,1);assert.equal(playback.stopped,true);
console.log(`${cases} multiblock metric plans passed; 7/8 pulse scaling, bank transitions, candidate rejection, overflow rejection and idempotent Stop passed. No acoustic alignment claim.`);
