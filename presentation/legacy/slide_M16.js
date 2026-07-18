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
