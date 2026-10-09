/* Read-only Bravura view. Audio, transport, score data and exports stay owned by
   their existing engines. VexFlow is loaded only on the first score request. */
(()=>{
 const panel=document.querySelector('.panel-visu'),wrapper=panel.querySelector('.sequencer-wrapper'),metronomeButton=document.getElementById('scoreMetronomeBtn'),partitionButton=document.getElementById('scorePartitionBtn');
 const host=document.createElement('div');host.className='rhythm-score';host.id='rhythmScore';host.setAttribute('role','img');host.setAttribute('aria-label','Partition rythmique, police Bravura');wrapper.append(host);
 let enabled=false,loading,Flow,core,lastKey='',notes=new Map(),cues=[],active=[],frame=0,redraw=0;
 const status=text=>{host.replaceChildren();const p=document.createElement('div');p.className='rhythm-score-status';p.textContent=text;host.append(p);};
 async function load(){if(!loading)loading=Promise.all([import('./rhythm-score-core.mjs?v=20261009-score'),new Promise((resolve,reject)=>{if(window.Vex)return resolve();const script=document.createElement('script');script.src='vendor/vexflow-bravura-4.2.5.js';script.onload=resolve;script.onerror=()=>{script.remove();reject(new Error('Impossible de charger la partition. Réessaie avec Partition.'));};document.head.append(script);})]).then(([module])=>{core=module;Flow=window.Vex.Flow||window.Vex;Flow.setMusicFont('Bravura');}).catch(error=>{loading=null;throw error;});return loading;}
 function clearHeads(){for(const item of active)for(const head of item.heads)head.classList.remove('score-active-head');active=[];}
 function remember(note,key,state){const element=note.getSVGElement();const heads=element?Array.from(element.querySelectorAll('.vf-notehead')):[];notes.set(key,{heads,state});}
 function makeNote(duration,state){const note=new Flow.StaveNote({keys:['b/4'],clef:'percussion',duration:duration+(state?'':'r'),stem_direction:1});return note;}
 function draw(){
  if(!enabled||!Flow)return;const measure=measures[activeMeasureIndex];if(!measure)return;
  const width=Math.floor(host.clientWidth-10);if(width<100)return;
  const key=JSON.stringify([appMode,activeMeasureIndex,width,measure.numerator,measure.denominator,measure.beatSubdivisions,measure.beatStates,measure.outerStates,measure.innerStates]);if(key===lastKey)return;lastKey=key;const continuing=active.map(item=>({key:item.key,end:item.end}));clearHeads();notes=new Map();host.replaceChildren();
  try{
   const poly=appMode==='polyrhythm',beats=poly?null:core.scoreBeats(measure),rows=poly?[null]:core.scoreRows(beats,width);
   const renderWidth=poly?Math.max(width,Math.max(measure.numerator,measure.denominator)*30+100):Math.max(width,...rows.map(row=>row.reduce((sum,b)=>sum+Math.max(46,b.count*25+12),84)));
   const height=poly?270:rows.length*140+18,renderer=new Flow.Renderer(host,Flow.Renderer.Backends.SVG);renderer.resize(renderWidth,height);const context=renderer.getContext();context.setFillStyle('#111').setStrokeStyle('#111');
   rows.forEach((row,rowIndex)=>{
    const voices=[],tuplets=[],beams=[];const stave=new Flow.Stave(2,18+rowIndex*140,renderWidth-4);stave.addClef('percussion');if(rowIndex===0)stave.addTimeSignature(`${measure.numerator}/${poly?4:measure.denominator}`);if(!poly&&rowIndex<rows.length-1)stave.setEndBarType(Flow.Barline.type.NONE);stave.setContext(context).draw();
    if(poly){
     const lanes=[];
     for(const [lane,count,states] of [['outer',measure.numerator,measure.outerStates],['inner',measure.denominator,measure.innerStates]]){
      const target=lane==='outer'?stave:new Flow.Stave(2,148,renderWidth-4).addClef('percussion').addTimeSignature(`${measure.numerator}/4`).setContext(context);if(lane==='inner')target.draw();
      const ns=Array.from({length:count},(_,i)=>makeNote('4',states[i]||0));const tuplet=lane==='inner'&&count!==measure.numerator?new Flow.Tuplet(ns,{num_notes:count,notes_occupied:measure.numerator,bracketed:true,ratioed:true}):null;
      const voice=new Flow.Voice({num_beats:measure.numerator,beat_value:4}).addTickables(ns);lanes.push({lane,states,ns,tuplet,voice,target});
     }
     const formatter=new Flow.Formatter();for(const item of lanes)formatter.joinVoices([item.voice]);formatter.format(lanes.map(item=>item.voice),renderWidth-90);
     for(const {voice,target,tuplet,ns,lane,states} of lanes){voice.draw(context,target);tuplet?.setContext(context).draw();ns.forEach((note,i)=>remember(note,`${lane}:${i}`,states[i]||0));}return;
    }
    const ns=[];for(const beat of row){const group=beat.notes.map(n=>makeNote(beat.duration,n.state));if(beat.tuplet)tuplets.push(new Flow.Tuplet(group,{num_notes:beat.count,notes_occupied:beat.tuplet.normal,bracketed:true,ratioed:beat.count!==3}));if(Number(beat.duration)>=8)beams.push(...Flow.Beam.generateBeams(group,{beam_rests:true,show_stemlets:true,maintain_stem_directions:true}));ns.push(...group);}
    const voice=new Flow.Voice({num_beats:row.length,beat_value:measure.denominator}).addTickables(ns);voices.push(voice);new Flow.Formatter().joinVoices(voices).format(voices,renderWidth-90);voice.draw(context,stave);beams.forEach(b=>b.setContext(context).draw());tuplets.forEach(t=>t.setContext(context).draw());let i=0;for(const beat of row)for(const n of beat.notes)remember(ns[i++],`${n.beat}:${n.sub}`,n.state);
   });
   host.dataset.font='Bravura';host.dataset.measure=String(activeMeasureIndex);host.dataset.noteCount=String(notes.size);
   for(const item of continuing){const note=notes.get(item.key);if(isPlaying&&note?.state&&item.end>audioCtx.currentTime){for(const head of note.heads)head.classList.add('score-active-head');active.push({...note,...item});}}
  }catch(error){lastKey='';status('La partition de ce rythme ne peut pas être affichée.');console.error('Rhythm score:',error);}
 }
 function refresh(){if(!enabled||redraw)return;redraw=requestAnimationFrame(()=>{redraw=0;draw();});}
 function tick(){frame=0;if(!enabled)return;if(!isPlaying){cues=[];clearHeads();return;}const now=audioCtx?.currentTime||0;
  for(const item of active.filter(item=>now>=item.end))for(const head of item.heads)head.classList.remove('score-active-head');active=active.filter(item=>now<item.end);
  while(cues.length&&cues[0].time<=now){const cue=cues.shift();if(!isPlaying||cue.measure!==activeMeasureIndex)continue;draw();const note=notes.get(cue.key);if(!note?.state||!cue.audible||now>=cue.end)continue;for(const head of note.heads)head.classList.add('score-active-head');active.push({...note,key:cue.key,end:cue.end});
   const head=note.heads[0];if(head){const bounds=head.getBoundingClientRect(),viewport=host.getBoundingClientRect();if(bounds.top<viewport.top+20||bounds.bottom>viewport.bottom-20)host.scrollTop+=bounds.top-viewport.top-host.clientHeight/2;if(bounds.left<viewport.left+20||bounds.right>viewport.right-20)host.scrollLeft+=bounds.left-viewport.left-host.clientWidth/2;}}
  if(isPlaying||cues.length||active.length)frame=requestAnimationFrame(tick);
 }
 function wake(){if(enabled&&!frame)frame=requestAnimationFrame(tick);}
 function enqueue(cue){cues.push(cue);cues.sort((a,b)=>a.time-b.time);if(cues.length>256)cues.splice(0,cues.length-256);wake();}
 const render=renderActiveMeasure;renderActiveMeasure=function(...args){const result=render.apply(this,args);refresh();return result;};
 const subdivisions=renderSubdivisionDots;renderSubdivisionDots=function(...args){const result=subdivisions.apply(this,args);refresh();return result;};
 const visual=scheduleVisualUpdate;scheduleVisualUpdate=function(mIdx,sIdx,time,position){const result=visual.apply(this,arguments);const m=measures[mIdx],p=position||getBeatAndSub(m,sIdx);enqueue({measure:mIdx,key:`${p.beat}:${p.subIndex}`,time,end:time+(p.durationMs||getStepDurationMs(getEffectiveTempo(m),m.denominator,m.beatSubdivisions[p.beat]))/1000,audible:isSilentCycleAudible()});return result;};
 const polyVisual=schedulePolyVisualUpdate;schedulePolyVisualUpdate=function(mIdx,event,time){const result=polyVisual.apply(this,arguments),m=measures[mIdx],cycle=m.numerator*60/getEffectiveTempo(m);if(event.outer)enqueue({measure:mIdx,key:`outer:${event.outerIndex}`,time,end:time+cycle/m.numerator,audible:true});if(event.inner)enqueue({measure:mIdx,key:`inner:${event.innerIndex}`,time,end:time+cycle/m.denominator,audible:true});return result;};
 const stop=stopMetronome;stopMetronome=function(...args){const result=stop.apply(this,args);cues=[];clearHeads();cancelAnimationFrame(frame);frame=0;refresh();return result;};
 async function setView(next){
  if(enabled===next&&(!next||Flow))return;enabled=next;partitionButton.setAttribute('aria-pressed',String(enabled));metronomeButton.setAttribute('aria-pressed',String(!enabled));partitionButton.classList.toggle('active',enabled);metronomeButton.classList.toggle('active',!enabled);panel.classList.toggle('score-view',enabled);
  if(!enabled){clearHeads();cancelAnimationFrame(frame);frame=0;return;}
  status('Chargement de la partition…');try{await load();if(!enabled)return;lastKey='';draw();wake();}catch(error){if(enabled)status(error.message);}
 }
 partitionButton.addEventListener('click',()=>setView(true));metronomeButton.addEventListener('click',()=>setView(false));
 new ResizeObserver(refresh).observe(wrapper);
 window.RENAX_SCORE={get enabled(){return enabled;},refresh,get snapshot(){return {font:'Bravura',notes:notes.size,queued:cues.length,active:active.length};}};
})();
