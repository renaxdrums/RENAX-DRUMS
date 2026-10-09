// Read-only conversion of the saved click grid into exact musical durations.
export function scoreBeats(measure){
 return Array.from({length:measure.numerator},(_,beat)=>{
  const count=measure.beatSubdivisions[beat],normal=count===3?2:count>=5&&count<=7?4:count;
  return {beat,count,duration:String(measure.denominator*normal),tuplet:normal!==count?{count,normal}:null,
   notes:Array.from({length:count},(_,sub)=>({beat,sub,state:measure.beatStates[beat]?.[sub]||0}))};
 });
}
export function scoreRows(beats,width){
 const rows=[];let row=[],used=0;const available=Math.max(190,width-84);
 for(const beat of beats){const needed=Math.max(46,beat.count*25+12);if(row.length&&used+needed>available){rows.push(row);row=[];used=0;}row.push(beat);used+=needed;}
 if(row.length)rows.push(row);return rows;
}
