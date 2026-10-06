// Local song library. Storage is scoped to this browser origin; exports are portable.
(() => {
  const KEY='renax-drums-songs-v1';
  const id=()=>crypto.randomUUID();
  const clone=value=>JSON.parse(JSON.stringify(value));
  const blankSection=()=>({id:id(),label:'Couplet 1',count:4,measure:createMeasure(4,4,120)});
  const blankSong=()=>({id:id(),name:'Nouveau morceau',sections:[blankSection()]});
  const defaultLibrary=()=>({version:1,activeProfile:null,profiles:[{id:id(),name:'Mon profil',songs:[]}]});
  let library,selectedSong=null,loaded=null,endTimer=null,storageStatus='Enregistrement automatique';
  try { library=JSON.parse(localStorage.getItem(KEY))||defaultLibrary();validateLibrary(library); }
  catch { library=defaultLibrary(); }
  if(!library.profiles.some(p=>p.id===library.activeProfile))library.activeProfile=library.profiles[0].id;
  function validateLibrary(data) {
    if(data.version!==1||!Array.isArray(data.profiles)||!data.profiles.length)throw Error('Format de bibliothèque incorrect.');
    const ids=new Set();
    for(const p of data.profiles) {
      if(typeof p.id!=='string'||ids.has(p.id)||typeof p.name!=='string'||!Array.isArray(p.songs))throw Error('Profil incorrect.');ids.add(p.id);
      for(const song of p.songs) {
        if(typeof song.id!=='string'||typeof song.name!=='string'||!Array.isArray(song.sections)||!song.sections.length)throw Error('Morceau incorrect.');
        let total=0;
        for(const section of song.sections) {
          const m=section.measure;
          if(typeof section.label!=='string'||!Number.isSafeInteger(section.count)||section.count<1||!m||!Number.isInteger(m.numerator)||m.numerator<1||m.numerator>20||![2,4,8,16,32].includes(m.denominator)||!Number.isFinite(m.tempo)||m.tempo<20||m.tempo>300)throw Error('Section incorrecte.');
          if(!Array.isArray(m.beatSubdivisions)||m.beatSubdivisions.length!==m.numerator||!Array.isArray(m.beatStates)||m.beatStates.length!==m.numerator)throw Error('Subdivisions incorrectes.');
          m.beatSubdivisions.forEach((n,b)=>{if(!allowedSubdivisions(m.denominator).includes(n)||!Array.isArray(m.beatStates[b])||m.beatStates[b].length!==n||m.beatStates[b].some(s=>![0,1,2,3].includes(s)))throw Error('Clic incorrect.');});
          total+=section.count;if(!Number.isSafeInteger(total))throw Error('Nombre de mesures trop grand.');
        }
      }
    }
  }
  const panel=document.querySelector('.panel-seq');
  const sequencePane=document.createElement('div');sequencePane.id='sequencePane';
  while(panel.firstChild)sequencePane.appendChild(panel.firstChild);
  const tabs=document.createElement('div');tabs.className='song-tabs';tabs.setAttribute('role','tablist');
  const songPane=document.createElement('div');songPane.id='songPane';songPane.hidden=true;
  panel.append(tabs,sequencePane,songPane);
  function tab(name) {songPane.hidden=name!=='songs';sequencePane.hidden=name==='songs';tabs.querySelectorAll('button').forEach(b=>b.setAttribute('aria-selected',String(b.dataset.pane===name)));if(name!=='songs')unload();}
  for(const [name,title] of [['sequence','Séquenceur'],['songs','Morceaux']]) {const b=document.createElement('button');b.textContent=title;b.dataset.pane=name;b.setAttribute('role','tab');b.setAttribute('aria-selected',String(name==='sequence'));b.onclick=()=>tab(name);tabs.append(b);}
  function el(tag,text,parent,cls) {const e=document.createElement(tag);if(text!==undefined)e.textContent=text;if(cls)e.className=cls;if(parent)parent.append(e);return e;}
  function button(text,parent,fn) {const b=el('button',text,parent,'btn');b.type='button';b.onclick=fn;return b;}
  function field(text,parent,value,change,options) {const label=el('label',text,parent),input=el(options?'select':'input',undefined,label);if(options)for(const v of options){const o=el('option',String(v),input);o.value=v;}else input.type=typeof value==='number'?'number':'text';input.setAttribute('aria-label',text);input.value=value;input.onchange=()=>change(input.value,input);return input;}
  function profile(){return library.profiles.find(p=>p.id===library.activeProfile);}
  function song(){return profile().songs.find(s=>s.id===selectedSong);}
  function status(message){storageStatus=message;const e=document.getElementById('songStatus');if(e)e.textContent=message;}
  function persist(){try{localStorage.setItem(KEY,JSON.stringify(library));status('Enregistré dans ce navigateur.');return true;}catch{status('Sauvegarde impossible : exporte ta bibliothèque.');return false;}}
  function changed(){unload();resetCustomizationTimer();persist();render();}
  function unload(){if(!loaded)return;stopMetronome();clearTimeout(endTimer);const previous=loaded.previous;loaded=null;measures=previous;metronomeMeasures=previous;activeMeasureIndex=0;playingMeasureIndex=0;currentStepInMeasure=0;measureCountSel.value=String(measures.length);renderSequencerList();renderActiveMeasure();updatePosition();}
  function locate(index){let start=0;for(let i=0;i<loaded.song.sections.length;i++){const s=loaded.song.sections[i];if(index<start+s.count)return {section:s,index:i,start,bar:index-start+1};start+=s.count;}return null;}
  function loadSong(){const s=song();if(!s)return;unload();stopMetronome();endTraining();if(appMode!=='metronome')setAppMode('metronome');setSilentMode(false);resetCustomizationTimer();const previous=metronomeMeasures;const snapshot=clone(s);loaded={song:snapshot,previous,total:snapshot.sections.reduce((n,s)=>n+s.count,0)};
    // Repeat section templates lazily: no array of every bar and no eight-bar limit.
    measures=new Proxy([], {get(target,key){if(key==='length')return loaded.total;if(key==='indexOf')return m=>{if(locate(activeMeasureIndex)?.section.measure===m)return activeMeasureIndex;let n=0;for(const s of loaded.song.sections){if(s.measure===m)return n;n+=s.count;}return -1;};if(typeof key==='string'&&/^\d+$/.test(key))return locate(Number(key))?.section.measure;return Reflect.get(target,key);}});
    metronomeMeasures=measures;activeMeasureIndex=0;playingMeasureIndex=0;currentStepInMeasure=0;renderSequencerList();renderActiveMeasure();updatePosition();
  }
  window.songAtEnd=()=>{if(!loaded||playingMeasureIndex!==0||currentStepInMeasure!==0)return false;clearTimeout(endTimer);endTimer=setTimeout(()=>{stopMetronome();status('Morceau terminé.');},Math.max(0,(nextNoteTime-audioCtx.currentTime)*1000));return true;};
  const originalStop=stopMetronome;stopMetronome=function(){clearTimeout(endTimer);return originalStop();};
  const originalMode=setAppMode;setAppMode=function(mode){unload();return originalMode(mode);};
  panicBtn.addEventListener('click',unload,true);
  function updatePosition(){const e=document.getElementById('songPosition');if(!e)return;if(!loaded){e.textContent='';return;}const p=locate(activeMeasureIndex);e.textContent=loaded.song.name+' · '+p.section.label+' · mesure '+p.bar+'/'+p.section.count+' ('+(activeMeasureIndex+1)+'/'+loaded.total+')';songPane.querySelectorAll('.song-section').forEach((e,i)=>e.classList.toggle('playing',i===p.index));}
  const originalRender=renderSequencerList;renderSequencerList=function(){if(!loaded)return originalRender();measureListEl.replaceChildren();el('p','Morceau chargé : '+loaded.song.name,measureListEl,'song-note');};
  function saveLoadedPattern(){
    if(!loaded)return;
    const source=profile().songs.find(s=>s.id===loaded.song.id),position=locate(activeMeasureIndex);
    const section=source?.sections.find(s=>s.id===position?.section.id);
    if(section&&JSON.stringify(section.measure)!==JSON.stringify(position.section.measure)){section.measure=clone(position.section.measure);persist();}
  }
  const originalPreviews=refreshMeasurePreviews;refreshMeasurePreviews=function(){originalPreviews();saveLoadedPattern();};
  const originalActive=renderActiveMeasure;renderActiveMeasure=function(){originalActive();saveLoadedPattern();updatePosition();};
  function render(){songPane.replaceChildren();const p=profile();if(!p.songs.some(s=>s.id===selectedSong))selectedSong=null;
    const profileSelect=field('Profil local',songPane,p.id,value=>{unload();library.activeProfile=value;selectedSong=null;persist();render();},[]);for(const item of library.profiles){const o=el('option',item.name,profileSelect);o.value=item.id;}profileSelect.value=p.id;
    const profiles=el('div',undefined,songPane,'song-actions');button('Nouveau profil',profiles,()=>{const name=prompt('Nom du profil');if(!name?.trim())return;unload();const p={id:id(),name:name.trim(),songs:[]};library.profiles.push(p);library.activeProfile=p.id;selectedSong=null;persist();render();});button('Renommer',profiles,()=>{const name=prompt('Nom du profil',p.name);if(name?.trim()){p.name=name.trim();persist();render();}});
    const actions=el('div',undefined,songPane,'song-actions');button('Nouveau morceau',actions,()=>{unload();const s=blankSong();p.songs.push(s);selectedSong=s.id;persist();render();});
    const s=song();
    if(!s){
      el('strong','Playlist',songPane);
      if(!p.songs.length)el('p','Crée ton premier morceau pour construire sa structure.',songPane,'song-note');
      for(const item of p.songs){
        const row=el('div',undefined,songPane,'song-section');
        const open=button(item.name,row,()=>{selectedSong=item.id;render();});open.classList.add('song-open');
        el('p',item.sections.length+' sections · '+item.sections.reduce((n,s)=>n+s.count,0)+' mesures',row,'song-note');
        const reorder=el('div',undefined,row,'song-actions'),i=p.songs.indexOf(item);
        button('↑',reorder,()=>{if(i){[p.songs[i-1],p.songs[i]]=[p.songs[i],p.songs[i-1]];persist();render();}});
        button('↓',reorder,()=>{if(i<p.songs.length-1){[p.songs[i+1],p.songs[i]]=[p.songs[i],p.songs[i+1]];persist();render();}});
      }
    }
    if(s){
      button('← Playlist',actions,()=>{unload();selectedSong=null;render();});button('Dupliquer',actions,()=>{const copy=clone(s);copy.id=id();copy.name+=' (copie)';p.songs.push(copy);selectedSong=copy.id;changed();});button('Supprimer',actions,()=>{if(!confirm('Supprimer « '+s.name+' » ?'))return;unload();p.songs=p.songs.filter(x=>x!==s);selectedSong=null;persist();render();});
      field('Titre du morceau',songPane,s.name,value=>{s.name=value.trim()||'Sans titre';changed();});
      const transport=el('div',undefined,songPane,'song-actions');button('Lire le morceau',transport,async()=>{loadSong();await startMetronome();});button('Stop',transport,()=>stopMetronome());
      el('div','',songPane).id='songPosition';
      el('p',s.sections.reduce((n,s)=>n+s.count,0)+' mesures · arrêt à la fin du morceau',songPane,'song-note');
      s.sections.forEach((section,i)=>{const card=el('div',undefined,songPane,'song-section');el('strong','Section '+(i+1),card);const label=field('Libellé',card,section.label,value=>{section.label=value.trim()||'Section '+(i+1);changed();});label.setAttribute('list','songLabels');
        const fields=el('div',undefined,card,'song-fields');const count=field('Mesures',fields,section.count,(value,input)=>{const n=Number(value);if(!Number.isSafeInteger(n)||n<1){input.value=section.count;return;}const total=s.sections.reduce((n,x)=>n+(x===section?0:x.count),0)+n;if(!Number.isSafeInteger(total)){input.value=section.count;return;}section.count=n;changed();});count.min=1;count.step=1;
        const bpm=field('Tempo (BPM)',fields,section.measure.tempo,(v,input)=>{const n=Number(v);if(!Number.isFinite(n)||n<20||n>300){input.value=section.measure.tempo;return;}section.measure.tempo=n;changed();});bpm.min=20;bpm.max=300;
        field('Temps',fields,section.measure.numerator,v=>{const m=section.measure,n=Number(v);m.numerator=n;while(m.beatSubdivisions.length<n){m.beatSubdivisions.push(1);m.beatStates.push([1]);}m.beatSubdivisions.length=n;m.beatStates.length=n;changed();},Array.from({length:20},(_,i)=>i+1));
        field('Dénominateur',fields,section.measure.denominator,v=>{section.measure.denominator=Number(v);normalizeMeasureSubdivisions(section.measure);changed();},[2,4,8,16,32]);
        const controls=el('div',undefined,card,'song-actions');button('Régler le clic',controls,()=>{loadSong();activeMeasureIndex=s.sections.slice(0,i).reduce((n,s)=>n+s.count,0);renderActiveMeasure();if(window.innerWidth<=1100)switchTab('visu');});button('↑',controls,()=>{if(i){[s.sections[i-1],s.sections[i]]=[s.sections[i],s.sections[i-1]];changed();}});button('↓',controls,()=>{if(i<s.sections.length-1){[s.sections[i+1],s.sections[i]]=[s.sections[i],s.sections[i+1]];changed();}});button('Copier',controls,()=>{const copy=clone(section);copy.id=id();s.sections.splice(i+1,0,copy);changed();});if(s.sections.length>1)button('Retirer',controls,()=>{s.sections.splice(i,1);changed();});
      });button('+ Ajouter une section',songPane,()=>{s.sections.push(blankSection());changed();});
    }
    const labels=el('datalist',undefined,songPane);labels.id='songLabels';for(const name of ['Intro','Couplet 1','Couplet 2','Refrain 1','Refrain 2','Bridge','Solo','Outro'])el('option',name,labels).value=name;
    const transfers=el('div',undefined,songPane,'song-actions');button('Exporter',transfers,()=>{const blob=new Blob([JSON.stringify(library,null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=el('a');a.href=url;a.download='renax-morceaux.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);});const importer=el('input',undefined,songPane);importer.type='file';importer.accept='.json,application/json';importer.hidden=true;button('Importer',transfers,()=>importer.click());importer.onchange=async()=>{try{const data=JSON.parse(await importer.files[0].text());validateLibrary(data);unload();for(const imported of data.profiles){const p=clone(imported);p.id=id();p.name+=' (importé)';p.songs.forEach(s=>s.id=id());library.profiles.push(p);}library.activeProfile=library.profiles.at(-1).id;selectedSong=null;persist();render();status('Bibliothèque importée sans remplacer les morceaux existants.');}catch(e){status('Import refusé : '+e.message);}};
    el('p','Profils et morceaux conservés dans ce navigateur. Exporte une copie pour les transférer ou les sauvegarder.',songPane,'song-note');el('div',storageStatus,songPane).id='songStatus';updatePosition();
  }
  // Song playback uses a snapshot; editing the saved arrangement stops its playback.
  // Keep ordinary sequencer and polyrhythm behavior untouched when no song is loaded.
  render();
  window.RENAX_SONGS={validateLibrary,loadSong,unload,locate,get library(){return library;},get loaded(){return loaded;}};
})();
