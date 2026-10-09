// Read-only diagnostic: no interaction can mark an anchor as certified.
const section=document.createElement('section');
section.innerHTML='<h2>Onde sonore — repère candidat</h2><p>La ligne rouge montre le repère phonétique proposé. Elle ne certifie pas le début acoustique de la syllabe.</p><canvas width="1000" height="220" style="width:100%;border:1px solid #bbb" aria-label="Onde sonore et repère candidat"></canvas>';
document.body.append(section);
window.addEventListener('amorce-waveform',({detail:{speech,candidate}})=>{
 const canvas=section.querySelector('canvas'),c=canvas.getContext('2d');
 const duration=speech.pcm.length/speech.sampleRate;
 const begin=Math.max(0,candidate.anchorSeconds-.2),end=Math.min(duration,candidate.anchorSeconds+.5);
 const x=time=>(time-begin)/(end-begin)*canvas.width;
 c.fillStyle='#fafafa';c.fillRect(0,0,canvas.width,canvas.height);
 c.strokeStyle='#244c6a';c.beginPath();
 for(let px=0;px<canvas.width;px++){
  const from=Math.floor((begin+px/canvas.width*(end-begin))*speech.sampleRate);
  const to=Math.floor((begin+(px+1)/canvas.width*(end-begin))*speech.sampleRate);
  let min=0,max=0;for(let i=from;i<=to;i++){min=Math.min(min,speech.pcm[i]||0);max=Math.max(max,speech.pcm[i]||0);}
  c.moveTo(px,110-min*90);c.lineTo(px,110-max*90);
 }c.stroke();
 c.strokeStyle='#777';c.fillStyle='#333';c.font='13px system-ui';
 for(const phone of speech.events.filter(e=>e.type==='phoneme'&&e.id)){
  const time=phone.audio_position/1000;if(time<begin||time>end)continue;
  c.beginPath();c.moveTo(x(time),40);c.lineTo(x(time),190);c.stroke();c.fillText(phone.id,x(time)+3,30);
 }
 c.strokeStyle='#be3434';c.beginPath();c.moveTo(x(candidate.anchorSeconds),0);c.lineTo(x(candidate.anchorSeconds),canvas.height);c.stroke();
 c.fillStyle='#be3434';c.fillText(`Candidat : ${(candidate.anchorSeconds*1000).toFixed(1)} ms`,8,210);
});
