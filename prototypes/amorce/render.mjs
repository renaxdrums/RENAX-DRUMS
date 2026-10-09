import {plan} from './planner.mjs';

// Isolated rendering experiment. Explicitly exposes that its syllable landmark
// is a candidate. It MUST NOT be wired into the production application.
export function renderExperiment(context,speech,candidate,settings,adapter){
 const {bpm,beatsPerMeasure,subdivisions=2,bank='clic'}=settings;
 if(!Number.isInteger(subdivisions)||subdivisions<1||subdivisions>8)throw new Error('INVALID_SUBDIVISIONS');
 const p=plan({audioDuration:speech.pcm.length/speech.sampleRate,
   anchorSeconds:candidate.anchorSeconds,anchorVerified:true,
   bpm,beatsPerMeasure,firstBlock:true,countInMeasures:2});
 // This internal override only exercises the timing of a candidate, NOT the
 // publication gate. The returned status remains unverified unconditionally.
 const buffer=context.createBuffer(1,speech.pcm.length,speech.sampleRate);
 buffer.copyToChannel(speech.pcm,0);
 const src=context.createBufferSource(),gain=context.createGain();
 src.buffer=buffer;gain.gain.value=.25;
 src.connect(gain).connect(adapter.destination(context));
 src.start(p.announcementStart);
 const beat=60/bpm,events=[];
 const end=p.blockStart+beatsPerMeasure*beat;
 for(let measure=0;measure<=p.countInMeasures;measure++){
   const announcing=measure===p.countInMeasures-1;
   for(let b=0;b<beatsPerMeasure;b++){
     const time=measure*beatsPerMeasure*beat+b*beat;
     // The announcement replaces beat ONE; no bank sample overlays it.
     if(!(announcing&&b===0)){
       const soundBank=announcing?'voiceMale':bank;
       adapter.click(soundBank,b+1,time,b===0?3:2,b===0,0,beat);
       events.push({time,bank:soundBank,number:b+1,subIndex:0});
     }
     for(let sub=1;sub<subdivisions;sub++){
       const soundBank=announcing?'voiceMale':bank;
       adapter.click(soundBank,b+1,time+sub*beat/subdivisions,1,false,sub,beat);
       events.push({time:time+sub*beat/subdivisions,bank:soundBank,number:b+1,subIndex:sub});
     }
   }
 }
 return {...p,end,events,anchorVerified:false,
   measurementScope:'Candidate landmark audio transport only, not independently verified syllable onset'};
}
