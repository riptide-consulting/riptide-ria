const pptxgen = require("pptxgenjs");
const p = new pptxgen();
p.layout = "LAYOUT_WIDE"; // 13.33 x 7.5

// ---- Riptide palette (Pacific navy / coastal) ----
const NAVY = "0B2545";   // deep water (dominant)
const MID  = "13416B";   // mid channel
const TEAL = "2E8BA6";   // coastal accent
const FOAM = "F4F8FA";   // light background
const INK  = "1B2B3A";   // body text on light
const MUTE = "5A7184";   // captions
const WARN = "C94F4F";   // escalation accent (sparing)
const WHITE = "FFFFFF";

const TITLE_F = "Century Gothic"; // brand titles (sized with slack)
const BODY_F  = "Trebuchet MS";   // brand body (kept terse, sized with slack)

const DARK_BG  = { path: "/home/claude/bg_dark.png" };
const LIGHT_BG = { path: "/home/claude/bg_light.png" };

// helpers -------------------------------------------------------------
function titleBar(s, kicker, title, color, kickerColor) {
  s.addText(kicker.toUpperCase(), { x: 0.6, y: 0.45, w: 9.5, h: 0.35, fontFace: BODY_F,
    fontSize: 13, bold: true, charSpacing: 3, color: kickerColor, margin: 0 });
  s.addText(title, { x: 0.6, y: 0.82, w: 12.1, h: 0.95, fontFace: TITLE_F,
    fontSize: 34, bold: true, color: color, margin: 0 });
}
function card(s, x, y, w, h, fill) {
  s.addShape("roundRect", { x, y, w, h, rectRadius: 0.08,
    fill: { color: fill }, line: { color: "DCE7EE", width: 0.75 },
    shadow: { type: "outer", color: "0B2545", opacity: 0.10, blur: 6, offset: 2, angle: 90 } });
}
function num(s, n, x, y, fill, txt) {
  s.addShape("ellipse", { x, y, w: 0.52, h: 0.52, fill: { color: fill } });
  s.addText(String(n), { x, y: y - 0.005, w: 0.52, h: 0.52, align: "center", valign: "middle",
    fontFace: TITLE_F, fontSize: 18, bold: true, color: txt, margin: 0 });
}

// 1 ── TITLE ----------------------------------------------------------
let s = p.addSlide();
s.background = DARK_BG;
s.addText("RIPTIDE  RIA", { x: 0.7, y: 1.55, w: 11.9, h: 1.5, fontFace: TITLE_F,
  fontSize: 72, bold: true, color: WHITE, charSpacing: 2, margin: 0 });
s.addText("Regulatory Intelligence Agent", { x: 0.74, y: 3.0, w: 11.8, h: 0.6,
  fontFace: BODY_F, fontSize: 24, color: "BFD9E8", margin: 0 });
s.addText("From Federal Register publication to an owner-assigned remediation plan in about five minutes.",
  { x: 0.74, y: 3.85, w: 9.6, h: 0.9, fontFace: BODY_F, fontSize: 17, italic: true, color: "8FB8CF", margin: 0 });
s.addShape("line", { x: 0.74, y: 5.9, w: 4.2, h: 0, line: { color: TEAL, width: 1.5 } });
s.addText("Riptide Consulting   ·   Anthropic-first engineering   ·   Claude Partner Network",
  { x: 0.74, y: 6.1, w: 11.5, h: 0.4, fontFace: BODY_F, fontSize: 13, color: "7FA6BC", margin: 0 });
s.addNotes("Open with the one-liner: this system reads what CMS and FDA publish, analyzes it against your internal policies, and hands your team a finished briefing with a remediation plan, owners and due dates included, in about five minutes for about sixty cents a document. Then the hook: and the part your security team will care about most is what it is NOT allowed to do on its own. That is the demo.");

// 2 ── THE PROBLEM ----------------------------------------------------
s = p.addSlide();
s.background = LIGHT_BG;
titleBar(s, "The problem", "Regulatory change management is a reading job", INK, TEAL);
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
s = p.addSlide();
s.background = LIGHT_BG;
titleBar(s, "What RIA does", "Publication in, remediation plan out", INK, TEAL);
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
s = p.addSlide();
s.background = LIGHT_BG;
titleBar(s, "How it works", "A compliance department in a box", INK, TEAL);
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
s = p.addSlide();
s.background = DARK_BG;
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
s = p.addSlide();
s.background = LIGHT_BG;
titleBar(s, "Autonomy tiers", "Computed by code, never asserted by a model", INK, TEAL);
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
s = p.addSlide();
s.background = LIGHT_BG;
titleBar(s, "The deliverable", "A briefing your team can act on", INK, TEAL);
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

// 8 ── PROVEN, NOT PROMISED ------------------------------------------
s = p.addSlide();
s.background = LIGHT_BG;
titleBar(s, "Engineering evidence", "Proven, not promised", INK, TEAL);
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

// 9 ── SECURITY & DATA POSTURE ---------------------------------------
s = p.addSlide();
s.background = LIGHT_BG;
titleBar(s, "Security and data", "No PHI, by design", INK, TEAL);
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

// 10 ── FITS YOUR STACK ----------------------------------------------
s = p.addSlide();
s.background = LIGHT_BG;
titleBar(s, "Integration", "Adapters, not a redesign", INK, TEAL);
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

// 11 ── TODAY VS PILOT ------------------------------------------------
s = p.addSlide();
s.background = LIGHT_BG;
titleBar(s, "Straight talk", "What is real today, and what a pilot adds", INK, TEAL);
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

// 12 ── CLOSE (dark) --------------------------------------------------
s = p.addSlide();
s.background = DARK_BG;
s.addText("Watch it refuse.", { x: 0.7, y: 1.9, w: 12.0, h: 1.3, fontFace: TITLE_F,
  fontSize: 54, bold: true, color: WHITE, margin: 0 });
s.addText("The live demo runs a real document published this week, end to end, and ends with the system declining to touch your tracker or your inbox because no human turned the key. That refusal is the product.",
  { x: 0.72, y: 3.35, w: 10.2, h: 1.5, fontFace: BODY_F, fontSize: 17, color: "BFD9E8",
    margin: 0, lineSpacing: 25 });
s.addShape("line", { x: 0.72, y: 5.5, w: 4.2, h: 0, line: { color: TEAL, width: 1.5 } });
s.addText("Riptide Consulting  ·  Carlsbad, CA", { x: 0.72, y: 5.75, w: 8, h: 0.4,
  fontFace: BODY_F, fontSize: 14, bold: true, color: WHITE, margin: 0 });
s.addText("Anthropic-first AI strategy and engineering  ·  Claude Partner Network  ·  Claude Certified Architect",
  { x: 0.72, y: 6.2, w: 11.5, h: 0.4, fontFace: BODY_F, fontSize: 12.5, color: "7FA6BC", margin: 0 });
s.addNotes("Close on the refusal because it inverts every AI pitch they have heard: everyone else demos what their system can do, you demo what yours provably will not do without them. Then the ask: a thirty-day pilot on their agencies and their policy corpus, measured against their own baseline. Ten minutes of live run time, and the briefing lands in front of them before the meeting ends.");

p.writeFile({ fileName: "/home/claude/Riptide-RIA-Executive-Overview.pptx" })
  .then(() => console.log("deck written"));
