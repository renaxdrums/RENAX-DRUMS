import assert from 'node:assert/strict';
import {editorModel,spell,changeEvent,commitModel,regroup,defaultGroups,project} from '../rhythm-editor-core.mjs';
const m=(n=4,d=4,states=[[1],[1],[1],[1]])=>({numerator:n,denominator:d,tempo:120,beatSubdivisions:states.map(s=>s.length),beatStates:states});
for(const [states,expected] of [[[1,1,0,1],[.25,.5,.25]],[[1,0,1,1],[.5,.25,.25]],[[0,1,0,1],[.25,.5,.25]]]){const bar=m(1,4,[states]),model=editorModel(bar);assert.deepEqual(model.events.map(e=>e.end-e.start),expected);assert.equal(model.events[0].state,states[0]);}
const bar=m(1,4,[[1,1,1,1]]);let model=changeEvent(bar,0,{length:1});commitModel(bar,model);assert.equal(editorModel(bar).events.length,1);model=changeEvent(bar,0,{length:.5});commitModel(bar,model);assert.deepEqual(model.events.map(e=>e.state),[1,0]);assert.deepEqual(bar.beatStates,[[1,0,0,0]]);assert.throws(()=>changeEvent(bar,1,{length:1}));
assert.deepEqual(defaultGroups(m(7,8)),[2,2,3]);assert.deepEqual(defaultGroups(m(13,8)),[2,2,2,2,2,3]);assert.deepEqual(defaultGroups(m(6,8)),[3,3]);
const six=m(6,8,Array.from({length:6},()=>[1]));commitModel(six,regroup(six,true,[2,2,2]));assert.deepEqual(editorModel(six).groups,[2,2,2]);
for(const denominator of [2,4,8,16,32])for(const count of [1,2,3,4,5,6,7,8]){const normal=count===3?2:count>=5&&count<=7?4:count;if(denominator*normal>32)continue;const bar=m(1,denominator,[Array.from({length:count},(_,i)=>i===0||i===count-1?1:0)]),model=editorModel(bar),pieces=spell(bar,model).flatMap(g=>g.notes);assert(Math.abs(pieces.reduce((sum,p)=>sum+(p.dots?1.5:1)/p.duration*(p.tuplet?p.tuplet.normal/p.tuplet.count:1),0)-1/denominator)<1e-8);project(bar,model);}
const saved=m(2,4,[[1,1],[1,1]]);commitModel(saved,changeEvent(saved,0,{length:.5,state:0}));saved.beatStates[1][0]=2;assert.equal(editorModel(saved).events[0].state,0);assert.equal(editorModel(saved).events.find(e=>e.start===1).state,2);
console.log('PASS fusion, leading and explicit rests, resize, groups, all tuplets, partial grid replacement');

for(const n of [10,14,16]){const bar=m(n,8,Array.from({length:n},()=>[1]));assert.deepEqual(defaultGroups(bar),Array(n/2).fill(2));assert(spell(bar,editorModel(bar)).every(g=>g.length===2&&g.notes.length===2));}
