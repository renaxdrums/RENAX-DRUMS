import fs from 'node:fs';
import assert from 'node:assert/strict';
import {initializeTestEnvironment,assertSucceeds,assertFails} from '@firebase/rules-unit-testing';
import {doc,getDoc,setDoc,writeBatch,serverTimestamp,deleteDoc,runTransaction} from 'firebase/firestore';
const environment=await initializeTestEnvironment({projectId:'demo-renax-backup',firestore:{host:'127.0.0.1',port:8080,rules:fs.readFileSync(new URL('../../firestore.rules',import.meta.url),'utf8')}});
try{
await environment.clearFirestore();const a=environment.authenticatedContext('accountA').firestore(),b=environment.authenticatedContext('accountB').firestore(),guest=environment.unauthenticatedContext().firestore();
const data=(revision,payload='{"type":"song","song":{"id":"s"}}')=>({schema:1,revision,payload,deleted:false,operationId:crypto.randomUUID(),device:'test',updatedAt:serverTimestamp()});
const ref=doc(a,'users/accountA/records/song');async function paired(db,path,value){const batch=writeBatch(db);batch.set(doc(db,path),value);batch.set(doc(db,path+'/history/'+value.revision),value);return batch.commit();}
await assertFails(getDoc(doc(guest,'users/accountA/records/song')));
await assertFails(paired(guest,'users/accountA/records/song',data(1)));
await assertSucceeds(paired(a,'users/accountA/records/song',data(1)));
await assertSucceeds(getDoc(ref));await assertFails(getDoc(doc(b,'users/accountA/records/song')));
await assertFails(paired(b,'users/accountA/records/song',data(2)));
await assertFails(setDoc(ref,data(2))); // A revision must have an atomic history entry.
await assertFails(paired(a,'users/accountA/records/song',data(3))); // No skipped revision.
await assertFails(paired(a,'users/accountA/records/song',{...data(2),schema:2}));
await assertFails(paired(a,'users/accountA/records/song',{...data(2),injected:true}));
await assertFails(paired(a,'users/accountA/records/song',{...data(2),deleted:true,payload:'not-empty'}));
await assertFails(paired(a,'users/accountA/records/song',{...data(2),updatedAt:new Date(0)}));
await assertSucceeds(paired(a,'users/accountA/records/song',data(2))); console.log('After revision2:',(await getDoc(ref)).data().revision);
await assertFails(setDoc(doc(a,'users/accountA/records/song/history/1'),data(1)));
await assertFails(deleteDoc(ref));await assertFails(deleteDoc(doc(a,'users/accountA/records/song/history/1')));
console.log('Before tombstone:',(await getDoc(ref)).data().revision);await assertSucceeds(paired(a,'users/accountA/records/song',{...data(3,''),deleted:true}));console.log('Tombstone pass');
await assertFails(getDoc(doc(b,'users/accountA/records/song/history/1')));
// Two clients with revision 3: one atomic writer wins; the second sees a conflict.
const apply=()=>runTransaction(a,async tx=>{const snap=await tx.get(ref);if(snap.data().revision!==3)return 'conflict';const value=data(4);tx.set(ref,value);tx.set(doc(a,'users/accountA/records/song/history/4'),value);return 'written';});
const outcomes=await Promise.allSettled([apply(),apply()]);assert.equal(outcomes.filter(r=>r.status==='fulfilled'&&r.value==='written').length,1);
assert(outcomes.some(r=>r.status==='fulfilled'&&r.value==='conflict'||r.status==='rejected'&&r.reason.code==='permission-denied'));
assert.equal((await getDoc(ref)).data().revision,4);
await assertFails(getDoc(doc(a,'unrelated/public')));
console.log('Firestore rules PASS: anonymous denial, account isolation, immutable history, schema/fields, server time, revision CAS, tombstones and atomic concurrent writers');
}finally{await environment.cleanup();}
