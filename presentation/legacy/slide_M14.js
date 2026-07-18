// M14 ── LEGAL PERSPECTIVE ------------------------------------------
s=p.addSlide(); s.background=LIGHT_BG; s.slideNumber={x:12.82,y:7.1,w:0.42,h:0.3,fontFace:BODY_F,fontSize:9,color:MUTE};
titleBarX(s,"Legal perspective","Support and defensibility; privilege flow unchanged",INK,TEAL);
s.addText([
  {text:"Analysis support, not legal advice. ",options:{bold:true}},
  {text:"Every briefing carries a verify-with-counsel disclaimer; the counsel step is preserved and reached days sooner.",options:{breakLine:true}},
  {text:"Defensibility by record. ",options:{bold:true}},
  {text:"A complete, timestamped log of what was seen, how it was scored, what was decided, and who approved. Audit and regulator inquiries are answered from the log, not recollection.",options:{breakLine:true}},
  {text:"Consistency under scrutiny. ",options:{bold:true}},
  {text:"Identical triage criteria on every document reduce the judgment variance an examiner would probe.",options:{breakLine:true}},
  {text:"Human authority is structural. ",options:{bold:true}},
  {text:"No external action exists without the tier decision AND an explicit human approval checked in code. An architecture fact, not a policy promise.",options:{breakLine:true}},
  {text:"Records fit existing governance. ",options:{bold:true}},
  {text:"Logs are plain JSONL shipped to the SIEM under retention schedules already in force; nothing new to govern.",options:{breakLine:true}},
  {text:"Privilege workflow unchanged. ",options:{bold:true}},
  {text:"Briefings are business records; anything requiring privilege routes through counsel exactly as it does today.",options:{}},
],{x:0.6,y:2.0,w:12.1,h:4.9,fontFace:BODY_F,fontSize:12.5,color:INK,margin:0,paraSpaceAfter:14,lineSpacing:17});
s.addNotes("Language discipline: you advise on positioning, their counsel decides. Never promise a legal outcome; promise the record that supports one. The strongest line for a GC is the fourth: human authority is enforced by the architecture, so the answer to who approved this is never nobody, and never a model.");
