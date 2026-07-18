// M2 ── HOW THIS DECK RUNS -----------------------------------------
s=p.addSlide(); s.background=LIGHT_BG; s.slideNumber={x:12.82,y:7.1,w:0.42,h:0.3,fontFace:BODY_F,fontSize:9,color:MUTE};
titleBarX(s,"Navigation","How this deck runs",INK,TEAL);
const parts=[
  ["PART 1","The system","Slides 3-8","What it is, how it decides, what it delivers","Every audience","~10 min"],
  ["PART 2","The business case","Slides 9-18","Outcomes, unit economics, operations, legal, security, risk, evidence, pilot","Business, legal, operations","~12 min"],
  ["PART 3","Technical architecture","Slides 19-32","Every agent, the code, dependencies, reliability, evals","Engineering and security","~15 min"],
];
parts.forEach((r,i)=>{
  const y=2.2+i*1.5;
  card(s,0.6,y,12.1,1.3,i===1?NAVY:"FFFFFF");
  const dark=i===1;
  s.addText(r[0],{x:0.95,y:y+0.18,w:1.4,h:0.35,fontFace:TITLE_F,fontSize:12,bold:true,charSpacing:2,color:dark?"BFD9E8":TEAL,margin:0});
  s.addText(r[1],{x:0.95,y:y+0.55,w:3.0,h:0.5,fontFace:TITLE_F,fontSize:16,bold:true,color:dark?WHITE:NAVY,margin:0});
  s.addText(r[2],{x:4.0,y:y+0.18,w:1.8,h:0.35,fontFace:BODY_F,fontSize:11,bold:true,color:dark?"BFD9E8":MUTE,margin:0});
  s.addText(r[3],{x:4.0,y:y+0.52,w:6.0,h:0.7,fontFace:BODY_F,fontSize:11.5,color:dark?"E6F0F6":INK,margin:0,lineSpacing:15});
  s.addText(r[4],{x:10.15,y:y+0.18,w:2.35,h:0.6,fontFace:BODY_F,fontSize:10.5,color:dark?"BFD9E8":MUTE,margin:0,lineSpacing:13});
  s.addText(r[5],{x:10.15,y:y+0.87,w:2.3,h:0.3,fontFace:BODY_F,fontSize:11,bold:true,color:dark?WHITE:NAVY,margin:0});
});
s.addText("Sections stand alone. Present the parts the room needs; skip the rest without loss.",
  {x:0.6,y:6.85,w:12.1,h:0.4,fontFace:BODY_F,fontSize:12,italic:true,color:MUTE,margin:0});
s.addNotes("Set the contract with the room up front: three parts, steered by who is present. Everyone gets the refusal demo at the end.");
