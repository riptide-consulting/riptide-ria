// M12 ── OPERATIONAL PERSPECTIVE ------------------------------------
s=p.addSlide(); s.background=LIGHT_BG; s.slideNumber={x:12.82,y:7.1,w:0.42,h:0.3,fontFace:BODY_F,fontSize:9,color:MUTE};
titleBarX(s,"Operational perspective","How the unit's week changes",INK,TEAL);
card(s,0.6,2.05,5.95,4.55,"FFFFFF");
s.addText("TODAY",{x:0.95,y:2.3,w:5.2,h:0.35,fontFace:TITLE_F,fontSize:13,bold:true,charSpacing:2,color:MUTE,margin:0});
s.addText([
  {text:"A monitoring rota reads the Federal Register",options:{bullet:true,breakLine:true}},
  {text:"Triage depth and criteria vary by reader",options:{bullet:true,breakLine:true}},
  {text:"Write-ups queue behind other work",options:{bullet:true,breakLine:true}},
  {text:"Awareness is measured in days",options:{bullet:true,breakLine:true}},
  {text:"No unit-level metrics exist for intake",options:{bullet:true}},
],{x:0.95,y:2.8,w:5.3,h:3.5,fontFace:BODY_F,fontSize:12.5,color:INK,margin:0,paraSpaceAfter:12});
card(s,6.85,2.05,5.85,4.55,NAVY);
s.addText("WITH RIA",{x:7.2,y:2.3,w:5.1,h:0.35,fontFace:TITLE_F,fontSize:13,bold:true,charSpacing:2,color:"BFD9E8",margin:0});
s.addText([
  {text:"Intake is automated; every publication triaged same day",options:{bullet:true,breakLine:true}},
  {text:"The tier 2 queue IS the worklist, with draft owners and due dates",options:{bullet:true,breakLine:true}},
  {text:"Escalations reach leadership same day, context attached",options:{bullet:true,breakLine:true}},
  {text:"The unit reports coverage, time-to-briefing, tier mix, cycle time",options:{bullet:true,breakLine:true}},
  {text:"Headcount unchanged: capacity moves to review and remediation",options:{bullet:true}},
],{x:7.2,y:2.8,w:5.2,h:3.6,fontFace:BODY_F,fontSize:12.5,color:"E6F0F6",margin:0,paraSpaceAfter:12});
s.addText("Operating burden: the pipeline runs unattended inside a spend cap; the human cost is review capacity, which the unit already staffs.",
  {x:0.6,y:6.75,w:12.1,h:0.45,fontFace:BODY_F,fontSize:12,italic:true,color:MUTE,margin:0});
s.addNotes("The operational pitch is subtraction, not addition: no new system to staff, intake stops being a job. The metrics row matters to whoever runs the unit: for the first time intake has numbers, which makes next year's budget an evidence conversation.");
