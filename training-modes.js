/* Training controls and tempo trajectories; the audio scheduler remains shared. */
(() => {
  const section=document.querySelector('.training-section');
  const svg=path=>'<svg viewBox="0 0 32 24" aria-hidden="true" focusable="false"><path d="M3 2v19h27" class="curve-axis"/><path d="'+path+'"/></svg>';
  const icons={linearUp:'M6 18 28 4',linearDown:'M6 4 28 18',up:'M6 18C18 18 24 14 28 4',down:'M6 4C10 14 16 18 28 18',steps:'M6 18h7v-5h7V8h8V3'};
  let mode='progressive',curve='linear';
  const tabs=document.createElement('div');tabs.className='training-mode-tabs';tabs.setAttribute('role','tablist');tabs.setAttribute('aria-label',"Type d’entraînement");
  const fields=document.createElement('div');fields.className='training-fields';fields.id='trainingFields';fields.setAttribute('role','tabpanel');
  const start=document.getElementById('trainStart'),end=document.getElementById('trainEnd'),duration=document.getElementById('trainDuration');
  const row=input=>input.closest('.training-row');
  const direction=document.getElementById('dirToggle').closest('.training-row');
  fields.append(row(start),direction,row(end),row(duration));
  start.setAttribute('aria-label','BPM de départ');end.setAttribute('aria-label',"BPM d’arrivée");duration.setAttribute('aria-label','Durée totale en minutes');
  const endLabel=row(end).querySelector('.row-label');endLabel.textContent='Arrivée';
  function makeRow(label,id,value,min,max){const wrapper=document.createElement('div');wrapper.className='training-row';const text=document.createElement('label');text.className='row-label';text.htmlFor=id;text.textContent=label;const input=document.createElement('input');input.type='number';input.id=id;input.inputMode='numeric';input.value=value;input.min=min;input.max=max;input.step=1;wrapper.append(text,input);fields.append(wrapper);return {wrapper,input};}
  const step=makeRow('Écart','trainStep',4,1,280);const stepUnit=document.createElement('span');stepUnit.className='unit';stepUnit.textContent='BPM';step.wrapper.append(stepUnit);
  const interval=makeRow('Toutes les','trainInterval',30,1,3600);const unit=document.createElement('select');unit.id='trainIntervalUnit';unit.setAttribute('aria-label','Unité de durée du palier');unit.innerHTML='<option value="seconds">secondes</option><option value="minutes">minutes</option>';interval.wrapper.append(unit);
  // The mobile keyboard Done action confirms editing without starting playback.
  for(const input of fields.querySelectorAll('input[type="number"]')){
    input.enterKeyHint='done';
    input.addEventListener('keydown',event=>{
      if(event.key!=='Enter'||event.isComposing)return;
      event.preventDefault();event.stopPropagation();
      input.dispatchEvent(new Event('change',{bubbles:true}));
      input.blur();
    });
  }
  const curveRow=document.createElement('div');curveRow.className='training-curve-row';const curveLabel=document.createElement('span');curveLabel.textContent='Courbe';const curves=document.createElement('div');curves.className='training-curve-options';curves.setAttribute('role','group');curves.setAttribute('aria-label','Courbe du tempo');curveRow.append(curveLabel,curves);fields.append(curveRow);
  const curveButtons=[];
  for(const value of ['linear','shaped']){const button=document.createElement('button');button.type='button';button.dataset.curve=value;button.onclick=()=>{curve=value;update();};curves.append(button);curveButtons.push(button);}
  const modeButtons=[];
  for(const [value,label,icon] of [['progressive','Progressif',icons.up],['steps','Par paliers',icons.steps]]){const button=document.createElement('button');button.type='button';button.id='trainingMode-'+value;button.setAttribute('role','tab');button.setAttribute('aria-controls',fields.id);button.dataset.trainingMode=value;button.innerHTML=svg(icon)+'<span>'+label+'</span>';button.onclick=()=>{mode=value;update();};button.onkeydown=event=>{if(['ArrowLeft','ArrowRight','Home','End'].includes(event.key)){event.preventDefault();const target=event.key==='Home'?0:event.key==='End'?1:modeButtons.indexOf(button)===0?1:0;modeButtons[target].click();modeButtons[target].focus();}};tabs.append(button);modeButtons.push(button);}
  const runStatus=document.createElement('p');runStatus.id='trainingRunStatus';runStatus.setAttribute('role','status');runStatus.hidden=true;
  const oldLabel=section.querySelector(':scope > label');section.prepend(tabs,fields);if(oldLabel)section.prepend(oldLabel);section.append(runStatus);
  function update(){const stepped=mode==='steps';for(const button of modeButtons){const selected=button.dataset.trainingMode===mode;button.setAttribute('aria-selected',String(selected));button.tabIndex=selected?0:-1;button.disabled=training.engaged;}
    fields.setAttribute('aria-labelledby','trainingMode-'+mode);row(end).hidden=stepped;row(duration).hidden=stepped;curveRow.hidden=stepped;step.wrapper.hidden=!stepped;interval.wrapper.hidden=!stepped;
    const down=training.direction==='down';for(const button of curveButtons){const shaped=button.dataset.curve==='shaped';const label=shaped?'Exponentiel':'Linéaire';button.innerHTML=svg(icons[shaped?(down?'down':'up'):(down?'linearDown':'linearUp')])+'<span>'+label+'</span>';button.setAttribute('aria-pressed',String(button.dataset.curve===curve));button.title=shaped?(down?'Baisse rapide au début, puis de plus en plus douce':'Montée douce au début, puis de plus en plus rapide'):'Variation régulière du tempo';button.disabled=training.engaged;}
    for(const element of fields.querySelectorAll('input,select,#dirToggle button'))element.disabled=training.engaged;
    fields.querySelectorAll('select').forEach(select=>{const custom=select.parentElement.querySelector('.numbox-button');if(custom)custom.disabled=select.disabled;});
  }
  document.getElementById('dirToggle').addEventListener('click',update);
  function prepare(a,b,dur,direction){const stepBpm=Math.max(1,Math.min(280,parseInt(step.input.value)||4));step.input.value=stepBpm;const max=unit.value==='minutes'?60:3600;const count=Math.max(1,Math.min(max,parseInt(interval.input.value)||1));interval.input.value=count;runStatus.hidden=true;return {mode,curve,direction,startBpm:mode==='steps'?a:direction==='up'?Math.min(a,b):Math.max(a,b),endBpm:mode==='steps'?(direction==='up'?300:20):direction==='up'?Math.max(a,b):Math.min(a,b),duration:dur*60000,stepBpm,stepMs:count*(unit.value==='minutes'?60000:1000)};}
  function at(run,elapsed){if(run.mode==='steps'){const n=Math.floor(Math.max(0,elapsed)/run.stepMs);const raw=run.startBpm+(run.direction==='up'?1:-1)*run.stepBpm*n;const bpm=Math.max(20,Math.min(300,raw));return {bpm,done:run.direction==='up'?raw>=300:raw<=20};}const p=Math.max(0,Math.min(1,elapsed/run.duration));const shaped=run.curve==='shaped'?(run.direction==='up'?(Math.exp(3*p)-1)/(Math.exp(3)-1):1-(Math.exp(3*(1-p))-1)/(Math.exp(3)-1)):p;return {bpm:Math.round(run.startBpm+(run.endBpm-run.startBpm)*shaped),done:p>=1};}
  function finish(bpm){runStatus.textContent=mode==='steps'?'Limite de '+bpm+' BPM atteinte — entraînement arrêté.':'Entraînement terminé.';runStatus.hidden=false;}
  window.RENAX_TRAINING={get mode(){return mode;},prepare,at,update,finish,begin(){runStatus.hidden=true;}};update();
})();
