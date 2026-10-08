// Local song library. Storage is scoped to this browser origin; exports are portable.
(() => {
  const KEY='renax-drums-songs-v1';
  const id=()=>crypto.randomUUID();
  const clone=value=>JSON.parse(JSON.stringify(value));
  function durationText(song){const seconds=Math.round(song.sections.reduce((total,section)=>total+section.count*section.measure.numerator*(4/section.measure.denominator)*60/section.measure.tempo,0));return Math.floor(seconds/60)+':'+String(seconds%60).padStart(2,'0');}
  const blankSection=()=>({id:id(),label:'Couplet 1',count:4,measure:createMeasure(4,4,120)});
  const blankSong=()=>({id:id(),name:'Nouveau morceau',sections:[blankSection()]});
  const defaultLibrary=()=>({version:1,activeProfile:null,profiles:[{id:id(),name:'Mon profil',songs:[]}]});
  let library,selectedSong=null,loaded=null,endTimer=null,songView='home',openSectionId=null,storageStatus='Enregistrement automatique';
  try { library=JSON.parse(RENAX_STORAGE.read())||defaultLibrary();validateLibrary(library); }
  catch (error) { RENAX_STORAGE.markCorrupt();library=defaultLibrary();storageStatus='Sauvegarde locale illisible : la source a été conservée. Exportez vos données avant de continuer.'; }
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
  const profilePane=document.createElement('div');profilePane.id='profilePane';profilePane.hidden=true;
  const songsHome=document.createElement('div');songsHome.id='songsHome';
  const songsRoot=document.createElement('div');songsRoot.id='songsRoot';songsRoot.hidden=true;
  songsRoot.append(songsHome,profilePane,songPane);panel.append(tabs,sequencePane,songsRoot);
  function tab(name) {songsRoot.hidden=name!=='songs';sequencePane.hidden=name!=='sequence';tabs.querySelectorAll('button').forEach(b=>b.setAttribute('aria-selected',String(b.dataset.pane===name)));if(name==='sequence')unload();else selectOpenBlock();syncSongTransport();panel.scrollTop=0;}
  for(const [name,title] of [['sequence','Séquenceur'],['songs','Morceaux']]) {const b=document.createElement('button');b.textContent=title;b.dataset.pane=name;b.setAttribute('role','tab');b.setAttribute('aria-selected',String(name==='sequence'));b.onclick=()=>tab(name);tabs.append(b);}
  function navigate(view){if(view==='home'||view==='playlists'||view==='playlist'){unload();selectedSong=null;}songView=view;render();panel.scrollTop=0;}
  function el(tag,text,parent,cls) {const e=document.createElement(tag);if(text!==undefined)e.textContent=text;if(cls)e.className=cls;if(parent)parent.append(e);return e;}
  function button(text,parent,fn) {const b=el('button',text,parent,'btn');b.type='button';b.onclick=fn;return b;}
  function field(text,parent,value,change,options) {const label=el('label',text,parent),input=el(options?'select':'input',undefined,label);if(options)for(const v of options){const o=el('option',String(v),input);o.value=v;}else input.type=typeof value==='number'?'number':'text';input.setAttribute('aria-label',text);input.value=value;input.onchange=()=>change(input.value,input);return input;}
  function songNumbox(label,parent,value,commit,values){
    const options=[...new Set([...values,value])].sort((a,b)=>a-b);
    const select=field(label,parent,value,(raw,control)=>{
      if(raw==='custom'){
        const entry=prompt(label+' : saisir une valeur',String(value));
        if(entry===null){control.value=String(value);syncNumbox(control);return;}
        raw=entry;
      }
      commit(raw,control);
      syncNumbox(control);
    },options);
    const custom=el('option','Autre…',select);custom.value='custom';
    const row=select.parentElement;row.className='song-inline-field';
    enhanceNumboxSelect(select);
    row.querySelector('.numbox-button').setAttribute('aria-label',label+' : '+value);
    return select;
  }
  function profile(){return library.profiles.find(p=>p.id===library.activeProfile);}
  function song(){return profile().songs.find(s=>s.id===selectedSong);}
  function status(message){storageStatus=message;const e=document.getElementById('songStatus');if(e)e.textContent=message;}
  function persist(){try{RENAX_STORAGE.write(library);window.dispatchEvent(new Event('renax-library-edited'));status('Sauvegardé dans ce navigateur');return true;}catch{status('Sauvegarde locale impossible : exporte ta bibliothèque.');return false;}}
  function changed(){unload();resetCustomizationTimer();persist();render();}
  function unload(){if(!loaded)return;stopMetronome();clearTimeout(endTimer);const previous=loaded.previous;loaded=null;measures=previous;metronomeMeasures=previous;activeMeasureIndex=0;playingMeasureIndex=0;currentStepInMeasure=0;measureCountSel.value=String(measures.length);renderSequencerList();renderActiveMeasure();updatePosition();}
  function locate(index){let start=0;for(let i=0;i<loaded.song.sections.length;i++){const s=loaded.song.sections[i];if(index<start+s.count)return {section:s,index:i,start,bar:index-start+1};start+=s.count;}return null;}
  function loadSong(){const s=song();if(!s)return;unload();stopMetronome();endTraining();if(appMode!=='metronome')setAppMode('metronome');setSilentMode(false);resetCustomizationTimer();const previous=metronomeMeasures;const snapshot=clone(s);loaded={song:snapshot,previous,total:snapshot.sections.reduce((n,s)=>n+s.count,0)};
    // Repeat section templates lazily: no array of every bar and no eight-bar limit.
    measures=new Proxy([], {get(target,key){if(key==='length')return loaded.total;if(key==='indexOf')return m=>{if(locate(activeMeasureIndex)?.section.measure===m)return activeMeasureIndex;let n=0;for(const s of loaded.song.sections){if(s.measure===m)return n;n+=s.count;}return -1;};if(typeof key==='string'&&/^\d+$/.test(key))return locate(Number(key))?.section.measure;return Reflect.get(target,key);}});
    metronomeMeasures=measures;activeMeasureIndex=0;playingMeasureIndex=0;currentStepInMeasure=0;renderSequencerList();renderActiveMeasure();updatePosition();
  }
  window.songAtEnd=()=>{if(!loaded||playingMeasureIndex!==0||currentStepInMeasure!==0)return false;clearTimeout(endTimer);endTimer=setTimeout(()=>{stopMetronome();status('Morceau terminé.');},Math.max(0,(nextNoteTime-audioCtx.currentTime)*1000));return true;};
  function syncSongTransport(){
    const songContext=!!(loaded||(!songsRoot.hidden&&songView==='detail'&&song()));
    playBtn.dataset.songTransport=String(songContext);
    if(!isPlaying)playBtn.textContent=songContext?'Lire le morceau':'Start';
  }
  const originalStart=startMetronome;startMetronome=function(){
    if(!isPlaying&&!loaded&&!songsRoot.hidden&&songView==='detail'&&song())loadSong();
    return originalStart();
  };
  const originalStop=stopMetronome;stopMetronome=function(...args){clearTimeout(endTimer);const result=originalStop(...args);syncSongTransport();return result;};
  const originalMode=setAppMode;setAppMode=function(mode){unload();return originalMode(mode);};
  panicBtn.addEventListener('click',unload,true);
  function updatePosition(){
    const cards=songPane.querySelectorAll('.song-section');
    if(!loaded){cards.forEach(card=>card.classList.remove('active','playing'));return;}
    const position=locate(activeMeasureIndex);if(!position)return;
    cards.forEach((card,index)=>{card.classList.toggle('playing',isPlaying&&index===position.index);card.classList.toggle('active',index===position.index);});refreshSongCards();
  }

  const originalRender=renderSequencerList;renderSequencerList=function(){if(!loaded)return originalRender();measureListEl.replaceChildren();el('p','Morceau chargé : '+loaded.song.name,measureListEl,'song-note');};
  function setSectionOpen(sectionId){
    openSectionId=sectionId;
    songPane.querySelectorAll('[data-section-id]').forEach(card=>{
      const expanded=card.dataset.sectionId===sectionId;
      card.classList.toggle('collapsed',!expanded);
      card.querySelector('.song-block-header').setAttribute('aria-expanded',String(expanded));
    });
  }
  function selectOpenBlock(){
    const current=song();if(isPlaying||songsRoot.hidden||songView!=='detail'||!current)return;
    const index=current.sections.findIndex(section=>section.id===openSectionId);if(index<0)return;
    if(loaded&&loaded.song.id===current.id&&locate(activeMeasureIndex)?.section.id===openSectionId)return;
    loadSong();activeMeasureIndex=current.sections.slice(0,index).reduce((n,section)=>n+section.count,0);renderActiveMeasure();
  }
  function refreshSongCards(){
    const current=song();if(!current)return;
    const duration=document.getElementById('songDuration');if(duration)duration.textContent=current.sections.reduce((n,section)=>n+section.count,0)+' mesures · Durée totale : '+durationText(current)+' · arrêt à la fin du morceau';
    songPane.querySelectorAll('[data-section-id]').forEach(card=>{
      const section=current.sections.find(s=>s.id===card.dataset.sectionId);if(!section)return;
      card.querySelector('.measure-sig').textContent=section.measure.numerator+'/'+section.measure.denominator;
      card.querySelector('.song-block-summary').firstChild.textContent=section.count+' mesures · '+section.measure.numerator+'/'+section.measure.denominator+' · '+section.measure.tempo+' BPM';
      const preview=card.querySelector('.measure-preview');preview.replaceChildren();
      for(const states of section.measure.beatStates){const group=el('div',undefined,preview,'preview-beat');for(const state of states)el('span',undefined,group,'preview-dot').dataset.state=state;}
      const bpm=card.querySelector('select[aria-label="Tempo (BPM)"]');if(document.activeElement!==bpm){if(![...bpm.options].some(o=>Number(o.value)===section.measure.tempo)){const option=el('option',String(section.measure.tempo),bpm);option.value=section.measure.tempo;numboxWidgets.get(bpm)?.rebuild();}bpm.value=section.measure.tempo;syncNumbox(bpm);bpm.closest('.numbox-custom').querySelector('.numbox-button').setAttribute('aria-label','Tempo (BPM) : '+section.measure.tempo);}
    });
  }
  document.addEventListener('input',e=>{if(loaded&&e.target.matches('#bpmSlider,.measure-tempo-input'))queueMicrotask(()=>{saveLoadedPattern();refreshSongCards();});});
  function saveLoadedPattern(){
    if(!loaded)return;
    const source=profile().songs.find(s=>s.id===loaded.song.id),position=locate(activeMeasureIndex);
    const section=source?.sections.find(s=>s.id===position?.section.id);
    if(section&&JSON.stringify(section.measure)!==JSON.stringify(position.section.measure)){section.measure=clone(position.section.measure);persist();}
  }
  const originalPreviews=refreshMeasurePreviews;refreshMeasurePreviews=function(){originalPreviews();saveLoadedPattern();refreshSongCards();};
  const originalActive=renderActiveMeasure;renderActiveMeasure=function(){originalActive();saveLoadedPattern();updatePosition();};
  let suppressSongClickUntil=0;
  songPane.addEventListener('click',e=>{if(performance.now()<suppressSongClickUntil){e.preventDefault();e.stopImmediatePropagation();}},true);
  function enableSongDrag(row,item,p,isBlock=false){
    row.dataset.songId=item.id;
    let gesture=null,holdTimer=null,scrollFrame=null,placeholder=null,originalStyle=null;
    function clearMarks(){songPane.querySelectorAll('.drop-before,.drop-after').forEach(e=>e.classList.remove('drop-before','drop-after'));}
    function markDrop(){
      if(!gesture?.active)return;
      row.style.top=(gesture.y-gesture.offsetY)+'px';
      row.style.left=(gesture.x-gesture.offsetX)+'px';
      const rect=panel.getBoundingClientRect();gesture.valid=gesture.x>=rect.left&&gesture.x<=rect.right;
      const others=[...songPane.querySelectorAll(isBlock?'[data-section-id]':'.song-playlist-card')].filter(e=>e!==row);
      const gap=placeholder.getBoundingClientRect(),gapStyle=getComputedStyle(placeholder),gapHeight=gap.height+parseFloat(gapStyle.marginTop)+parseFloat(gapStyle.marginBottom);
      const before=others.findIndex(e=>{const r=e.getBoundingClientRect();const top=r.top>=gap.bottom?r.top-gapHeight:r.top;return gesture.y<top+r.height/2;});
      gesture.index=before<0?others.length:before;
      const target=others[gesture.index];
      if(target)target.before(placeholder);else if(others.length)others.at(-1).after(placeholder);
      placeholder.style.opacity=gesture.valid?'1':'.35';
    }
    function autoScroll(){
      if(!gesture?.active)return;
      const rect=panel.getBoundingClientRect(),speed=gesture.y<rect.top+28?-9:gesture.y>rect.bottom-28?9:0;
      if(speed){panel.scrollTop+=speed;markDrop();}
      scrollFrame=requestAnimationFrame(autoScroll);
    }
    function activate(){
      if(!gesture||gesture.scrolling)return;
      gesture.active=true;clearTimeout(holdTimer);
      const rect=row.getBoundingClientRect(),rowStyle=getComputedStyle(row);gesture.offsetX=gesture.startX-rect.left;gesture.offsetY=gesture.startY-rect.top;
      originalStyle=row.getAttribute('style');
      placeholder=document.createElement('div');placeholder.className='song-drag-placeholder';
      Object.assign(placeholder.style,{height:rect.height+'px',flexShrink:'0',boxSizing:'border-box',border:'1px dashed var(--orange)',borderRadius:'8px',background:'rgba(255,107,0,.06)',marginTop:rowStyle.marginTop,marginBottom:rowStyle.marginBottom});
      row.before(placeholder);
      Object.assign(row.style,{position:'fixed',transition:'none',width:rect.width+'px',height:rect.height+'px',boxSizing:'border-box',margin:'0',zIndex:'1000',pointerEvents:'none',opacity:'.92',boxShadow:'0 12px 32px rgba(0,0,0,.5)',borderColor:'var(--orange)'});
      row.classList.add('dragging');row.setPointerCapture(gesture.id);markDrop();scrollFrame=requestAnimationFrame(autoScroll);
    }
    row.addEventListener('pointerdown',e=>{
      if(e.button!==0||!e.isPrimary||e.target.closest('.song-more-wrap')||(isBlock&&e.target.closest('input,select,label,button:not(.song-block-header)')))return;
      gesture={id:e.pointerId,x:e.clientX,y:e.clientY,startX:e.clientX,startY:e.clientY,scrollTop:panel.scrollTop,active:false,scrolling:false,index:0,valid:false};
      holdTimer=setTimeout(activate,250);
    });
    row.addEventListener('pointermove',e=>{
      if(!gesture||gesture.id!==e.pointerId)return;gesture.x=e.clientX;gesture.y=e.clientY;
      const moved=Math.hypot(e.clientX-gesture.startX,e.clientY-gesture.startY)>8;
      if(!gesture.active&&moved){if(e.pointerType==='touch'){gesture.scrolling=true;clearTimeout(holdTimer);}else activate();}
      if(gesture.scrolling){panel.scrollTop=gesture.scrollTop+gesture.startY-e.clientY;e.preventDefault();return;}
      if(gesture.active){e.preventDefault();markDrop();}
    });
    function finish(e,cancelled=false){
      if(!gesture||gesture.id!==e.pointerId)return;
      clearTimeout(holdTimer);cancelAnimationFrame(scrollFrame);row.classList.remove('dragging');clearMarks();
      const done=gesture;gesture=null;
      if(done.active){placeholder?.remove();placeholder=null;if(originalStyle===null)row.removeAttribute('style');else row.setAttribute('style',originalStyle);originalStyle=null;}
      if(done.active||done.scrolling)suppressSongClickUntil=performance.now()+150;
      if(row.hasPointerCapture(e.pointerId))row.releasePointerCapture(e.pointerId);
      if(done.active&&done.valid&&!cancelled){const items=isBlock?p.sections:p.songs,previous=items.indexOf(item);items.splice(previous,1);items.splice(done.index,0,item);if(isBlock)changed();else{persist();render();}}
    }
    row.addEventListener('pointerup',e=>finish(e));row.addEventListener('pointercancel',e=>finish(e,true));row.addEventListener('lostpointercapture',e=>finish(e,true));
  }
  function duplicateSongTo(source,target,rename=true){const copy=clone(source);copy.id=id();copy.sections.forEach(section=>section.id=id());if(rename)copy.name+=' (copie)';target.songs.push(copy);return copy;}
  function choosePlaylist(source,mode){
    const p=profile();
    const targets=library.profiles.filter(candidate=>mode==='move'?candidate.id!==p.id:true);
    if(!targets.length){status('Aucune autre playlist disponible.');return;}
    const labels=targets.map((candidate,index)=>(index+1)+' — '+(candidate.name==='Mon profil'?'Mes morceaux':candidate.name));
    const raw=prompt((mode==='move'?'Déplacer':'Copier')+' « '+source.name+' » vers :\n'+labels.join('\n')+'\n\nNuméro de la playlist');
    if(raw===null)return;const target=targets[Number(raw)-1];if(!target){status('Playlist non reconnue.');return;}
    if(mode==='copy'){duplicateSongTo(source,target,false);persist();status('Morceau copié dans '+(target.name==='Mon profil'?'Mes morceaux':target.name)+'.');}
    else{unload();p.songs=p.songs.filter(song=>song!==source);target.songs.push(source);selectedSong=null;persist();render();status('Morceau déplacé dans '+(target.name==='Mon profil'?'Mes morceaux':target.name)+'.');}
  }
  function addSongMenu(row,item){
    const p=profile();
    const wrap=el('div',undefined,row,'song-more-wrap'),trigger=button('⋯',wrap,()=>{const opening=menu.hidden;songPane.querySelectorAll('.song-more-menu').forEach(other=>other.hidden=true);songPane.querySelectorAll('.song-more').forEach(other=>other.setAttribute('aria-expanded','false'));menu.hidden=!opening;trigger.setAttribute('aria-expanded',String(opening));});
    trigger.className='song-more';trigger.setAttribute('aria-label','Actions pour '+item.name);trigger.setAttribute('aria-haspopup','menu');trigger.setAttribute('aria-expanded','false');
    const menu=el('div',undefined,wrap,'song-more-menu');menu.hidden=true;menu.setAttribute('role','menu');
    const action=(label,fn)=>{const b=button(label,menu,e=>{menu.hidden=true;trigger.setAttribute('aria-expanded','false');fn(e);});b.setAttribute('role','menuitem');return b;};
    action('Dupliquer',()=>{duplicateSongTo(item,p,true);persist();render();});
    action('Déplacer vers…',()=>choosePlaylist(item,'move'));
    action('Copier vers…',()=>choosePlaylist(item,'copy'));
    action('Supprimer',()=>{if(!confirm('Supprimer « '+item.name+' » ?'))return;unload();p.songs=p.songs.filter(song=>song!==item);if(selectedSong===item.id)selectedSong=null;persist();render();});
    wrap.addEventListener('click',e=>e.stopPropagation());
    wrap.addEventListener('keydown',e=>{if(e.key==='Escape'){menu.hidden=true;trigger.setAttribute('aria-expanded','false');trigger.focus();}});
  }
  function render(){songPane.replaceChildren();profilePane.replaceChildren();songsHome.replaceChildren();
    songsHome.hidden=songView!=='home';profilePane.hidden=songView!=='profile';songPane.hidden=!['playlists','playlist','detail'].includes(songView);
    button('Sauvegarde',songsHome,()=>navigate('profile')).classList.add('song-entry');
    button('Playlist',songsHome,()=>navigate('playlists')).classList.add('song-entry');
    const backProfile=button('Retour',profilePane,()=>navigate('home'));backProfile.classList.add('song-back');backProfile.setAttribute('aria-label','Retour aux morceaux');
    const backSong=button('Retour',songPane,()=>navigate(songView==='detail'?'playlist':songView==='playlist'?'playlists':'home'));backSong.classList.add('song-back');backSong.setAttribute('aria-label',songView==='detail'?'Retour à la playlist':songView==='playlist'?'Retour aux playlists':'Retour aux morceaux');
const p=profile();if(!p.songs.some(s=>s.id===selectedSong))selectedSong=null;
    const createPlaylist=()=>{const name=prompt('Nom de la playlist');if(!name?.trim())return;unload();const created={id:id(),name:name.trim(),songs:[]};library.profiles.push(created);library.activeProfile=created.id;selectedSong=null;songView='playlist';persist();render();};
    const openPlaylist=item=>{unload();library.activeProfile=item.id;selectedSong=null;songView='playlist';persist();render();panel.scrollTop=0;};
    if(songView==='playlists'){
      const overview=el('section',undefined,songPane,'playlist-overview');
      const heading=el('div',undefined,overview,'playlist-overview-head');el('strong','Playlists',heading);
      button('Nouvelle playlist',heading,createPlaylist).classList.add('playlist-create');
      const list=el('div',undefined,overview,'playlist-list');
      for(const item of library.profiles){
        const entry=el('div',undefined,list);entry.style.position='relative';
        const choice=button('',entry,()=>openPlaylist(item));choice.style.paddingRight='58px';choice.classList.add('playlist-choice');choice.setAttribute('aria-label','Ouvrir la playlist '+(item.name==='Mon profil'?'Mes morceaux':item.name));
        const name=el('strong',item.name==='Mon profil'?'Mes morceaux':item.name,choice,'playlist-choice-name');
        el('span',item.songs.length+' morceau'+(item.songs.length===1?'':'x'),choice,'playlist-choice-count');
        const controls=el('div',undefined,entry,'song-more-wrap');controls.style.top='8px';controls.style.bottom='auto';
        const trigger=button('⋯',controls,()=>{const opening=menu.hidden;songPane.querySelectorAll('.song-more-menu').forEach(other=>other.hidden=true);songPane.querySelectorAll('.song-more').forEach(other=>other.setAttribute('aria-expanded','false'));menu.hidden=!opening;trigger.setAttribute('aria-expanded',String(opening));});
        trigger.className='song-more';trigger.setAttribute('aria-label','Actions de la playlist '+(item.name==='Mon profil'?'Mes morceaux':item.name));trigger.setAttribute('aria-haspopup','menu');trigger.setAttribute('aria-expanded','false');
        const menu=el('div',undefined,controls,'song-more-menu');menu.hidden=true;menu.setAttribute('role','menu');menu.style.top='36px';menu.style.bottom='auto';
        const remove=button('Supprimer',menu,()=>{menu.hidden=true;trigger.setAttribute('aria-expanded','false');if(!confirm('Supprimer la playlist « '+(item.name==='Mon profil'?'Mes morceaux':item.name)+' » et ses '+item.songs.length+' morceau(x) ?'))return;
          if(library.activeProfile===item.id)unload();library.profiles=library.profiles.filter(candidate=>candidate!==item);
          if(!library.profiles.length)library.profiles=defaultLibrary().profiles;
          if(!library.profiles.some(candidate=>candidate.id===library.activeProfile)){library.activeProfile=library.profiles[0].id;selectedSong=null;openSectionId=null;}
          persist();render();});remove.setAttribute('role','menuitem');
        controls.addEventListener('keydown',e=>{if(e.key==='Escape'){e.stopPropagation();menu.hidden=true;trigger.setAttribute('aria-expanded','false');trigger.focus();}});
      }
    }
    const localProfiles=el('section',undefined,songPane,'playlist-manager');localProfiles.hidden=songView!=='playlist';
    const playlistHeading=el('div',undefined,localProfiles,'playlist-heading');
    el('strong',p.name==='Mon profil'?'Mes morceaux':p.name,playlistHeading,'playlist-heading-name');
    button('Renommer',playlistHeading,()=>{const name=prompt('Nom de la playlist',p.name==='Mon profil'?'Mes morceaux':p.name);if(name?.trim()){p.name=name.trim();persist();render();}}).classList.add('playlist-rename');
    const actions=songView==='playlists'?null:el('div',undefined,songPane,'song-actions');
    const s=song();
    if(songView==='playlist'&&!s){
      button('Nouveau morceau',actions,()=>{unload();const s=blankSong();p.songs.push(s);selectedSong=s.id;openSectionId=s.sections[0].id;songView='detail';persist();render();panel.scrollTop=0;});
      if(!p.songs.length)el('p','Crée ton premier morceau pour construire sa structure.',songPane,'song-note');
      for(const item of p.songs){
        const row=el('div',undefined,songPane,'song-section measure-card song-playlist-card');enableSongDrag(row,item,p);
        const openSong=()=>{selectedSong=item.id;openSectionId=item.sections[0].id;songView='detail';render();panel.scrollTop=0;};
        row.tabIndex=0;row.setAttribute('aria-label','Ouvrir '+item.name);
        row.addEventListener('click',e=>{if(!e.target.closest('.song-open'))openSong();});
        row.addEventListener('keydown',e=>{if(e.target===row&&(e.key==='Enter'||e.key===' ')){e.preventDefault();e.stopPropagation();openSong();}});
        const open=button('',row,openSong);open.className='song-open measure-head';open.setAttribute('aria-label',item.name);
        el('span',item.name,open,'measure-num');
        const meters=[...new Set(item.sections.map(s=>s.measure.numerator+'/'+s.measure.denominator))];
        const signature=el('span',meters.length===1?meters[0]:'Mixte',open,'measure-sig');signature.title=meters.join(' · ');
        const tempos=item.sections.map(s=>s.measure.tempo),min=Math.min(...tempos),max=Math.max(...tempos);
        const tempoRow=el('div',undefined,row,'measure-tempo-row');el('span','TEMPO',tempoRow,'measure-tempo-label');el('span',min===max?String(min):min+'–'+max,tempoRow,'song-tempo-value');el('span','BPM',tempoRow,'measure-tempo-unit');
        el('p',item.sections.length+' sections · '+item.sections.reduce((n,s)=>n+s.count,0)+' mesures · '+durationText(item),row,'song-playlist-summary');
        const preview=el('div',undefined,row,'measure-preview');preview.title='Début du morceau';for(const states of item.sections[0].measure.beatStates){const group=el('div',undefined,preview,'preview-beat');for(const state of states)el('span',undefined,group,'preview-dot').dataset.state=state;}
        addSongMenu(row,item);

      }
    }
    if(s){
      if(openSectionId!==null&&!s.sections.some(section=>section.id===openSectionId))openSectionId=s.sections[0].id;
      button('Dupliquer',actions,()=>{const copy=clone(s);copy.id=id();copy.name+=' (copie)';p.songs.push(copy);selectedSong=copy.id;changed();});
      field('Titre du morceau',songPane,s.name,value=>{s.name=value.trim()||'Sans titre';changed();});
      el('p','Sélectionne un bloc pour le régler dans le métronome.',songPane,'song-note');
      el('p',s.sections.reduce((n,s)=>n+s.count,0)+' mesures · Durée totale : '+durationText(s)+' · arrêt à la fin du morceau',songPane,'song-note').id='songDuration';
      s.sections.forEach((section,i)=>{const card=el('div',undefined,songPane,'song-section measure-card');card.dataset.sectionId=section.id;enableSongDrag(card,section,s,true);card.style.touchAction='none';card.tabIndex=0;card.setAttribute('role','group');
        const head=el('button',undefined,card,'measure-head song-block-header');head.type='button';
        const title=el('span',section.label||'Bloc '+(i+1),head,'measure-num');
        el('span',section.measure.numerator+'/'+section.measure.denominator,head,'measure-sig');
        const summary=el('div',section.count+' mesures · '+section.measure.numerator+'/'+section.measure.denominator+' · '+section.measure.tempo+' BPM',card,'song-block-summary');
        const body=el('div',undefined,card,'song-block-body');body.id='song-block-'+section.id;head.setAttribute('aria-controls',body.id);
        const choose=(showVisualizer=true)=>{setSectionOpen(section.id);loadSong();activeMeasureIndex=s.sections.slice(0,i).reduce((n,s)=>n+s.count,0);renderActiveMeasure();if(showVisualizer&&window.innerWidth<=1100)switchTab('visu');};
        head.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' ')e.stopPropagation();});
        head.addEventListener('click',e=>{e.stopPropagation();if(openSectionId===section.id)setSectionOpen(null);else choose(false);});
        card.addEventListener('click',e=>{if(!e.target.closest('input,select,button,label')){if(openSectionId===section.id)setSectionOpen(null);else choose(false);}});card.addEventListener('keydown',e=>{if(e.target===card&&(e.key==='Enter'||e.key===' ')){e.preventDefault();choose();}});
        const label=field('Libellé',body,section.label,value=>{section.label=value.trim()||'Section '+(i+1);changed();});label.setAttribute('list','songLabels');label.addEventListener('input',()=>{title.textContent=label.value.trim()||'Bloc '+(i+1);});
        const fields=el('div',undefined,body,'song-block-controls');const count=songNumbox('Mesures',fields,section.count,(value,input)=>{const n=Number(value);if(!Number.isSafeInteger(n)||n<1){input.value=section.count;return;}const total=s.sections.reduce((n,x)=>n+(x===section?0:x.count),0)+n;if(!Number.isSafeInteger(total)){input.value=section.count;return;}section.count=n;changed();},Array.from({length:64},(_,i)=>i+1));
        const bpm=songNumbox('Tempo (BPM)',fields,section.measure.tempo,(v,input)=>{const n=Number(v);if(!Number.isFinite(n)||n<20||n>300){input.value=section.measure.tempo;return;}section.measure.tempo=n;changed();},Array.from({length:281},(_,i)=>i+20));const bpmRow=bpm.closest('label');bpmRow.firstChild.textContent='Tempo';el('span','BPM',bpmRow,'measure-tempo-unit');
        const preview=el('div',undefined,body,'measure-preview');
        for(let b=0;b<section.measure.numerator;b++){const group=el('div',undefined,preview,'preview-beat');for(const state of section.measure.beatStates[b])el('span',undefined,group,'preview-dot').dataset.state=state;}
        const controls=el('div',undefined,summary,'song-more-wrap');
        Object.assign(controls.style,{position:'relative',float:'right',top:'auto',bottom:'auto',right:'auto',marginLeft:'8px'});
        const trigger=button('⋯',controls,()=>{const opening=menu.hidden;songPane.querySelectorAll('.song-more-menu').forEach(other=>other.hidden=true);songPane.querySelectorAll('.song-more').forEach(other=>other.setAttribute('aria-expanded','false'));menu.hidden=!opening;trigger.setAttribute('aria-expanded',String(opening));});
        trigger.className='song-more';trigger.setAttribute('aria-label','Actions du bloc '+(section.label||i+1));trigger.setAttribute('aria-haspopup','menu');trigger.setAttribute('aria-expanded','false');
        const menu=el('div',undefined,controls,'song-more-menu');menu.hidden=true;menu.setAttribute('role','menu');menu.style.top='36px';menu.style.bottom='auto';
        const action=(name,fn)=>{const b=button(name,menu,()=>{menu.hidden=true;trigger.setAttribute('aria-expanded','false');fn();});b.setAttribute('role','menuitem');return b;};
        action('Dupliquer',()=>{const copy=clone(section);copy.id=id();s.sections.splice(i+1,0,copy);openSectionId=copy.id;changed();});
        const remove=action('Supprimer',()=>{if(s.sections.length<=1)return;s.sections.splice(i,1);changed();});remove.disabled=s.sections.length<=1;
        controls.addEventListener('click',e=>e.stopPropagation());
        controls.addEventListener('keydown',e=>{if(e.key==='Escape'){e.stopPropagation();menu.hidden=true;trigger.setAttribute('aria-expanded','false');trigger.focus();}});
      });button('+ Ajouter une section',songPane,()=>{const section=blankSection();s.sections.push(section);openSectionId=section.id;changed();});
    }
    const labels=el('datalist',undefined,songPane);labels.id='songLabels';for(const name of ['Intro','Couplet 1','Couplet 2','Refrain 1','Refrain 2','Bridge','Solo','Outro'])el('option',name,labels).value=name;
    const transferPane=el('section',undefined,profilePane,'backup-json');el('h3','Copie JSON',transferPane);
    const transfers=el('div',undefined,transferPane,'song-actions');button('Exporter',transfers,()=>{const blob=new Blob([JSON.stringify(library,null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=el('a');a.href=url;a.download='renax-morceaux.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);});const importer=el('input',undefined,transferPane);importer.type='file';importer.accept='.json,application/json';importer.hidden=true;button('Importer',transfers,()=>importer.click());importer.onchange=async()=>{try{if(importer.files[0].size>5000000)throw Error('Fichier JSON trop volumineux.');const data=JSON.parse(await importer.files[0].text());validateLibrary(data);if(!confirm('Importer '+data.profiles.length+' profils et '+data.profiles.reduce((n,p)=>n+p.songs.length,0)+' morceaux ? Ils seront ajoutés sans remplacer les morceaux existants.'))return;unload();for(const imported of data.profiles){const p=clone(imported);p.id=id();p.name+=' (importé)';p.songs.forEach(s=>s.id=id());library.profiles.push(p);}library.activeProfile=library.profiles.at(-1).id;selectedSong=null;persist();render();status('Bibliothèque importée sans remplacer les morceaux existants.');}catch(e){status('Import refusé : '+e.message);}};
    el('p','Gardez une copie indépendante. Effacer les données du navigateur peut supprimer la sauvegarde locale.',transferPane,'song-note');el('div',storageStatus,transferPane).id='songStatus';setSectionOpen(openSectionId);selectOpenBlock();updatePosition();syncSongTransport();
  }
  // Song playback uses a snapshot; editing the saved arrangement stops its playback.
  // Keep ordinary sequencer and polyrhythm behavior untouched when no song is loaded.
  const actionStyle=document.createElement('style');
  actionStyle.textContent='#songPane .song-playlist-card{position:relative;}\n#songPane .song-more-wrap{position:absolute;bottom:8px;right:8px;z-index:12;}\n#songPane .song-more{width:32px;height:32px;padding:0;border:1px solid #363640;border-radius:6px;background:#15151b;color:var(--text-muted);font:700 18px/1 var(--font);cursor:pointer;}\n#songPane .song-more:hover,#songPane .song-more[aria-expanded=true]{border-color:#a45427;color:var(--orange);background:#211a16;}\n#songPane .song-more-menu{position:absolute;bottom:36px;right:0;width:176px;padding:5px;border:1px solid #363640;border-radius:7px;background:#101116;box-shadow:0 10px 28px rgba(0,0,0,.38);}\n#songPane .song-more-menu[hidden]{display:none;}\n#songPane .song-more-menu .btn{display:block;width:100%;min-height:40px;padding:7px 9px;border:0;border-radius:5px;background:transparent;color:var(--text);font:600 11px/1.25 var(--font);text-align:left;text-transform:none;letter-spacing:0;}\n#songPane .song-more-menu .btn:hover{background:#211a16;color:var(--orange);}\n';
  document.head.append(actionStyle);
  render();
  window.RENAX_SONGS={validateLibrary,loadSong,unload,locate,
    replaceLibrary(value){validateLibrary(value);unload();library=clone(value);selectedSong=null;openSectionId=null;songView='home';render();},
    get navigation(){return {pane:songsRoot.hidden?'sequence':'songs',view:songView,song:selectedSong,profile:library.activeProfile};},
    restoreNavigation(state){
      const target=library.profiles.find(p=>p.id===state.profile)||profile();
      const targetSong=target.songs.find(s=>s.id===state.song);
      if(library.activeProfile!==target.id||selectedSong!==(targetSong?.id||null)||songView!==state.view)unload();
      library.activeProfile=target.id;selectedSong=targetSong?.id||null;
      songView=['home','profile','playlists','playlist','detail'].includes(state.view)?state.view:'home';
      if(songView==='detail'&&!targetSong)songView='playlist';
      openSectionId=targetSong?.sections[0]?.id||null;render();tab(state.pane==='songs'?'songs':'sequence');
    },
    get library(){return library;},get loaded(){return loaded;}};
  try{RENAX_STORAGE.write(library);}catch{status('Sauvegarde locale impossible : exporte ta bibliothèque.');}
})();
