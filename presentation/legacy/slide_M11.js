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
