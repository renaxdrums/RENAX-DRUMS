/* Pure, versioned synchronization model. No audio or browser dependencies. */
export const VERSION=1;
export const copy=value=>JSON.parse(JSON.stringify(value));
export function canonical(value){if(Array.isArray(value))return '['+value.map(canonical).join(',')+']';if(value&&typeof value==='object')return '{'+Object.keys(value).sort().map(k=>JSON.stringify(k)+':'+canonical(value[k])).join(',')+'}';return JSON.stringify(value);}
export const key=(type,...ids)=>type+'_'+encodeURIComponent(JSON.stringify(ids));
export function flatten(library){
  const out={};out.catalog=canonical({type:'catalog',profileIds:library.profiles.map(p=>p.id)});
  for(const p of library.profiles){out[key('profile',p.id)]=canonical({type:'profile',id:p.id,name:p.name,songIds:p.songs.map(s=>s.id)});for(const song of p.songs)out[key('song',p.id,song.id)]=canonical({type:'song',profileId:p.id,song});}return out;
}
export function materialize(records,fallback){
  const live={};for(const [id,r] of Object.entries(records))if(!r.deleted&&r.payload!==null)live[id]=JSON.parse(r.payload);
  const catalog=live.catalog;if(!catalog)return copy(fallback);
  const profiles=[];for(const id of catalog.profileIds){const p=live[key('profile',id)];if(!p)continue;const songs=[];for(const songId of p.songIds){const s=live[key('song',id,songId)];if(s)songs.push(copy(s.song));}profiles.push({id:p.id,name:p.name,songs});}
  if(!profiles.length)return copy(fallback);
  return {version:1,activeProfile:profiles.some(p=>p.id===fallback.activeProfile)?fallback.activeProfile:profiles[0].id,profiles};
}
export function blankState(library){return {version:VERSION,library:copy(library),base:{},pending:{},conflicts:{},importDecisions:{}};}
export function stage(state,library,operationId){
  const next=copy(state),current=flatten(library);next.library=copy(library);
  const ids=new Set([...Object.keys(next.base),...Object.keys(next.pending),...Object.keys(current)]);
  for(const id of ids){const payload=current[id]??null,deleted=payload===null,base=next.base[id];
    if(next.conflicts[id]){next.conflicts[id].local={payload,deleted};continue;}
    if(base&&base.deleted===deleted&&base.payload===payload){delete next.pending[id];continue;}
    if(!base&&deleted){delete next.pending[id];continue;}
    if(next.pending[id]?.payload===payload&&next.pending[id]?.deleted===deleted)continue;
    next.pending[id]={payload,deleted,expected:base?.revision??0,operationId:operationId()};
  }return next;
}
export function mergeRemote(state,remote){
  const next=copy(state);
  for(const [id,record] of Object.entries(remote)){
    const known=next.base[id];if(known&&record.revision<known.revision)continue;
    const pending=next.pending[id];
    if(next.conflicts[id]){next.conflicts[id].remote=copy(record);continue;}
    if(pending){
      if(record.operationId===pending.operationId){next.base[id]=copy(record);delete next.pending[id];}
      else if(record.revision!==pending.expected){next.conflicts[id]={local:{payload:pending.payload,deleted:pending.deleted},remote:copy(record)};delete next.pending[id];}
    }else next.base[id]=copy(record);
  }
  return next;
}
export function visibleRecords(state){const out=copy(state.base);for(const [id,p] of Object.entries(state.pending))out[id]=p;for(const [id,c] of Object.entries(state.conflicts))out[id]=c.local;return out;}
export function resolveConflict(state,id,choice,operationId){
  const next=copy(state),conflict=next.conflicts[id];if(!conflict)throw Error('Conflit absent.');
  next.base[id]=copy(conflict.remote);delete next.conflicts[id];
  if(choice==='local')next.pending[id]={...conflict.local,expected:conflict.remote.revision,operationId:operationId()};else if(choice!=='remote')throw Error('Choix de résolution incorrect.');return next;
}
