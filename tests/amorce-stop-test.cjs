const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {start}=require('./audio-harness.cjs');
(async()=>{
 const h=await start();
 try{
  const page=await h.browser.newPage();
  await page.route('**/*.mjs',route=>route.fulfill({contentType:'text/javascript',body:fs.readFileSync(path.join(__dirname,'..',new URL(route.request().url()).pathname),'utf8')}));
  await page.goto(h.url);
  const result=await page.evaluate(async()=>{
   const {isolatedPlayback}=await import('/prototypes/amorce/sequence.mjs');
   const original=audioCtx;
   const context=new AudioContext();
   const oscillator=context.createOscillator(),silent=context.createGain();
   silent.gain.value=0;oscillator.connect(silent).connect(context.destination);
   oscillator.start(context.currentTime+.5);
   await context.resume();
   const playback=isolatedPlayback(context);
   await playback.stop();await playback.stop();
   return {state:context.state,stopped:playback.stopped,appContextPreserved:audioCtx===original,
     scope:'Real Chromium AudioContext closure, including a scheduled future source. No listening test or acoustic syllable measurement.'};
  });
  assert.equal(result.state,'closed');assert(result.stopped&&result.appContextPreserved);
  fs.writeFileSync(path.join(__dirname,'../prototypes/amorce/stop-results.json'),JSON.stringify(result,null,2)+'\n');
  console.log(result);
 }finally{await h.browser.close();h.server?.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
