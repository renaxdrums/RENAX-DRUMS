import {planSequence} from './sequence.mjs';
// Listening prototype: candidates remain explicitly unverified.
export function renderSequence(context,blocks,speeches,candidates,settings,adapter){
 const {bpm,subdivisions=2}=settings;
 if(!Number.isInteger(subdivisions)||subdivisions<1||subdivisions>8)throw new Error('INVALID_SUBDIVISIONS');
 const input=blocks.map((b,i)=>({...b,anchorSeconds:candidates[i].anchorSeconds,
   audioDuration:speeches[i].pcm.length/speeches[i].sampleRate,anchorVerified:false}));
 const p=planSequence(input,{bpm,experimentalCandidates:true});
 const offset=context.currentTime+.2,events=[];
 adapter.configure(context);
 const destination=adapter.destination(context);
 for(let i=0;i<blocks.length;i++){
  const s=speeches[i],buffer=context.createBuffer(1,s.pcm.length,s.sampleRate);
  buffer.copyToChannel(s.pcm,0);
  const source=context.createBufferSource(),gain=context.createGain();
  source.buffer=buffer;gain.gain.value=.25;
  source.connect(gain).connect(destination);source.start(offset+p.layout[i].announcementStart);
 }
 const measure=(start,b,index,announcing)=>{
  const pulse=60/bpm*4/b.denominator;
  for(let number=1;number<=b.numerator;number++)for(let sub=0;sub<subdivisions;sub++){
   if(announcing&&number===1&&sub===0)continue;
   const time=start+(number-1)*pulse+sub*pulse/subdivisions;
   const bank=announcing?'voiceMale':b.bank;
   adapter.click(bank,number,time+offset,sub?1:number===1?3:2,number===1&&sub===0,sub,pulse);
   events.push({time,bank,number,subIndex:sub,blockIndex:index,announcing});
  }
 };
 const first=blocks[0],initialDuration=first.numerator*60/bpm*4/first.denominator;
 for(let m=0;m<p.countInMeasures;m++)measure(m*initialDuration,first,-1,m===p.countInMeasures-1);
 for(let i=0;i<blocks.length;i++){
  const b=blocks[i],duration=b.numerator*60/bpm*4/b.denominator;
  for(let m=0;m<b.measures;m++)measure(p.layout[i].blockStart+m*duration,b,i,i<blocks.length-1&&m===b.measures-1);
 }
 return {...p,offset,events,anchorVerified:false};
}
