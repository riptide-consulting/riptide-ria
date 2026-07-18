// M10 ── WHAT THE UNIT ACCOMPLISHES ---------------------------------
s=p.addSlide(); s.background=LIGHT_BG; s.slideNumber={x:12.82,y:7.1,w:0.42,h:0.3,fontFace:BODY_F,fontSize:9,color:MUTE};
titleBarX(s,"Business purpose","What the unit accomplishes with RIA",INK,TEAL);
const wins=[
  ["Complete coverage","Every CMS/FDA publication is triaged against identical criteria. Nothing depends on who happened to read what, or when."],
  ["Same-day awareness","Publication to finished briefing in minutes. Response clocks start the day a rule lands, not the week someone found it."],
  ["Expertise redirected","Analyst hours move from reading and triage to judgment and remediation: the work only your people can do."],
  ["A standing audit trail","Every decision is recorded with its inputs, confidence, and outcome. Audit and regulator questions are answered from the log, not memory."],
  ["Institutional consistency","The triage rubric is versioned, tested, and applied identically to every document. Criteria change by review, not by drift."],
];
wins.forEach((w,i)=>{
  const y=2.05+i*0.97;
  num(s,i+1,0.7,y,NAVY,WHITE);
  s.addText(w[0],{x:1.45,y:y-0.02,w:2.95,h:0.55,fontFace:TITLE_F,fontSize:14.5,bold:true,color:NAVY,valign:"middle",margin:0});
  s.addText(w[1],{x:4.55,y:y-0.09,w:8.15,h:0.85,fontFace:BODY_F,fontSize:12,color:INK,valign:"middle",margin:0,lineSpacing:16});
});
s.addNotes("Tie each row to a person in the room. Coverage and consistency to the compliance officer, same-day awareness to operations, the audit trail to legal, redirected expertise to whoever owns the budget. The through-line: the unit shifts from finding and summarizing to deciding and remediating.");
