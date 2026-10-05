const {start,save}=require('./audio-harness.cjs');
const fs=require('fs');
(async()=>{
 const runtime=await start();const browser=runtime.browser;
 const page=await browser.newPage();await page.goto(runtime.url);await page.waitForFunction(()=>allVoiceAudioReady);
 const result=await page.evaluate(async()=>{
  const realCtx=audioCtx, originalClick=playClick, originalVisual=scheduleVisualUpdate;
  const nativeTimeout=window.setTimeout;window.setTimeout=()=>0;scheduleVisualUpdate=()=>{};
  const results=[];let maxAttackError=0,maxIntervalError=0,lateStarts=0;
  const cases=[{name:'Tous les nombres 1-20',ms:[[20,120,[1]]]},{name:'60 BPM 4/4',ms:[[4,60,[1]]]},{name:'120 BPM 4/4',ms:[[4,120,[1]]]},{name:'60 BPM 3/4',ms:[[3,60,[1]]]},{name:'120 BPM 5/4',ms:[[5,120,[1]]]},{name:'subdivisions 2/3/4/5/6/7/8',ms:[[4,120,[2,3,4,5]],[3,60,[6,7,8]]]},{name:'mesures et tempos 60->120->90',ms:[[4,60,[1]],[3,120,[2,3,4]],[5,90,[1]]]}];
  for(const bank of ['voiceMale','voiceFemale','voiceMaleFR','voiceFemaleFR']){
   for(const test of cases){
    currentBank=bank;appMode='metronome';training.active=false;silentModeEnabled=false;
    measures=test.ms.map(([n,bpm,subs])=>{const m=createMeasure(n,4);m.tempo=bpm;m.beatSubdivisions=Array.from({length:n},(_,i)=>subs[i%subs.length]);m.beatStates=m.beatSubdivisions.map(n=>Array(n).fill(1));return m;});
    playingMeasureIndex=0;currentStepInMeasure=0;nextNoteTime=.4;
    let expected=[],t=.4;
    while(expected.length<20){for(const m of measures){for(let beat=0;beat<m.numerator;beat++){expected.push({time:t,number:beat+1});t+=60/m.tempo;if(expected.length===20)break;}if(expected.length===20)break;}}
    const offline=new OfflineAudioContext(20,Math.ceil((t+2)*48000),48000);const merger=offline.createChannelMerger(20);merger.connect(offline.destination);
    let clock=0,events=[],starts=[];
    audioCtx={get currentTime(){return clock;},createGain:()=>offline.createGain(),createOscillator:()=>offline.createOscillator(),createBufferSource:()=>{const s=offline.createBufferSource();const start=s.start.bind(s);s.start=(when,offset=0)=>{starts.push({when,offset,clock});start(when,offset);};return s;}};
    playClick=(state,time,first,context)=>{if(context.subIndex===0&&events.length<20){const dest=offline.createGain();dest.connect(merger,0,events.length);events.push({...context,time});SOUND_BANKS[currentBank].play(dest,time,state,first,context);}};
    // Uneven callbacks exercise the actual scheduler; Web Audio owns the grid.
    for(let i=0;clock<t+.5;i++){scheduler();clock += [0.025,.017,.040,.028][i%4];}
    const rendered=await offline.startRendering();let errors=[];
    for(let i=0;i<20;i++){
     if(events[i].beatNumber!==expected[i].number)throw Error('Wrong count '+test.name);
     const gridError=Math.abs(events[i].time-expected[i].time);if(gridError>1e-9)throw Error('Grid changed');
     const x=rendered.getChannelData(i),start=starts[i];if(start.offset>0)lateStarts++;
     // Independent 5 ms RMS/1 ms hop detector, applied to each rendered channel.
     const lo=Math.round(start.when*48000),hi=Math.min(x.length,lo+Math.round(1.5*48000));let rms=[],peak=0,sum=0;
     for(let j=lo;j<Math.min(lo+240,hi);j++)sum+=x[j]*x[j];
     for(let j=lo;j+240<=hi;j++){if((j-lo)%48===0){let v=Math.sqrt(Math.max(0,sum)/240);rms.push(v);peak=Math.max(peak,v);}sum+=x[j+240]*x[j+240]-x[j]*x[j];}
     const threshold=Math.max(.01*.72,peak*.20);let at=0;
     for(let j=0;j+10<=rms.length;j++){if(rms.slice(j,j+10).every(v=>v>=threshold)){at=j;break;}}
     const attack=lo/48000+at/1000;const err=(attack-expected[i].time)*1000;errors.push(err);maxAttackError=Math.max(maxAttackError,Math.abs(err));
     if(i)maxIntervalError=Math.max(maxIntervalError,Math.abs(err-errors[i-1]));
    }
    results.push({bank,case:test.name,beats:20,maxAttackErrorMs:Math.max(...errors.map(Math.abs)),maxIntervalErrorMs:Math.max(...errors.slice(1).map((e,i)=>Math.abs(e-errors[i]))),lateStarts:starts.filter(s=>s.offset>0).length});
   }
  }
  audioCtx=realCtx;playClick=originalClick;scheduleVisualUpdate=originalVisual;window.setTimeout=nativeTimeout;
  if(maxAttackError>1.1||maxIntervalError>1.1||lateStarts)throw Error(JSON.stringify({maxAttackError,maxIntervalError,lateStarts}));
  return {sampleRate:48000,criterion:'First sustained 10 ms at 20% peak 5 ms RMS, 1 ms hop',maxAttackErrorMs:maxAttackError,maxIntervalErrorMs:maxIntervalError,lateStarts,results};
 });
 save('timing-results.json',result);console.log(JSON.stringify(result,null,2));await browser.close();runtime.server?.close();
})().catch(e=>{console.error(e);process.exit(1)});



