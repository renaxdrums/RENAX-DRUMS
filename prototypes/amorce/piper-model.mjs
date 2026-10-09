// Expose VITS's existing duration tensor without altering weights or operators.
// Only the pinned SIWIS model is supported. Durations retain the guide's timing.
const duration=Uint8Array.from(atob('Cg4vQ2VpbF9vdXRwdXRfMBIaChgIARIUCgIIAQoCCAEKChIIcGhvbmVtZXM='),c=>c.charCodeAt(0));
function varint(n){const out=[];do{out.push((n&127)|(n>127?128:0));n=Math.floor(n/128);}while(n);return new Uint8Array(out);}
function read(bytes,offset){let value=0,m=1,start=offset;while(offset<bytes.length){const b=bytes[offset++];value+=(b&127)*m;if(!(b&128))return {value,end:offset,start};m*=128;if(m>2**49)break;}throw new Error('INVALID_PIPER_MODEL');}
export function withDurations(buffer){
 const bytes=new Uint8Array(buffer);let offset=0;
 while(offset<bytes.length){const tag=read(bytes,offset);offset=tag.end;const wire=tag.value&7,field=Math.floor(tag.value/8);
  if(wire===0){offset=read(bytes,offset).end;continue;}
  if(wire===1){offset+=8;continue;}if(wire===5){offset+=4;continue;}
  if(wire!==2)throw new Error('INVALID_PIPER_MODEL');
  const size=read(bytes,offset),start=size.end,end=start+size.value;if(end>bytes.length)throw new Error('INVALID_PIPER_MODEL');
  if(field===7){const extra=new Uint8Array(1+varint(duration.length).length+duration.length);extra[0]=98;extra.set(varint(duration.length),1);extra.set(duration,extra.length-duration.length);
   const length=varint(size.value+extra.length),result=new Uint8Array(bytes.length+extra.length+length.length-(size.end-size.start));let pos=0;
   for(const chunk of [bytes.subarray(0,size.start),length,bytes.subarray(start,end),extra,bytes.subarray(end)]){result.set(chunk,pos);pos+=chunk.length;}return result;
  }offset=end;
 }throw new Error('PIPER_GRAPH_MISSING');
}
