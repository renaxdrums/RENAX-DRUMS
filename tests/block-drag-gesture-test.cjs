const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const src=fs.readFileSync('songs-index2.js','utf8');
const fn=src.slice(src.indexOf('  function enableSongDrag('),src.indexOf('  function duplicateSongTo('));
function scenario({touch=false,collapsed=true,hold=false,downward=true,cancel=false,control=false,move=true}={}){
 const handlers={},classes=new Set(collapsed?['collapsed']:[]);let captured=null,timer=null,changed=0,persisted=0,removed=0;
 const item={id:'middle'},items=[{id:'first'},item,{id:'last'}],others=[{getBoundingClientRect:()=>({top:100,height:50}),before(){}},{getBoundingClientRect:()=>({top:220,height:50}),before(){},after(){}}];
 const row={dataset:{},style:{touchAction:'none'},classList:{add:x=>classes.add(x),remove:x=>classes.delete(x),contains:x=>classes.has(x)},addEventListener:(n,f)=>handlers[n]=f,setPointerCapture:id=>captured=id,hasPointerCapture:id=>captured===id,releasePointerCapture:id=>{captured=null;handlers.lostpointercapture({pointerId:id});},getBoundingClientRect:()=>({top:160,left:0,width:300,height:50}),getAttribute:()=>null,removeAttribute(){},setAttribute(){},before(){}};
 const sandbox={performance:{now:()=>0},suppressSongClickUntil:0,panel:{scrollTop:0,getBoundingClientRect:()=>({left:0,right:400,top:0,bottom:500})},songPane:{querySelectorAll:sel=>sel.includes('drop-before')?[]:[row,...others]},document:{createElement:()=>({style:{},getBoundingClientRect:()=>({top:160,bottom:210,height:50}),remove(){removed++;}})},getComputedStyle:()=>({marginTop:'0',marginBottom:'0'}),setTimeout:f=>(timer=f,1),clearTimeout(){timer=null;},requestAnimationFrame:()=>1,cancelAnimationFrame(){},changed:()=>changed++,persist:()=>persisted++,render(){}};
 vm.createContext(sandbox);vm.runInContext(fn,sandbox);sandbox.enableSongDrag(row,item,{sections:items},true);
 const event=(y)=>({button:0,isPrimary:true,pointerId:1,pointerType:touch?'touch':'mouse',clientX:100,clientY:y,target:{closest:()=>control?{}:null},preventDefault(){}});
 handlers.pointerdown(event(180));if(control){assert.equal(captured,null);return;}
 assert.equal(captured,1,'Pointer must remain captured before activation');if(hold)timer();
 if(move)handlers.pointermove(event(downward?280:110));
 handlers[cancel?'pointercancel':'pointerup'](event(downward?280:110));
 const reordered=move&&(!touch||collapsed||hold)&&!cancel;
 assert.deepEqual(items.map(x=>x.id),reordered?(downward?['first','last','middle']:['middle','first','last']):['first','middle','last']);
 assert.equal(changed,reordered?1:0);assert.equal(captured,null);assert(!classes.has('dragging'));assert.equal(persisted,0);
 if(move&&(!touch||collapsed||hold))assert.equal(removed,1);
}
for(const touch of [false,true])for(const downward of [false,true])for(const hold of [false,true])for(const cancel of [false,true])scenario({touch,downward,hold,cancel});
scenario({touch:true,collapsed:false});scenario({control:true});scenario({move:false});
assert(!src.includes('pointerEvents:\'none\''),'Dragged surface must remain interactive');
assert(!/enableSongDrag\(card,c,/.test(src),'Count-in must not be draggable');
console.log('19 gesture cases passed: mouse/touch, immediate/held, up/down, cancellation, controls, normal click and fixed count-in.');
