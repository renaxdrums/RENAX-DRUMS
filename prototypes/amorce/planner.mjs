// No automatic syllable guess: the caller must provide an independently verified anchor.
export function plan({audioDuration,anchorSeconds,anchorVerified,bpm,beatsPerMeasure,firstBlock=false,countInMeasures=2,blockStart}) {
 if(!anchorVerified||!Number.isFinite(anchorSeconds)) throw new Error('LAST_SYLLABLE_NOT_VERIFIED');
 if(!(bpm>0)||!Number.isInteger(beatsPerMeasure)||beatsPerMeasure<1||anchorSeconds<0||anchorSeconds>=audioDuration)throw new Error('INVALID_INPUT');
 const beat=60/bpm,measure=beat*beatsPerMeasure;
 const measures=firstBlock?Math.max(2,countInMeasures,Math.ceil((anchorSeconds+measure)/measure)):0;
 const start=firstBlock?measures*measure:blockStart;
 const target=start-measure,announcementStart=target-anchorSeconds;
 if(announcementStart<0)throw new Error('INSUFFICIENT_PREROLL');
 return {countInMeasures:measures,blockStart:start,target,announcementStart,remainingCounts:Array.from({length:beatsPerMeasure-1},(_,i)=>({number:i+2,time:target+(i+1)*beat,bank:'voiceMale'}))};
}
export function languageState(size){let common='fr',first=true;const local=new Map();return{choose(index,language){if(!['fr','en'].includes(language)||index<0||index>=size)throw new Error('INVALID_LANGUAGE');if(first){common=language;first=false;}else local.set(index,language);},get(index){return local.get(index)||common;}};}
