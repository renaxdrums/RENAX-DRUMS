// Isolated sequence planner. BPM denotes quarter notes; 7/8 therefore has
// seven eighth-note pulses. No guessed anchor can pass the normal gate.
export function planSequence(blocks,{bpm=120,countInMeasures=2,experimentalCandidates=false}={}){
 if(!Array.isArray(blocks)||!blocks.length||!Number.isFinite(bpm)||bpm<=0)throw new Error('INVALID_SEQUENCE');
 const measures=blocks.map(block=>{
  const {numerator,denominator,measures=1,anchorSeconds,audioDuration,anchorVerified}=block;
  if(!Number.isInteger(numerator)||numerator<1||numerator>20||![2,4,8,16].includes(denominator)||!Number.isInteger(measures)||measures<1)throw new Error('INVALID_METRIC');
  if(!anchorVerified&&!experimentalCandidates)throw new Error('LAST_SYLLABLE_NOT_VERIFIED');
  if(!Number.isFinite(anchorSeconds)||anchorSeconds<0||!Number.isFinite(audioDuration)||audioDuration<=anchorSeconds)throw new Error('INVALID_ANCHOR');
  const pulse=60/bpm*4/denominator;
  return {pulse,duration:pulse*numerator,count:measures};
 });
 const initial=measures[0],first=blocks[0];
 const count=Math.max(2,countInMeasures,Math.ceil((first.anchorSeconds+initial.duration)/initial.duration));
 if(!Number.isInteger(count))throw new Error('INVALID_COUNT_IN');
 let cursor=count*initial.duration;
 const announcements=[];
 const layout=blocks.map((block,index)=>{
  const previous=index?measures[index-1]:initial;
  const target=cursor-previous.duration,start=target-block.anchorSeconds;
  if(start<0)throw new Error('INSUFFICIENT_PREROLL');
  const end=start+block.audioDuration;
  if(announcements.some(a=>start<a.end&&end>a.start))throw new Error('OVERLAPPING_ANNOUNCEMENTS');
  // Letting a long syllable spill into the block would delay the selected
  // bank's audible return. Reject instead of silently shortening the voice.
  if(end>cursor)throw new Error('ANNOUNCEMENT_OVERFLOWS_BLOCK');
  const result={index,blockStart:cursor,blockEnd:cursor+measures[index].duration*measures[index].count,
    announcementStart:start,target,announcementEnd:end,previousMetric:previous};
  announcements.push({start,end});cursor=result.blockEnd;
  return result;
 });
 const grid=[];
 const addMeasure=(start,metric,blockIndex,announcingIndex=null)=>{
  for(let beat=0;beat<metric.numerator;beat++){
   if(announcingIndex!==null&&beat===0)continue;
   grid.push({time:start+beat*metric.pulse,number:beat+1,blockIndex,
     bank:announcingIndex===null?blocks[Math.max(0,blockIndex)].bank:'voiceMale',
     announcingIndex});
  }
 };
 for(let m=0;m<count;m++)addMeasure(m*initial.duration,{...initial,numerator:first.numerator},-1,m===count-1?0:null);
 for(let i=0;i<blocks.length;i++)for(let m=0;m<measures[i].count;m++){
  const announcing=i<blocks.length-1&&m===measures[i].count-1?i+1:null;
  addMeasure(layout[i].blockStart+m*measures[i].duration,{...measures[i],numerator:blocks[i].numerator},i,announcing);
 }
 return {countInMeasures:count,layout,grid,end:cursor,anchorVerified:blocks.every(b=>b.anchorVerified===true),
   experimental:experimentalCandidates};
}

// A prototype owns its AudioContext; Stop never acts on the app's context.
export function isolatedPlayback(context){
 let stopped=false;
 return {get stopped(){return stopped;},async stop(){
  if(stopped)return;stopped=true;
  if(context.state!=='closed')await context.close();
 }};
}
