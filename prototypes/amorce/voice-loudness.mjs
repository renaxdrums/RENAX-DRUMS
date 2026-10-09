// Mono K-weighted loudness: BS.1770 filtering and 400 ms / 75% overlap gates.
function filter(samples, coefficients){
 const [b0,b1,b2,a1,a2]=coefficients,out=new Float64Array(samples.length);
 let x1=0,x2=0,y1=0,y2=0;
 for(let i=0;i<samples.length;i++){const x=samples[i],y=b0*x+b1*x1+b2*x2-a1*y1-a2*y2;out[i]=y;x2=x1;x1=x;y2=y1;y1=y;}
 return out;
}
export function speechLoudness(pcm,rate=24000){
 const shelfK=Math.tan(Math.PI*1681.974450955533/rate),shelfQ=.7071752369554196;
 const vh=10**(3.999843853973347/20),vb=vh**.499666774155,d=1+shelfK/shelfQ+shelfK*shelfK;
 const shelf=[(vh+vb*shelfK/shelfQ+shelfK*shelfK)/d,2*(shelfK*shelfK-vh)/d,(vh-vb*shelfK/shelfQ+shelfK*shelfK)/d,2*(shelfK*shelfK-1)/d,(1-shelfK/shelfQ+shelfK*shelfK)/d];
 const k=Math.tan(Math.PI*38.13547087602444/rate),q=.5003270373238773,h=1+k/q+k*k;
 const weighted=filter(filter(pcm,shelf),[1,-2,1,2*(k*k-1)/h,(1-k/q+k*k)/h]);
 const size=Math.min(pcm.length,Math.round(rate*.4)),hop=Math.max(1,Math.round(rate*.1)),powers=[];
 if(!size)return -Infinity;
 for(let start=0;start+size<=weighted.length;start+=hop){let energy=0;for(let i=start;i<start+size;i++)energy+=weighted[i]*weighted[i];powers.push(energy/size);}
 const db=power=>-.691+10*Math.log10(power),mean=values=>values.reduce((a,b)=>a+b,0)/values.length;
 const absolute=powers.filter(p=>db(p)>-70);if(!absolute.length)return -Infinity;
 const threshold=db(mean(absolute))-10,active=absolute.filter(p=>db(p)>threshold);
 return db(mean(active));
}
export function normalizeVoice(pcm,rate=24000){
 let peak=0;for(const sample of pcm)peak=Math.max(peak,Math.abs(sample));
 const before=speechLoudness(pcm,rate);if(!Number.isFinite(before)||!peak)throw new Error('SILENT_NEURAL_AUDIO');
 const target=-20,gain=Math.min(10**((target-before)/20),.8/peak);
 for(let i=0;i<pcm.length;i++)pcm[i]*=gain;
 return {gain,loudnessBefore:before,loudnessAfter:speechLoudness(pcm,rate),targetLufs:target,peakAfter:peak*gain,peakLimited:gain<10**((target-before)/20)};
}
