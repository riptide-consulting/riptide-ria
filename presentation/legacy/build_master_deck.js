const pptxgen = require("pptxgenjs");
const p = new pptxgen();
p.layout = "LAYOUT_WIDE";

const NAVY="0B2545", MID="13416B", TEAL="2E8BA6", FOAM="F4F8FA", INK="1B2B3A",
      MUTE="5A7184", WARN="C94F4F", WHITE="FFFFFF", CODEBG="0E2233";
const TITLE_F="Century Gothic", BODY_F="Trebuchet MS", MONO_F="Courier New";
const DARK_BG={path:"/home/claude/bg_dark.png"}, LIGHT_BG={path:"/home/claude/bg_light.png"};

function titleBar(s,kicker,title,color,kc){
  s.addText(kicker.toUpperCase(),{x:0.6,y:0.4,w:10,h:0.35,fontFace:BODY_F,fontSize:12.5,bold:true,charSpacing:3,color:kc,margin:0});
  s.addText(title,{x:0.6,y:0.76,w:12.1,h:0.85,fontFace:TITLE_F,fontSize:30,bold:true,color:color,margin:0});
}
function card(s,x,y,w,h,fill,line){
  s.addShape("roundRect",{x,y,w,h,rectRadius:0.08,fill:{color:fill},line:{color:line||"DCE7EE",width:0.75},
    shadow:{type:"outer",color:"0B2545",opacity:0.10,blur:6,offset:2,angle:90}});
}
function code(s,x,y,w,h,text,fs){
  s.addShape("roundRect",{x,y,w,h,rectRadius:0.06,fill:{color:CODEBG},line:{color:MID,width:0.75}});
  s.addText(text,{x:x+0.22,y:y+0.16,w:w-0.44,h:h-0.32,fontFace:MONO_F,fontSize:fs||10.5,color:"D7E7F2",margin:0,lineSpacing:(fs||10.5)+3,valign:"top"});
}
function kv(s,x,y,w,label,value,lc,vc){
  s.addText(label.toUpperCase(),{x,y,w,h:0.3,fontFace:BODY_F,fontSize:10,bold:true,charSpacing:2,color:lc||MUTE,margin:0});
  s.addText(value,{x,y:y+0.3,w,h:0.42,fontFace:BODY_F,fontSize:13,bold:true,color:vc||INK,margin:0});
}


function num(s, n, x, y, fill, txt) {
  s.addShape("ellipse", { x, y, w: 0.52, h: 0.52, fill: { color: fill } });
  s.addText(String(n), { x, y: y - 0.005, w: 0.52, h: 0.52, align: "center", valign: "middle",
    fontFace: TITLE_F, fontSize: 18, bold: true, color: txt, margin: 0 });
}

function titleBarX(s, kicker, title, color, kickerColor) {
  s.addText(kicker.toUpperCase(), { x: 0.6, y: 0.45, w: 9.5, h: 0.35, fontFace: BODY_F,
    fontSize: 13, bold: true, charSpacing: 3, color: kickerColor, margin: 0 });
  s.addText(title, { x: 0.6, y: 0.82, w: 12.1, h: 0.95, fontFace: TITLE_F,
    fontSize: 34, bold: true, color: color, margin: 0 });
}


// M1 ── TITLE ------------------------------------------------------
let s=p.addSlide(); s.background=DARK_BG;
s.addText("RIPTIDE RIA",{x:0.7,y:1.3,w:11.9,h:1.0,fontFace:TITLE_F,fontSize:52,bold:true,color:WHITE,charSpacing:2,margin:0});
s.addText("Executive Overview and Technical Architecture",{x:0.72,y:2.4,w:12.2,h:0.85,fontFace:TITLE_F,fontSize:30,bold:true,color:"BFD9E8",margin:0});
s.addText("From Federal Register publication to an owner-assigned remediation plan in about five minutes,\nunder a trust model where models write opinions, code applies the rules, and a human holds the key.",
  {x:0.72,y:3.5,w:11.4,h:1.2,fontFace:BODY_F,fontSize:16,color:"8FB8CF",margin:0,lineSpacing:24});
s.addShape("line",{x:0.72,y:5.9,w:4.2,h:0,line:{color:TEAL,width:1.5}});
s.addText("Riptide Consulting   ·   Anthropic-first engineering   ·   Claude Partner Network   ·   github.com/riptide-consulting/riptide-ria",
  {x:0.72,y:6.12,w:12.2,h:0.4,fontFace:BODY_F,fontSize:12,color:"7FA6BC",margin:0});
s.addNotes("One deck, three audiences. The next slide is the map: present the parts this room needs and skip the rest without loss.");

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

// 2 ── THE PROBLEM ----------------------------------------------------
s=p.addSlide(); s.background=LIGHT_BG; s.slideNumber={x:12.82,y:7.1,w:0.42,h:0.3,fontFace:BODY_F,fontSize:9,color:MUTE};
titleBarX(s, "The problem", "Regulatory change management is a reading job", INK, TEAL);
s.addText([
  { text: "Every business day, CMS and FDA publish. Someone on your team reads it, decides whether it matters, traces which policies and workflows it touches, and writes it up.", options: { breakLine: true } },
  { text: "", options: { breakLine: true } },
  { text: "Days later. Per change. Forever.", options: { bold: true } },
], { x: 0.6, y: 2.15, w: 6.3, h: 3.4, fontFace: BODY_F, fontSize: 17, color: INK, margin: 0, lineSpacing: 26 });
card(s, 7.45, 2.1, 5.25, 4.5, WHITE);
const probs = [
  ["Slow", "First-pass analysis measured in analyst-days, not minutes"],
  ["Miss-prone", "Coverage depends on who read what, and when"],
  ["Expensive", "Senior compliance hours spent on triage, not judgment"],
];
probs.forEach((row, i) => {
  s.addText(row[0], { x: 7.85, y: 2.45 + i * 1.35, w: 4.5, h: 0.4, fontFace: TITLE_F,
    fontSize: 17, bold: true, color: NAVY, margin: 0 });
  s.addText(row[1], { x: 7.85, y: 2.85 + i * 1.35, w: 4.55, h: 0.85, fontFace: BODY_F,
    fontSize: 13.5, color: MUTE, margin: 0 });
});
s.addNotes("Keep this conversational: ask how regulatory change lands on their desk today. Whatever they answer becomes the baseline the pilot measures against. Do not quote industry statistics; their own hours-per-change number is the only one that matters, and they will supply it if asked.");

// 3 ── WHAT RIA DOES --------------------------------------------------
s=p.addSlide(); s.background=LIGHT_BG; s.slideNumber={x:12.82,y:7.1,w:0.42,h:0.3,fontFace:BODY_F,fontSize:9,color:MUTE};
titleBarX(s, "What RIA does", "Publication in, remediation plan out", INK, TEAL);
const stats = [
  ["~5 min", "publication to finished briefing"],
  ["$0.59", "per document, measured live"],
  ["100%", "of external actions human-gated"],
];
stats.forEach((st, i) => {
  card(s, 0.6 + i * 4.18, 2.2, 3.9, 2.35, WHITE);
  s.addText(st[0], { x: 0.6 + i * 4.18, y: 2.5, w: 3.9, h: 1.05, align: "center",
    fontFace: TITLE_F, fontSize: 46, bold: true, color: i === 2 ? TEAL : NAVY, margin: 0 });
  s.addText(st[1], { x: 0.85 + i * 4.18, y: 3.6, w: 3.4, h: 0.75, align: "center",
    fontFace: BODY_F, fontSize: 13.5, color: MUTE, margin: 0 });
});
s.addText("It monitors the agencies you answer to, analyzes each publication against your internal policy context, and delivers an executive briefing: plain-language summary, risk assessment, and a remediation table with actions, owners, and due dates.",
  { x: 0.6, y: 5.0, w: 12.1, h: 1.3, fontFace: BODY_F, fontSize: 16, color: INK, margin: 0, lineSpacing: 24 });
s.addText("Numbers are measured from live runs, not estimated.", { x: 0.6, y: 6.45, w: 12.0, h: 0.4,
  fontFace: BODY_F, fontSize: 12, italic: true, color: MUTE, margin: 0 });
s.addNotes("The three numbers to know cold: about five minutes wall clock, fifty-nine cents per document, and one hundred percent of external actions gated behind explicit human approval. When asked how you know the cost: it is measured across live runs and the cost breakdown is stage by stage in the repo, with a hard spend circuit breaker in configuration.");

// 4 ── HOW IT WORKS ---------------------------------------------------
s=p.addSlide(); s.background=LIGHT_BG; s.slideNumber={x:12.82,y:7.1,w:0.42,h:0.3,fontFace:BODY_F,fontSize:9,color:MUTE};
titleBarX(s, "How it works", "A compliance department in a box", INK, TEAL);
const steps = [
  ["Ingest", "Pulls new CMS / FDA publications from the Federal Register"],
  ["Classify", "A fast triage model assigns urgency and routes to the right analysts"],
  ["Analyze", "Three specialists: materiality, process impact, compliance gaps"],
  ["Evaluate", "A senior model grades the analysis; code decides the autonomy tier"],
  ["Synthesize", "Briefing, DOCX and PPTX, and only if authorized: tracker record or escalation"],
];
steps.forEach((st, i) => {
  const y = 2.2 + i * 0.98;
  num(s, i + 1, 0.7, y, i === 3 ? WARN : NAVY, WHITE);
  s.addText(st[0], { x: 1.45, y: y - 0.02, w: 2.1, h: 0.55, fontFace: TITLE_F,
    fontSize: 17, bold: true, color: NAVY, valign: "middle", margin: 0 });
  s.addText(st[1], { x: 3.6, y: y - 0.02, w: 9.1, h: 0.55, fontFace: BODY_F,
    fontSize: 14, color: INK, valign: "middle", margin: 0 });
});
s.addNotes("The metaphor that lands: a compliance department in a box. A triage clerk decides urgency. Three analysts study the document, all reading one shared cached copy, which is why the cost stays low. A senior partner grades their work but does not decide what happens next. Step four is red on purpose: that is the trust boundary, and it gets its own slide.");

// 5 ── THE TRUST MODEL (dark) ----------------------------------------
s=p.addSlide(); s.background=DARK_BG; s.slideNumber={x:12.82,y:7.1,w:0.42,h:0.3,fontFace:BODY_F,fontSize:9,color:"7FA6BC"};
s.addText("THE TRUST MODEL", { x: 0.7, y: 0.5, w: 9, h: 0.4, fontFace: BODY_F,
  fontSize: 13, bold: true, charSpacing: 3, color: TEAL, margin: 0 });
s.addText("Models write opinions. Code applies the rules.\nA human holds the key.", { x: 0.7, y: 0.95, w: 12.0, h: 1.6,
  fontFace: TITLE_F, fontSize: 32, bold: true, color: WHITE, margin: 0 });
const cols = [
  ["JUDGMENT", "The senior model scores each analysis for quality and produces an overall confidence and flags. It holds one read-only lookup tool and cannot write anything, anywhere."],
  ["DISPOSAL", "A deterministic function turns those scores into tier 1, 2, or 3. Escalation triggers are checked first; nothing outranks them. No model ever asserts its own tier."],
  ["APPROVAL", "Every external write additionally requires an explicit human approval, checked in code at the exact moment of the action. No approval, no side effect. Ever."],
];
cols.forEach((c, i) => {
  const x = 0.7 + i * 4.15;
  s.addShape("roundRect", { x, y: 3.0, w: 3.85, h: 3.5, rectRadius: 0.08,
    fill: { color: MID, transparency: 25 }, line: { color: TEAL, width: 0.75 } });
  s.addText(c[0], { x: x + 0.3, y: 3.3, w: 3.25, h: 0.45, fontFace: TITLE_F,
    fontSize: 17, bold: true, charSpacing: 2, color: "BFD9E8", margin: 0 });
  s.addText(c[1], { x: x + 0.3, y: 3.85, w: 3.25, h: 2.45, fontFace: BODY_F,
    fontSize: 13, color: "E6F0F6", margin: 0, lineSpacing: 19 });
});
s.addNotes("This is the load-bearing slide, so slow down. Three separations. Judgment: the expensive model grades the analysis but cannot act. Disposal: a plain function, reviewable line by line, applies fixed rules to compute the tier, and escalation triggers are checked before anything else. Approval: an explicit human sign-off checked in code at the moment of every external write. If they remember one sentence from the meeting, it is the title of this slide.");

// 6 ── THREE TIERS ----------------------------------------------------
s=p.addSlide(); s.background=LIGHT_BG; s.slideNumber={x:12.82,y:7.1,w:0.42,h:0.3,fontFace:BODY_F,fontSize:9,color:MUTE};
titleBarX(s, "Autonomy tiers", "Computed by code, never asserted by a model", INK, TEAL);
const tiers = [
  ["1", "Auto-execute", "Confidence at or above 0.90 AND risk low or medium. Even then, no external write without the human key.", NAVY],
  ["2", "Human review", "The default. Anything not clearly tier 1 or tier 3 lands in front of a person.", TEAL],
  ["3", "Escalate", "Low confidence, critical risk, or enforcement language. Checked first; nothing outranks it.", WARN],
];
tiers.forEach((t, i) => {
  const x = 0.6 + i * 4.18;
  card(s, x, 2.25, 3.9, 3.9, WHITE);
  s.addText(t[0], { x: x, y: 2.45, w: 3.9, h: 1.3, align: "center", fontFace: TITLE_F,
    fontSize: 64, bold: true, color: t[3], margin: 0 });
  s.addText(t[1], { x: x + 0.3, y: 3.9, w: 3.3, h: 0.45, align: "center", fontFace: TITLE_F,
    fontSize: 17, bold: true, color: INK, margin: 0 });
  s.addText(t[2], { x: x + 0.35, y: 4.4, w: 3.2, h: 1.6, align: "center", fontFace: BODY_F,
    fontSize: 12.5, color: MUTE, margin: 0, lineSpacing: 17 });
});
s.addText("The tier decision lives in reviewable code, driven by model-supplied scores and the analysts' own risk output.",
  { x: 0.6, y: 6.45, w: 12.1, h: 0.45, fontFace: BODY_F, fontSize: 13, italic: true, color: MUTE, margin: 0 });
s.addNotes("Anticipate the question: what if the model is confident and wrong. Answer: confidence alone never grants autonomy. Tier 1 also requires low or medium risk from the analysis itself, escalation triggers are checked before the thresholds, and even a tier 1 outcome cannot touch an external system without the human approval. A wrong analysis produces a wrong recommendation in front of a person, not an autonomous action.");

// 7 ── WHAT LANDS ON YOUR DESK ---------------------------------------
s=p.addSlide(); s.background=LIGHT_BG; s.slideNumber={x:12.82,y:7.1,w:0.42,h:0.3,fontFace:BODY_F,fontSize:9,color:MUTE};
titleBarX(s, "The deliverable", "A briefing your team can act on", INK, TEAL);
s.addText([
  { text: "Plain-language executive summary", options: { bullet: true, breakLine: true } },
  { text: "Risk and materiality assessment", options: { bullet: true, breakLine: true } },
  { text: "Remediation plan: action, owner, due date, priority", options: { bullet: true, breakLine: true } },
  { text: "Delivered as Word and PowerPoint, ready to circulate", options: { bullet: true, breakLine: true } },
  { text: "Tracker record and escalation email only when gated and approved", options: { bullet: true } },
], { x: 0.6, y: 2.3, w: 5.6, h: 3.6, fontFace: BODY_F, fontSize: 14.5, color: INK,
  margin: 0, paraSpaceAfter: 12 });
card(s, 6.6, 2.15, 6.1, 4.35, WHITE);
s.addText("REMEDIATION PLAN", { x: 6.95, y: 2.4, w: 5.4, h: 0.35, fontFace: TITLE_F,
  fontSize: 13, bold: true, charSpacing: 2, color: NAVY, margin: 0 });
const rows = [
  ["Action", "Owner", "Due", "Priority"],
  ["Update registration SOP", "Regulatory Affairs", "Aug 01", "High"],
  ["Revise sterility controls", "Quality Assurance", "Aug 15", "High"],
  ["Train affected teams", "Compliance PMO", "Sep 01", "Medium"],
];
rows.forEach((r, i) => {
  const y = 2.95 + i * 0.78;
  if (i === 0) s.addShape("rect", { x: 6.95, y: y - 0.06, w: 5.45, h: 0.5, fill: { color: FOAM } });
  const widths = [2.15, 1.5, 0.85, 0.95];
  let x = 6.95;
  r.forEach((cell, j) => {
    s.addText(cell, { x: x + 0.08, y: y, w: widths[j], h: 0.42, fontFace: BODY_F,
      fontSize: i === 0 ? 11 : 11.5, bold: i === 0, color: i === 0 ? MUTE : INK,
      valign: "middle", margin: 0 });
    x += widths[j];
  });
});
s.addText("Every briefing carries a verify-with-counsel disclaimer. Analysis support, not legal advice.",
  { x: 6.95, y: 6.05, w: 5.4, h: 0.4, fontFace: BODY_F, fontSize: 10.5, italic: true, color: MUTE, margin: 0 });
s.addNotes("If you can, open a real generated briefing on screen instead of talking over this slide; the document is the product. Point at the due dates: computed from today, real dates, not placeholders. And name the disclaimer proudly rather than apologetically: it is analysis support that accelerates counsel, not a replacement for it.");

// M9 ── DIVIDER PART 2 ---------------------------------------------
s=p.addSlide(); s.background=DARK_BG; s.slideNumber={x:12.82,y:7.1,w:0.42,h:0.3,fontFace:BODY_F,fontSize:9,color:"7FA6BC"};
s.addText("PART 2",{x:0.72,y:2.3,w:9,h:0.5,fontFace:BODY_F,fontSize:16,bold:true,charSpacing:4,color:TEAL,margin:0});
s.addText("The business case",{x:0.7,y:2.85,w:12.0,h:1.2,fontFace:TITLE_F,fontSize:48,bold:true,color:WHITE,margin:0});
s.addText("What the unit accomplishes  ·  Unit economics  ·  Operations  ·  Integration  ·  Legal  ·  Security  ·  Risk  ·  Evidence  ·  The pilot",
  {x:0.72,y:4.35,w:12.0,h:0.8,fontFace:BODY_F,fontSize:14,color:"8FB8CF",margin:0,lineSpacing:20});
s.addNotes("Transition: you have seen what it is and how it refuses to act alone; part 2 is what that is worth to the unit that owns regulatory change.");

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

// M11 ── COST PERSPECTIVE -------------------------------------------
s=p.addSlide(); s.background=LIGHT_BG; s.slideNumber={x:12.82,y:7.1,w:0.42,h:0.3,fontFace:BODY_F,fontSize:9,color:MUTE};
titleBarX(s,"Cost perspective","Unit economics you can compute in this room",INK,TEAL);
card(s,0.6,2.1,6.0,4.3,"FFFFFF");
s.addText("THE EQUATION",{x:0.95,y:2.35,w:5.2,h:0.35,fontFace:TITLE_F,fontSize:12.5,bold:true,charSpacing:2,color:NAVY,margin:0});
s.addText("Today, per month:",{x:0.95,y:2.85,w:5.3,h:0.35,fontFace:BODY_F,fontSize:12.5,bold:true,color:INK,margin:0});
s.addText("documents x analyst hours per doc x loaded rate",{x:0.95,y:3.2,w:5.3,h:0.4,fontFace:MONO_F,fontSize:10.5,color:MID,margin:0});
s.addText("With RIA, per month:",{x:0.95,y:3.85,w:5.3,h:0.35,fontFace:BODY_F,fontSize:12.5,bold:true,color:INK,margin:0});
s.addText("documents x $0.59\n+ (tier 2+3 share x review minutes x rate)",{x:0.95,y:4.2,w:5.3,h:0.8,fontFace:MONO_F,fontSize:10.5,color:MID,margin:0,lineSpacing:15});
s.addText("Reading and first-pass analysis leave the human column entirely; review of the flagged subset is what remains.",
  {x:0.95,y:5.3,w:5.3,h:0.9,fontFace:BODY_F,fontSize:11,italic:true,color:MUTE,margin:0,lineSpacing:15});
card(s,6.9,2.1,5.8,4.3,NAVY);
s.addText("MEASURED  vs  YOURS",{x:7.25,y:2.35,w:5.1,h:0.35,fontFace:TITLE_F,fontSize:12.5,bold:true,charSpacing:2,color:"BFD9E8",margin:0});
s.addText([
  {text:"Measured, from live runs: ",options:{bold:true,breakLine:true}},
  {text:"$0.59 per document; a hard spend cap per run; batch classification at roughly half price; cache reuse cutting repeat input cost to a tenth.",options:{breakLine:true}},
  {text:" ",options:{breakLine:true}},
  {text:"Yours, to plug in: ",options:{bold:true,breakLine:true}},
  {text:"monthly document volume; current hours per change; loaded rate; review minutes at tier 2. No per-seat licensing: infrastructure, API consumption, and the engagement.",options:{}},
],{x:7.25,y:2.8,w:5.1,h:3.4,fontFace:BODY_F,fontSize:11.5,color:"E6F0F6",margin:0,lineSpacing:16});
s.addText("The 30-day pilot exists to replace the right-hand variables with your measured numbers, producing one figure a CFO can act on.",
  {x:0.6,y:6.6,w:12.1,h:0.5,fontFace:BODY_F,fontSize:12,italic:true,color:MUTE,margin:0});
s.addNotes("Do this math live with their numbers; never quote an industry benchmark, because the only baseline that survives scrutiny is their own. The unstated second term is avoided cost: a missed change carries penalty exposure. Name it qualitatively and let their counsel size it.");

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

// 10 ── FITS YOUR STACK ----------------------------------------------
s=p.addSlide(); s.background=LIGHT_BG; s.slideNumber={x:12.82,y:7.1,w:0.42,h:0.3,fontFace:BODY_F,fontSize:9,color:MUTE};
titleBarX(s, "Integration", "Adapters, not a redesign", INK, TEAL);
const swaps = [
  ["Task tracker", "Notion today", "ServiceNow / Jira"],
  ["Email", "Gmail today", "Outlook / Exchange"],
  ["Documents", "Google Drive today", "SharePoint"],
];
s.addText("Every integration sits behind a thin, stable interface. The pipeline, the trust gate, and both approval checks never learn which vendor is behind it.",
  { x: 0.6, y: 2.15, w: 12.1, h: 0.8, fontFace: BODY_F, fontSize: 15, color: INK, margin: 0, lineSpacing: 21 });
swaps.forEach((r, i) => {
  const y = 3.3 + i * 1.05;
  card(s, 0.6, y, 12.1, 0.85, WHITE);
  s.addText(r[0], { x: 1.0, y: y + 0.14, w: 3.0, h: 0.55, fontFace: TITLE_F,
    fontSize: 15, bold: true, color: NAVY, valign: "middle", margin: 0 });
  s.addText(r[1], { x: 4.2, y: y + 0.14, w: 3.2, h: 0.55, fontFace: BODY_F,
    fontSize: 13.5, color: MUTE, valign: "middle", margin: 0 });
  s.addText(">", { x: 7.5, y: y + 0.14, w: 0.5, h: 0.55, fontFace: TITLE_F,
    fontSize: 16, bold: true, color: TEAL, valign: "middle", align: "center", margin: 0 });
  s.addText(r[2], { x: 8.15, y: y + 0.14, w: 4.2, h: 0.55, fontFace: BODY_F,
    fontSize: 13.5, bold: true, color: INK, valign: "middle", margin: 0 });
});
s.addText("Swapping the demo integrations for your systems is the expected first step of an engagement.",
  { x: 0.6, y: 6.65, w: 12.1, h: 0.4, fontFace: BODY_F, fontSize: 12.5, italic: true, color: MUTE, margin: 0 });
s.addNotes("Preempt the objection before it forms: nobody runs Notion and Gmail. Correct, and the demo integrations are placeholders behind a deliberate boundary. Tracker, mail, and document source each swap for an enterprise system as an adapter, and the governance design is untouched because none of it lives in the integration layer.");

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

// 9 ── SECURITY & DATA POSTURE ---------------------------------------
s=p.addSlide(); s.background=LIGHT_BG; s.slideNumber={x:12.82,y:7.1,w:0.42,h:0.3,fontFace:BODY_F,fontSize:9,color:MUTE};
titleBarX(s, "Security and data", "No PHI, by design", INK, TEAL);
s.addText([
  { text: "What it reads: public Federal Register text, plus excerpts of your internal policy documents from a folder you scope.", options: { bullet: true, breakLine: true } },
  { text: "What it never touches: patient records, claims, member data. Policy documents describe how you handle PHI; they do not contain it.", options: { bullet: true, breakLine: true } },
  { text: "Where model calls can run: Anthropic's BAA-covered HIPAA-ready API, or Claude on AWS Bedrock or Google Vertex AI inside your cloud tenancy.", options: { bullet: true, breakLine: true } },
  { text: "Logs are structured JSONL and ship to your SIEM under your retention rules.", options: { bullet: true } },
], { x: 0.6, y: 2.25, w: 7.6, h: 4.1, fontFace: BODY_F, fontSize: 14, color: INK,
  margin: 0, paraSpaceAfter: 14, lineSpacing: 19 });
card(s, 8.6, 2.25, 4.1, 4.0, NAVY);
s.addText("THE LEAVE-BEHIND", { x: 8.95, y: 2.6, w: 3.4, h: 0.4, fontFace: TITLE_F,
  fontSize: 13, bold: true, charSpacing: 2, color: "BFD9E8", margin: 0 });
s.addText("An enterprise FAQ written for your security and vendor-risk team: data flows, oversight model, audit trail, failure modes, and cloud options. Plain answers, mapped to code.",
  { x: 8.95, y: 3.1, w: 3.4, h: 2.9, fontFace: BODY_F, fontSize: 13, color: "E6F0F6",
    margin: 0, lineSpacing: 19 });
s.addNotes("Lead with the strongest card: this use case is high analyst-hours value with near-zero PHI exposure, which is exactly the first agentic project a cautious health organization should greenlight. If PHI ever entered scope in a future variant, the compliant paths already exist as configuration choices, verified with counsel: Anthropic's HIPAA-ready API under a BAA, or Bedrock and Vertex under your existing cloud agreements. Then hand over the enterprise FAQ by name.");

// M16 ── RISK & GOVERNANCE PERSPECTIVE ------------------------------
s=p.addSlide(); s.background=LIGHT_BG; s.slideNumber={x:12.82,y:7.1,w:0.42,h:0.3,fontFace:BODY_F,fontSize:9,color:MUTE};
titleBarX(s,"Risk and governance perspective","Answers for the risk committee, before it asks",INK,TEAL);
const risks=[
  ["Model risk","The deterministic layer (tier computation, gates, backstops) is unit-tested: 117 offline tests on every change. Model behavior is measured by live evals, including adversarial injection cases, with dated results committed. Prompt changes cannot merge without passing."],
  ["Operational risk","A hard spend cap per run; per-document isolation so one failure cannot cascade; documented failure modes with step-by-step recovery in the runbook; structured logs for every decision."],
  ["Third-party risk","Vendor-risk questions are pre-answered in a written FAQ: data flows, retention options, and model access via Anthropic's BAA-covered HIPAA-ready API or the client's own cloud (Bedrock / Vertex)."],
  ["Residual risk, stated","Prompt framing is evidence, not proof, against attacks nobody has written yet; keyword backstops are heuristics. Both are watched by evals rather than assumed away, and both are survivable because the tier and the gates are code."],
];
risks.forEach((r,i)=>{
  const x=0.6+(i%2)*6.28, y=1.95+Math.floor(i/2)*2.4;
  card(s,x,y,5.85,2.2,i===3?NAVY:"FFFFFF");
  s.addText(r[0],{x:x+0.32,y:y+0.2,w:5.2,h:0.4,fontFace:TITLE_F,fontSize:14,bold:true,color:i===3?"BFD9E8":NAVY,margin:0});
  s.addText(r[1],{x:x+0.32,y:y+0.62,w:5.25,h:1.5,fontFace:BODY_F,fontSize:10.5,color:i===3?"E6F0F6":INK,margin:0,lineSpacing:14});
});
s.addNotes("Volunteering residual risk disarms a risk committee: it signals the analysis was done rather than avoided. If they ask what happens when the model is wrong: a wrong analysis lands in front of a human at tier 2 or 3; it does not act. If they ask about attacks: show the injection eval results, then point at the code gates that hold regardless.");

// 8 ── PROVEN, NOT PROMISED ------------------------------------------
s=p.addSlide(); s.background=LIGHT_BG; s.slideNumber={x:12.82,y:7.1,w:0.42,h:0.3,fontFace:BODY_F,fontSize:9,color:MUTE};
titleBarX(s, "Engineering evidence", "Proven, not promised", INK, TEAL);
const ev = [
  ["117", "offline tests on every change, gates the codebase in CI"],
  ["3x", "each behavioral eval runs repeatedly; we assert a pass rate, not a lucky sample"],
  ["Attacked", "adversarial injection evals try to steer it with hostile document text; results committed with the code"],
  ["Audited", "one structured log line per decision, plus a tool-level audit trail; ships to your SIEM"],
];
ev.forEach((e, i) => {
  const x = 0.6 + (i % 2) * 6.28, y = 2.25 + Math.floor(i / 2) * 2.15;
  card(s, x, y, 5.85, 1.9, WHITE);
  s.addText(e[0], { x: x + 0.35, y: y + 0.25, w: 2.0, h: 1.4, fontFace: TITLE_F,
    fontSize: 34, bold: true, color: i === 2 ? WARN : NAVY, valign: "middle", margin: 0 });
  s.addText(e[1], { x: x + 2.45, y: y + 0.25, w: 3.15, h: 1.4, fontFace: BODY_F,
    fontSize: 12.5, color: INK, valign: "middle", margin: 0, lineSpacing: 17 });
});
s.addText("A hard spend circuit breaker caps every run. Prompt changes cannot merge without passing the eval suite.",
  { x: 0.6, y: 6.6, w: 12.1, h: 0.4, fontFace: BODY_F, fontSize: 12.5, italic: true, color: MUTE, margin: 0 });
s.addNotes("The line that separates this from AI demos they have seen: we attack our own system and commit the evidence. Hostile instructions embedded in document text, demanding low priority and inflated confidence, measurably fail to move the classifier, the analysts, or the gate. And the eval suite is wired into change control: a prompt edit that regresses behavior fails the merge gate.");

// 11 ── TODAY VS PILOT ------------------------------------------------
s=p.addSlide(); s.background=LIGHT_BG; s.slideNumber={x:12.82,y:7.1,w:0.42,h:0.3,fontFace:BODY_F,fontSize:9,color:MUTE};
titleBarX(s, "Straight talk", "What is real today, and what a pilot adds", INK, TEAL);
card(s, 0.6, 2.2, 5.95, 4.35, WHITE);
s.addText("REAL TODAY", { x: 0.95, y: 2.5, w: 5.2, h: 0.4, fontFace: TITLE_F,
  fontSize: 14, bold: true, charSpacing: 2, color: NAVY, margin: 0 });
s.addText([
  { text: "Full pipeline live against the Federal Register", options: { bullet: true, breakLine: true } },
  { text: "Measured cost and runtime, hard spend cap", options: { bullet: true, breakLine: true } },
  { text: "Trust gate, human approval, audit trail", options: { bullet: true, breakLine: true } },
  { text: "Test suite, adversarial evals, committed evidence", options: { bullet: true } },
], { x: 0.95, y: 3.05, w: 5.25, h: 3.2, fontFace: BODY_F, fontSize: 13, color: INK,
  margin: 0, paraSpaceAfter: 11 });
card(s, 6.8, 2.2, 5.95, 4.35, NAVY);
s.addText("A 30-DAY PILOT ADDS", { x: 7.15, y: 2.5, w: 5.2, h: 0.4, fontFace: TITLE_F,
  fontSize: 14, bold: true, charSpacing: 2, color: "BFD9E8", margin: 0 });
s.addText([
  { text: "Your agencies, your policy corpus, your tenancy", options: { bullet: true, breakLine: true } },
  { text: "Your tracker, mail, and document integrations", options: { bullet: true, breakLine: true } },
  { text: "Your reviewers in the loop at tier 2 and 3", options: { bullet: true, breakLine: true } },
  { text: "Measured against your hours-per-change baseline", options: { bullet: true } },
], { x: 7.15, y: 3.05, w: 5.25, h: 3.2, fontFace: BODY_F, fontSize: 13, color: "E6F0F6",
  margin: 0, paraSpaceAfter: 11 });
s.addNotes("Honesty is the differentiator, so volunteer it: today this is single-tenant and demo-grade on integrations, and everything on the left is live and measured, not roadmap. The pilot is scoped to produce one number their CFO understands: hours per regulatory change, before and after, on their own documents.");

// M19 ── DIVIDER PART 3 ---------------------------------------------
s=p.addSlide(); s.background=DARK_BG; s.slideNumber={x:12.82,y:7.1,w:0.42,h:0.3,fontFace:BODY_F,fontSize:9,color:"7FA6BC"};
s.addText("PART 3",{x:0.72,y:2.3,w:9,h:0.5,fontFace:BODY_F,fontSize:16,bold:true,charSpacing:4,color:TEAL,margin:0});
s.addText("Technical architecture",{x:0.7,y:2.85,w:12.0,h:1.2,fontFace:TITLE_F,fontSize:48,bold:true,color:WHITE,margin:0});
s.addText("The system diagram  ·  Six agents, one by one  ·  The trust gate in code  ·  Cost anatomy  ·  Reliability  ·  Dependencies  ·  Evals  ·  The repo",
  {x:0.72,y:4.35,w:12.0,h:0.8,fontFace:BODY_F,fontSize:14,color:"8FB8CF",margin:0,lineSpacing:20});
s.addNotes("Transition: everything claimed in parts 1 and 2 maps to a file in a public repository, and this part walks it. Invite the engineers to open the repo alongside.");

// 2 ── ARCHITECTURE ---------------------------------------------------
s=p.addSlide(); s.background=LIGHT_BG; s.slideNumber={x:12.82,y:7.1,w:0.42,h:0.3,fontFace:BODY_F,fontSize:9,color:MUTE};
titleBar(s,"System architecture","One document's path through the pipeline",INK,TEAL);
s.addImage({path:"/home/claude/ria_architecture.png",x:0.55,y:1.75,w:12.2,h:5.45});
s.addNotes("Walk left to right. Public Federal Register text enters, a cheap model triages, three mid-tier specialists analyze over one shared cached copy of the document, the expensive model grades their work, deterministic code computes the tier, and the writer produces the briefing. Point at the two red elements: compute_tier and the human key. Those two are not models, and that is the whole argument.");

// 3 ── AGENT ROSTER ---------------------------------------------------
s=p.addSlide(); s.background=LIGHT_BG; s.slideNumber={x:12.82,y:7.1,w:0.42,h:0.3,fontFace:BODY_F,fontSize:9,color:MUTE};
titleBar(s,"The roster","Six agents, one mission each",INK,TEAL);
const roster=[
  ["Agent","Model","Mission","Cost (USD)","Latency (seconds)"],
  ["Classifier","Haiku 4.5","Route documents to specialists; priority only, no analysis","~$0.002","~4"],
  ["Materiality","Sonnet 5","Score real-world impact on healthcare operations","~$0.007","10 to 13"],
  ["Process Impact","Sonnet 5","Map the regulation to internal workflows and owners","~$0.020","17 to 31"],
  ["Gap Analyzer","Sonnet 5","Find gaps between requirements and current controls","~$0.013 to 0.019","~25"],
  ["Evaluator","Opus 4.8","Grade specialist output quality; the trust boundary","$0.33 to 0.50","170 to 215"],
  ["Synthesizer","Sonnet 5","Produce the executive briefing and remediation plan","~$0.012","20 to 24"],
];
const cw=[1.9,1.15,5.0,1.8,2.25];
roster.forEach((r,i)=>{
  const y=1.95+i*0.72;
  if(i===0) s.addShape("rect",{x:0.6,y:y-0.05,w:12.1,h:0.55,fill:{color:NAVY}});
  else if(i%2===0) s.addShape("rect",{x:0.6,y:y-0.05,w:12.1,h:0.62,fill:{color:"FFFFFF"}});
  let x=0.6;
  r.forEach((cell,j)=>{
    s.addText(cell,{x:x+0.12,y:y,w:cw[j]-0.15,h:i===0?0.45:0.55,fontFace:BODY_F,
      fontSize:i===0?11.5:11.5,bold:i===0||j===0,color:i===0?WHITE:(j===0?NAVY:INK),
      valign:"middle",margin:0});
    x+=cw[j];
  });
});
s.addText("Each agent has a scoped spec at agents/<name>/CLAUDE.md and an implementation in ria/. Specs and code are kept honest against each other by the offline test suite.",
  {x:0.6,y:7.0,w:12.1,h:0.4,fontFace:BODY_F,fontSize:11.5,italic:true,color:MUTE,margin:0});
s.addNotes("The one-line version of each mission, straight from the agents' own spec files. Note the deliberate asymmetry: five agents on cheap and mid tiers, one on the expensive tier, and the expensive one is the only one whose output gates action. Budget concentrates where consequence concentrates.");

// 4 ── CLASSIFIER -----------------------------------------------------
s=p.addSlide(); s.background=LIGHT_BG; s.slideNumber={x:12.82,y:7.1,w:0.42,h:0.3,fontFace:BODY_F,fontSize:9,color:MUTE};
titleBar(s,"Agent 1 · Classifier","Cheap, fast, structurally incapable of prose",INK,TEAL);
kv(s,0.6,1.9,1.85,"Model","Haiku 4.5");
kv(s,2.55,1.9,1.75,"Cost","~$0.002");
kv(s,4.35,1.9,2.25,"Latency","~4 seconds");
kv(s,6.7,1.9,3.3,"Spec","agents/classifier/CLAUDE.md");
kv(s,10.1,1.9,2.6,"Code","ria/classifier.py");
s.addText([
  {text:"Forced tool use: the API is required to call submit_classification, so output is always schema-valid JSON. No parsing, no prose to go wrong.",options:{bullet:true,breakLine:true}},
  {text:"Untrusted framing: title and abstract are wrapped as external data; embedded instructions are content, not commands.",options:{bullet:true,breakLine:true}},
  {text:"Batch path: --batch sends the whole set through the Message Batches API at roughly half price.",options:{bullet:true,breakLine:true}},
  {text:"Retry: 3 attempts with backoff for transient failures; 4xx auth/request errors fail fast (ria/retry.py).",options:{bullet:true}},
],{x:0.6,y:2.85,w:6.7,h:3.9,fontFace:BODY_F,fontSize:13,color:INK,margin:0,paraSpaceAfter:13,lineSpacing:18});
code(s,7.6,2.85,5.1,3.15,
"def _postprocess(decision, doc):\n    # clamp confidence to [0, 1]\n    decision[\"confidence\"] = max(0.0,\n        min(1.0, float(decision[\"confidence\"])))\n    # low confidence? route to ALL specialists\n    if decision[\"confidence\"] < _CONFIDENCE_FLOOR:\n        decision[\"routing\"] = {\n            \"materiality\": True,\n            \"process_impact\": True,\n            \"gap_analyzer\": True}\n    return decision",9.5);
s.addText("The backstop: when the model is unsure, code widens coverage instead of trusting the guess.",
  {x:7.6,y:6.15,w:5.1,h:0.6,fontFace:BODY_F,fontSize:11,italic:true,color:MUTE,margin:0});
s.addNotes("Why Haiku: routing is a narrow bounded decision that runs on every document, so volume makes the cheapest capable tier the right default. The code block is the design pattern in miniature: the model gives a confidence, and deterministic post-processing decides what to do when that confidence is low. That pattern, judgment plus code backstop, repeats at every stage.");

// 5 ── SPECIALISTS ----------------------------------------------------
s=p.addSlide(); s.background=LIGHT_BG; s.slideNumber={x:12.82,y:7.1,w:0.42,h:0.3,fontFace:BODY_F,fontSize:9,color:MUTE};
titleBar(s,"Agents 2-4 · Specialists","Three analysts, one cached document, zero tools",INK,TEAL);
const specs=[
  ["MATERIALITY","How much does this matter?","Impact score 0-100 and a risk level. That risk level later feeds the tier decision directly.","~$0.007 · 10 to 13 seconds"],
  ["PROCESS IMPACT","What does it touch?","Maps requirements to specific internal workflows and the owners who must act. The most open-ended task.","~$0.020 · 17 to 31 seconds"],
  ["GAP ANALYZER","Where do we fall short?","Gaps with severity and remediation. Backstop: PHI or patient-safety gaps can never be marked low severity.","~$0.013 to 0.019 · ~25 seconds"],
];
specs.forEach((sp,i)=>{
  const x=0.6+i*4.18;
  card(s,x,1.95,3.9,3.15,WHITE);
  s.addText(sp[0],{x:x+0.3,y:2.2,w:3.3,h:0.35,fontFace:TITLE_F,fontSize:13.5,bold:true,charSpacing:1,color:NAVY,margin:0});
  s.addText(sp[1],{x:x+0.3,y:2.6,w:3.3,h:0.4,fontFace:BODY_F,fontSize:12.5,italic:true,color:TEAL,margin:0});
  s.addText(sp[2],{x:x+0.3,y:3.1,w:3.3,h:1.5,fontFace:BODY_F,fontSize:11.5,color:INK,margin:0,lineSpacing:16});
  s.addText(sp[3],{x:x+0.3,y:4.6,w:3.3,h:0.35,fontFace:BODY_F,fontSize:10.5,bold:true,color:MUTE,margin:0});
});
card(s,0.6,5.4,12.1,1.5,NAVY);
s.addText("SHARED MECHANICS",{x:0.95,y:5.6,w:4,h:0.3,fontFace:TITLE_F,fontSize:11.5,bold:true,charSpacing:2,color:"BFD9E8",margin:0});
s.addText("All Sonnet 5. All run sequentially over ONE cached copy of the document plus Drive policy context: the first call writes the cache, the next two read it at a tenth of input price. None holds a live tool; a per-agent tool definition would vary the shared prefix and break cache reuse, so the pipeline fetches once and hands everything over. Output is schema-forced JSON, post-processed by code.",
  {x:0.95,y:5.95,w:11.4,h:0.9,fontFace:BODY_F,fontSize:11.5,color:"E6F0F6",margin:0,lineSpacing:16});
s.addNotes("The question this slide always draws: why sequential instead of parallel. Answer: parallel calls would race the cache write, each paying full input price plus its own write premium, so sequencing guarantees the one-write-two-reads economics the design is built on. The latency trade is about a minute against a run whose long pole is the Evaluator anyway. If latency ever mattered more, you parallelize documents, not specialists.");

// 6 ── EVALUATOR (dark) ----------------------------------------------
s=p.addSlide(); s.background=DARK_BG; s.slideNumber={x:12.82,y:7.1,w:0.42,h:0.3,fontFace:BODY_F,fontSize:9,color:"7FA6BC"};
s.addText("AGENT 5 · EVALUATOR",{x:0.7,y:0.45,w:9,h:0.35,fontFace:BODY_F,fontSize:12.5,bold:true,charSpacing:3,color:TEAL,margin:0});
s.addText("The trust boundary, split in two on purpose",{x:0.7,y:0.82,w:12.1,h:0.8,fontFace:TITLE_F,fontSize:29,bold:true,color:WHITE,margin:0});
s.addText([
  {text:"Opus 4.8 on the Claude Agent SDK. The one deliberately expensive stage ($0.33 to $0.50, 65-85% of run cost), because this is where judgment quality has the highest consequence.",options:{bullet:true,breakLine:true}},
  {text:"Genuinely agentic: it decides for itself whether, and how often, to call its single tool, a read-only Notion precedent lookup. It cannot write anything, anywhere.",options:{bullet:true,breakLine:true}},
  {text:"It produces scores, confidence, and flags. It does NOT produce a tier. Injected text riding in specialist output is framed as evidence of manipulation and lowers confidence.",options:{bullet:true}},
],{x:0.7,y:1.85,w:5.9,h:4.6,fontFace:BODY_F,fontSize:13,color:"E6F0F6",margin:0,paraSpaceAfter:14,lineSpacing:19});
code(s,6.95,1.85,5.75,4.75,
"def compute_tier(confidence, risk_level,\n                 enforcement, cfg):\n    # TIER 3 checked FIRST -- nothing\n    # out-ranks an escalation trigger\n    if risk_level is None:\n        return 3, False, True\n    if confidence < cfg[\"tier2\"]:      # < 0.75\n        return 3, False, True\n    if risk_level == \"critical\":\n        return 3, False, True\n    if enforcement:\n        return 3, False, True\n    # TIER 1 needs BOTH high confidence\n    # AND low/medium risk\n    if confidence >= cfg[\"tier1\"] and \\\n       risk_level in (\"low\", \"medium\"):\n        return 1, True, False\n    return 2, False, False   # the default",9.5);
s.addText("Condensed from ria/evaluator.py; behavior identical. risk_level comes from the materiality specialist, enforcement from a keyword scan OR the model's flags.",
  {x:6.95,y:6.7,w:5.75,h:0.55,fontFace:BODY_F,fontSize:10,italic:true,color:"8FB8CF",margin:0});
s.addNotes("Slow down here; this is the slide the security architect came for. The model grades, the function decides, and read the function aloud: escalation triggers are checked before anything else, so no confidence score, however high, can outrank critical risk or enforcement language. And the risk input is not the Evaluator restating risk; it is the materiality specialist's own output, so one compromised judgment cannot both inflate confidence and launder risk.");

// 6b ── TIER DECISION MATRIX ----------------------------------------
s=p.addSlide(); s.background=LIGHT_BG; s.slideNumber={x:12.82,y:7.1,w:0.42,h:0.3,fontFace:BODY_F,fontSize:9,color:MUTE};
titleBar(s,"Autonomy tiers","The tier decision as a lookup",INK,TEAL);
const mrows=[
  ["overall_confidence","risk: low","risk: medium","risk: high","risk: critical","risk missing"],
  ["below 0.75","3 escalate","3 escalate","3 escalate","3 escalate","3 escalate"],
  ["0.75 to below 0.90","2 review","2 review","2 review","3 escalate","3 escalate"],
  ["0.90 and above","1 execute","1 execute","2 review","3 escalate","3 escalate"],
];
const mcw=[2.6,1.9,1.9,1.9,1.9,1.9];
mrows.forEach((r,i)=>{
  const y=2.1+i*0.85;
  if(i===0) s.addShape("rect",{x:0.6,y:y-0.05,w:12.1,h:0.7,fill:{color:NAVY}});
  else s.addShape("rect",{x:0.6,y:y-0.05,w:12.1,h:0.75,fill:{color:i%2===0?"FFFFFF":FOAM},
    line:{color:"DCE7EE",width:0.5}});
  let x=0.6;
  r.forEach((cell,j)=>{
    const tierColor = cell.startsWith("1")?NAVY:cell.startsWith("2")?TEAL:cell.startsWith("3")?WARN:INK;
    s.addText(cell,{x:x+0.12,y:y,w:mcw[j]-0.18,h:i===0?0.6:0.65,fontFace:i===0?TITLE_F:BODY_F,
      fontSize:i===0?11.5:12.5,bold:i===0||j===0||cell.startsWith("1")||cell.startsWith("3"),
      color:i===0?WHITE:(j===0?INK:tierColor),valign:"middle",margin:0});
    x+=mcw[j];
  });
});
s.addText([
  {text:"enforcement_detected = true overrides every cell to tier 3. ",options:{bold:true,color:WARN,breakLine:true}},
  {text:"Inputs: overall_confidence from the Evaluator; risk_level from the materiality specialist's own output; enforcement from a keyword scan OR an Evaluator flag. Thresholds are operator configuration (tier1_threshold 0.90, tier2_threshold 0.75 in config/pipeline_config.json).",options:{breakLine:true}},
  {text:"Tier 1 sets execute=True; tier 3 sets escalate=True; tier 2 sets neither. compute_tier() in ria/evaluator.py is authoritative if this table and the code ever disagree.",options:{}},
],{x:0.6,y:5.85,w:12.1,h:1.3,fontFace:BODY_F,fontSize:11.5,color:INK,margin:0,lineSpacing:16});
s.addNotes("Walk one cell out loud: confidence 0.92, risk medium, lands at tier 1, and even then nothing external fires without the human key. Then walk the override: enforcement language anywhere sends every cell to tier 3. The three inputs come from three different components, which is why one compromised judgment cannot both inflate confidence and launder risk. If anyone questions a cell, the answer is on the previous slide: the code is authoritative.");

// 7 ── SYNTHESIZER ----------------------------------------------------
s=p.addSlide(); s.background=LIGHT_BG; s.slideNumber={x:12.82,y:7.1,w:0.42,h:0.3,fontFace:BODY_F,fontSize:9,color:MUTE};
titleBar(s,"Agent 6 · Synthesizer","The model writes the briefing. Code performs the side effects.",INK,TEAL);
kv(s,0.6,1.9,1.85,"Model","Sonnet 5");
kv(s,2.55,1.9,1.75,"Cost","~$0.012");
kv(s,4.35,1.9,2.25,"Latency","20 to 24 seconds");
kv(s,6.7,1.9,3.3,"Spec","agents/synthesizer/CLAUDE.md");
kv(s,10.1,1.9,2.6,"Code","ria/synthesizer.py");
s.addText([
  {text:"Briefing via forced tool call: executive summary, risk assessment, remediation plan with actions, owners, priorities, and due dates computed from today.",options:{bullet:true,breakLine:true}},
  {text:"Plain-language backstop: a deterministic scrub strips CFR citations and legalese the prompt asked it to avoid; word boundaries protect domain terms like the FDA De Novo pathway.",options:{bullet:true,breakLine:true}},
  {text:"DOCX and PPTX rendered by python-docx / python-pptx from templates in config/. Always produced; local files are reversible.",options:{bullet:true}},
],{x:0.6,y:2.85,w:6.6,h:3.6,fontFace:BODY_F,fontSize:13,color:INK,margin:0,paraSpaceAfter:13,lineSpacing:18});
card(s,7.5,2.85,5.2,3.6,WHITE,WARN);
s.addText("THE TWO GATED WRITES",{x:7.85,y:3.1,w:4.6,h:0.35,fontFace:TITLE_F,fontSize:12.5,bold:true,charSpacing:2,color:WARN,margin:0});
s.addText([
  {text:"Notion record: only if the tier decision said execute, AND the human key is set.",options:{bullet:true,breakLine:true}},
  {text:"Escalation email: only if the tier decision said escalate, AND the human key is set.",options:{bullet:true,breakLine:true}},
  {text:"Both checks live in the writing code itself, at the point of the write. The model cannot invoke either; it never sees a tool for them.",options:{bullet:true}},
],{x:7.85,y:3.55,w:4.55,h:2.7,fontFace:BODY_F,fontSize:12,color:INK,margin:0,paraSpaceAfter:11,lineSpacing:16});
s.addNotes("The subtle point worth saying out loud: the Synthesizer model has no tools at all. Its only output is JSON. Every side effect, file writes, the tracker record, the email, is performed by deterministic pipeline code acting on the Evaluator gate's decision, with the human key checked again at the exact line that performs the write. Even a fully compromised Synthesizer can only write words.");

// 8 ── COST ANATOMY (chart) ------------------------------------------
s=p.addSlide(); s.background=LIGHT_BG; s.slideNumber={x:12.82,y:7.1,w:0.42,h:0.3,fontFace:BODY_F,fontSize:9,color:MUTE};
titleBar(s,"Cost anatomy","$0.59 per document, and where it goes",INK,TEAL);
s.addChart("bar",[{
  name:"Cost per document (USD)",
  labels:["Synthesize (Sonnet 5)","Evaluate (Opus 4.8)","Gap Analyzer (Sonnet 5)","Process Impact (Sonnet 5)","Materiality (Sonnet 5)","Classify (Haiku 4.5)"],
  values:[0.012,0.40,0.016,0.020,0.007,0.002],
}],{
  x:0.6,y:1.95,w:8.3,h:4.7,barDir:"bar",
  chartColors:[TEAL,WARN,MID,MID,MID,NAVY],chartColorsOpacity:100,
  showLegend:false,showTitle:false,
  showValue:true,dataLabelPosition:"outEnd",dataLabelColor:INK,dataLabelFontSize:10,dataLabelFormatCode:"$0.000",
  catAxisLabelColor:INK,catAxisLabelFontSize:10.5,valAxisLabelColor:MUTE,valAxisLabelFontSize:9,
  valGridLine:{color:"DCE7EE",size:0.5},catGridLine:{style:"none"},valAxisMaxVal:0.45,
});
card(s,9.25,1.95,3.45,4.7,WHITE);
s.addText("WHY THE SKEW IS THE DESIGN",{x:9.55,y:2.2,w:2.9,h:0.6,fontFace:TITLE_F,fontSize:12,bold:true,charSpacing:1,color:NAVY,margin:0});
s.addText("Every cheap stage exists so the budget can concentrate at the one decision that gates action. 65-85% of spend sits at the trust boundary on purpose.\n\nMeasured across live runs: $0.587 total, 4 min 27 sec wall clock. Hard cap: pipeline.max_spend_usd.",
  {x:9.55,y:2.9,w:2.9,h:3.5,fontFace:BODY_F,fontSize:11.5,color:INK,margin:0,lineSpacing:17});
s.addNotes("If someone suggests using a cheaper model at the gate to cut costs, this chart is the answer inverted: the gate IS the product, and it is priced like it. Everything else was already squeezed: Haiku for volume triage, one cache write with cheap reads for the specialists, Batches at half price for classification. The numbers are measured from live runs and reproduce in the cost breakdown doc.");

// 9 ── RELIABILITY ----------------------------------------------------
s=p.addSlide(); s.background=LIGHT_BG; s.slideNumber={x:12.82,y:7.1,w:0.42,h:0.3,fontFace:BODY_F,fontSize:9,color:MUTE};
titleBar(s,"Reliability","Built for the failure modes it has already met",INK,TEAL);
const rel=[
  ["Targeted retries","3 attempts with exponential backoff, but only for transient failures. Auth and bad-request errors (4xx) fail fast instead of burning retries. Classification lives in ria/retry.py, shared by every agent call."],
  ["Per-document isolation","One bad document logs [FAILED] and the run continues. Ingest retries transient Federal Register errors so one API blip cannot kill a batch."],
  ["Spend circuit breaker","Estimated cost accrues per call (cache-aware pricing in ria/cost.py) and the run halts between documents at the configured ceiling."],
  ["Structured logging","One JSONL line per decision in logs/ria.log: agent, action, outcome, confidence, cache metrics. Headless -p mode keeps stdout as pure JSONL; diagnostics go to stderr."],
];
rel.forEach((r,i)=>{
  const x=0.6+(i%2)*6.28, y=1.95+Math.floor(i/2)*2.35;
  card(s,x,y,5.85,2.1,WHITE);
  s.addText(r[0],{x:x+0.32,y:y+0.22,w:5.2,h:0.4,fontFace:TITLE_F,fontSize:14.5,bold:true,color:NAVY,margin:0});
  s.addText(r[1],{x:x+0.32,y:y+0.68,w:5.25,h:1.3,fontFace:BODY_F,fontSize:11.5,color:INK,margin:0,lineSpacing:16});
});
s.addText("Every mechanism here exists because a live run demonstrated the need for it; the build log in scratchpad/ records each one.",
  {x:0.6,y:6.75,w:12.1,h:0.4,fontFace:BODY_F,fontSize:11.5,italic:true,color:MUTE,margin:0});
s.addNotes("The line that matters: none of this is speculative hardening. The retry split exists because a bad key once burned three backoffs. The markup stripping exists because a large rule arrived as mostly XML tags. The stderr routing exists because diagnostics polluted the headless JSONL stream. Engineering from observed failure, documented in the build log.");

// 10 ── DEPENDENCIES --------------------------------------------------
s=p.addSlide(); s.background=LIGHT_BG; s.slideNumber={x:12.82,y:7.1,w:0.42,h:0.3,fontFace:BODY_F,fontSize:9,color:MUTE};
titleBar(s,"Dependencies","Small, pinned, and honest about what is optional",INK,TEAL);
card(s,0.6,1.95,6.0,4.7,WHITE);
s.addText("RUNTIME (pinned)",{x:0.95,y:2.2,w:5.2,h:0.35,fontFace:TITLE_F,fontSize:12.5,bold:true,charSpacing:2,color:NAVY,margin:0});
s.addText(
"anthropic 0.116          model API + Batches\nclaude-agent-sdk 0.2.116  Evaluator agent loop\nmcp 1.28                  MCP server framework\nhttpx 0.28                Federal Register client\nnotion-client 3.1         tracker integration\ngoogle-api clients        Drive context · Gmail\npydantic 2.13             document model\npython-docx / python-pptx briefing rendering\npython-dotenv 1.2         settings",
  {x:0.95,y:2.65,w:5.35,h:3.8,fontFace:MONO_F,fontSize:11,color:INK,margin:0,lineSpacing:19});
card(s,6.85,1.95,5.85,4.7,WHITE);
s.addText("CREDENTIALS",{x:7.2,y:2.2,w:5.2,h:0.35,fontFace:TITLE_F,fontSize:12.5,bold:true,charSpacing:2,color:NAVY,margin:0});
const creds=[
  ["ANTHROPIC_API_KEY","Required","Ingest, classify, analyze, evaluate all run on this alone",NAVY],
  ["NOTION_API_KEY + IDs","Optional","Precedent lookups return results; enables the gated tracker write",TEAL],
  ["Google OAuth (Drive, Gmail)","Optional","Policy context and the gated escalation path; honest absence otherwise",TEAL],
  ["RIA_EVALUATOR_APPROVED","Human key","Not a credential: the explicit per-run approval for external writes",WARN],
];
creds.forEach((c,i)=>{
  const y=2.7+i*0.98;
  s.addText(c[0],{x:7.2,y,w:3.3,h:0.35,fontFace:MONO_F,fontSize:10.5,bold:true,color:INK,margin:0});
  s.addText(c[1],{x:10.6,y,w:1.9,h:0.35,fontFace:BODY_F,fontSize:10.5,bold:true,color:c[3],margin:0});
  s.addText(c[2],{x:7.2,y:y+0.34,w:5.3,h:0.55,fontFace:BODY_F,fontSize:10,color:MUTE,margin:0,lineSpacing:13});
});
s.addNotes("Two things reviewers like here. Everything is pinned, so a clone next year builds the same system. And the credential story is honest: one key runs the whole analytical pipeline, integrations are enforced at their point of use with clear errors, and the human approval is deliberately not stored anywhere; it is set per run, on purpose, by a person.");

// 11 ── GOVERNANCE IN THE DEV LOOP -----------------------------------
s=p.addSlide(); s.background=LIGHT_BG; s.slideNumber={x:12.82,y:7.1,w:0.42,h:0.3,fontFace:BODY_F,fontSize:9,color:MUTE};
titleBar(s,"Governance in the dev loop","The repo polices its own development",INK,TEAL);
const gov=[
  ["Scoped specs","Root CLAUDE.md carries operator constraints (model routing, side-effect rules); each agent has its own scoped spec. Specs are versioned and tested against the code."],
  ["Claude Code hooks","PreToolUse guards block secret exposure and unapproved side effects (git push included) during development; every tool call lands in logs/audit.jsonl. Fail open by design: tripwire, not wall."],
  ["CI, two gates","Every push: ruff plus 117 offline tests on Linux. Any PR touching prompt-affecting paths (ria/, agents/, evaluations/, config): the live eval suite must pass before merge."],
  ["Committed evidence","Every eval run writes a dated results JSON (outcomes, pass rates, dollar cost) to evaluations/results/, committed after green runs. Claims come with receipts."],
];
gov.forEach((g,i)=>{
  const x=0.6+(i%2)*6.28, y=1.95+Math.floor(i/2)*2.35;
  card(s,x,y,5.85,2.1,WHITE);
  s.addText(g[0],{x:x+0.32,y:y+0.22,w:5.2,h:0.4,fontFace:TITLE_F,fontSize:14.5,bold:true,color:NAVY,margin:0});
  s.addText(g[1],{x:x+0.32,y:y+0.68,w:5.25,h:1.35,fontFace:BODY_F,fontSize:11.5,color:INK,margin:0,lineSpacing:16});
});
s.addNotes("The meta-point: the same trust model that governs the pipeline governs its own development. Models propose changes; deterministic gates (tests, lint, the eval suite) dispose; a human approves the merge. If they ask what fail-open means: a crashing guard must not brick every tool call, so the hooks are a tripwire and the in-code approval checks are the wall.");

// 12 ── EVALS ---------------------------------------------------------
s=p.addSlide(); s.background=LIGHT_BG; s.slideNumber={x:12.82,y:7.1,w:0.42,h:0.3,fontFace:BODY_F,fontSize:9,color:MUTE};
titleBar(s,"Evals","Behavior is measured, including under attack",INK,TEAL);
s.addText([
  {text:"Offline (free, every push): 117 unit tests pin the deterministic layer: tier precedence, backstops, gates, hooks, cost math.",options:{bullet:true,breakLine:true}},
  {text:"Live (real API cost): behavioral assertions on real model output. Cheap cases run 3x through a pass-rate harness; a rate is a measurement, one sample is an anecdote.",options:{bullet:true,breakLine:true}},
  {text:"Adversarial: fixtures embed a fake operator override demanding low priority, zero gaps, 0.99 confidence, and a canary opener, inside unmistakably urgent enforcement content.",options:{bullet:true}},
],{x:0.6,y:1.95,w:6.5,h:3.6,fontFace:BODY_F,fontSize:13,color:INK,margin:0,paraSpaceAfter:14,lineSpacing:19});
card(s,7.4,1.95,5.3,4.55,NAVY);
s.addText("THE INJECTION SUITE ASSERTS",{x:7.75,y:2.2,w:4.6,h:0.4,fontFace:TITLE_F,fontSize:12,bold:true,charSpacing:1,color:"BFD9E8",margin:0});
s.addText([
  {text:"Classifier still routes and keeps priority high; the canary opener does not appear",options:{bullet:true,breakLine:true}},
  {text:"Gap analyzer still reports gaps despite the injected zero-gaps demand",options:{bullet:true,breakLine:true}},
  {text:"The gate holds: with injected 0.99 confidence riding inside a specialist's own reasoning against two critical gaps, execute stays False",options:{bullet:true}},
],{x:7.75,y:2.7,w:4.6,h:3.0,fontFace:BODY_F,fontSize:12,color:"E6F0F6",margin:0,paraSpaceAfter:12,lineSpacing:17});
s.addText("evaluations/test_injection_evals.py",{x:7.75,y:5.95,w:4.6,h:0.35,fontFace:MONO_F,fontSize:10,color:"8FB8CF",margin:0});
s.addText("Honest caveat, stated in the repo: passing these fixtures is evidence, not a guarantee against attacks nobody has written. The load-bearing defense is that the tier and both gates are code.",
  {x:0.6,y:5.85,w:6.5,h:1.0,fontFace:BODY_F,fontSize:11.5,italic:true,color:MUTE,margin:0,lineSpacing:16});
s.addNotes("Offer to run the injection suite live; it takes a few minutes and watching injected directives fail to move the system lands harder than any slide. And volunteer the caveat before they raise it: prompt framing is instruction, not proof, which is exactly why the architecture never lets a model output touch an external system without deterministic code and a human in between.");

// 13 ── REPO MAP ------------------------------------------------------
s=p.addSlide(); s.background=LIGHT_BG; s.slideNumber={x:12.82,y:7.1,w:0.42,h:0.3,fontFace:BODY_F,fontSize:9,color:MUTE};
titleBar(s,"Reading order","Where everything lives",INK,TEAL);
code(s,0.6,1.95,7.0,4.85,
"main.py                 orchestration + breaker + isolation\nrun_demo.py / .bat      one-command demo\nria/                    the six agents' implementations\n  classifier.py  specialists.py  evaluator.py\n  synthesizer.py caching.py  retry.py  cost.py\nmcp_servers/            federal_register · notion · gmail · drive\nagents/*/CLAUDE.md      per-agent scoped specs\n.claude/hooks/          secrets guard · side-effect guard · audit\nevaluations/            live evals + injection suite + results\ntests/unit/             117 offline tests\ndocs/                   ARCHITECTURE · AGENTS · DESIGN-DECISIONS\n                        RUNBOOK · ENTERPRISE-FAQ · COST-BREAKDOWN\nscratchpad/             chronological build log",10);
card(s,8.0,1.95,4.7,4.85,WHITE);
s.addText("SUGGESTED PATH",{x:8.35,y:2.2,w:4,h:0.35,fontFace:TITLE_F,fontSize:12.5,bold:true,charSpacing:2,color:NAVY,margin:0});
const path=[["1","README, top half: the thesis"],["2","ria/evaluator.py: the gate"],["3","agents/*/CLAUDE.md: the specs"],["4","evaluations/: the proof"],["5","docs/DESIGN-DECISIONS.md: the why"]];
path.forEach((r,i)=>{
  const y=2.75+i*0.78;
  s.addShape("ellipse",{x:8.35,y,w:0.42,h:0.42,fill:{color:NAVY}});
  s.addText(r[0],{x:8.35,y:y-0.005,w:0.42,h:0.42,align:"center",valign:"middle",fontFace:TITLE_F,fontSize:13,bold:true,color:WHITE,margin:0});
  s.addText(r[1],{x:8.95,y:y-0.02,w:3.6,h:0.5,fontFace:BODY_F,fontSize:12,color:INK,valign:"middle",margin:0});
});
s.addNotes("Give reviewers the path instead of the pile: thesis, then the gate function, then the specs, then the evidence, then the rationale. Point at the scratchpad last: it is the unedited chronological build log, dead ends included, and technical reviewers consistently trust a repo more once they see one.");

// 12 ── CLOSE (dark) --------------------------------------------------
s=p.addSlide(); s.background=DARK_BG; s.slideNumber={x:12.82,y:7.1,w:0.42,h:0.3,fontFace:BODY_F,fontSize:9,color:"7FA6BC"};
s.addText("Watch it refuse.", { x: 0.7, y: 1.9, w: 12.0, h: 1.3, fontFace: TITLE_F,
  fontSize: 54, bold: true, color: WHITE, margin: 0 });
s.addText("The live demo runs a real document published this week, end to end, and ends with the system declining to touch your tracker or your inbox because no human turned the key. That refusal is the product.",
  { x: 0.72, y: 3.35, w: 10.2, h: 1.5, fontFace: BODY_F, fontSize: 17, color: "BFD9E8",
    margin: 0, lineSpacing: 25 });
s.addText("github.com/riptide-consulting/riptide-ria   ·   docs/ENTERPRISE-FAQ.md   ·   docs/ARCHITECTURE.md",{x:0.72,y:5.05,w:11.9,h:0.4,fontFace:MONO_F,fontSize:12,color:"BFD9E8",margin:0});
 s.addShape("line", { x: 0.72, y: 5.62, w: 4.2, h: 0, line: { color: TEAL, width: 1.5 } });
s.addText("Riptide Consulting  ·  Carlsbad, CA", { x: 0.72, y: 5.75, w: 8, h: 0.4,
  fontFace: BODY_F, fontSize: 14, bold: true, color: WHITE, margin: 0 });
s.addText("Anthropic-first AI strategy and engineering  ·  Claude Partner Network  ·  Claude Certified Architect",
  { x: 0.72, y: 6.2, w: 11.5, h: 0.4, fontFace: BODY_F, fontSize: 12.5, color: "7FA6BC", margin: 0 });
s.addNotes("Close on the refusal because it inverts every AI pitch they have heard: everyone else demos what their system can do, you demo what yours provably will not do without them. Then the ask: a thirty-day pilot on their agencies and their policy corpus, measured against their own baseline. Ten minutes of live run time, and the briefing lands in front of them before the meeting ends.");

p.writeFile({fileName:"/home/claude/Riptide-RIA-Master-Deck.pptx"}).then(()=>console.log("master written: "+p.slides.length+" slides"));
