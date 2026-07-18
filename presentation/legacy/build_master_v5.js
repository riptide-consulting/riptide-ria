const pptxgen = require("pptxgenjs");
const p = new pptxgen();
p.layout = "LAYOUT_WIDE";                      // 13.333 x 7.5
p.author = "Riptide Consulting";
p.company = "Riptide Consulting";
p.title = "Riptide RIA: Executive Overview and Technical Architecture";

/* ============================================================
   RIPTIDE BRAND SYSTEM  (tokens from riptideconsulting.com)
   ============================================================ */
const ABYSS   = "0A1628";   // Abyss Navy   - primary
const TEAL    = "00C9B1";   // Riptide Teal - accent / highlight
const AMBER   = "F59E0B";   // Signal Amber - exception, human gate ONLY
const BONE    = "FAF7F2";   // Bone         - light canvas
const SLATE   = "5B6B7C";   // secondary text
const MIST    = "D9E1E7";   // hairlines, inactive fills
const MIDNAVY = "16324B";   // secondary fill
const WHITE   = "FFFFFF";
const DTEAL   = "007A6A";   // Riptide Teal, on-light text variant  (4.92:1 on Bone)
const DAMBER  = "9C5D00";   // Signal Amber, on-light text variant  (4.94:1 on Bone)
const DKRULE  = "1F3A52";   // hairline on dark
const DKTEXT  = "8FA6B8";   // secondary text on dark

const BG_DARK  = { path: "/home/claude/bg_abyss.png" };
const BG_LIGHT = { path: "/home/claude/bg_bone.png" };

const HEAD  = "Inter";
const BODY  = "Inter";
const SERIF = "Source Serif 4";
const MONO  = "Consolas";

/* ---- grid ---- */
const M   = 0.7;            // left margin
const CW  = 11.93;          // content width
const CT  = 1.98;           // content top
const CB  = 6.45;           // content bottom
const SRC = 6.72;           // source line baseline

let PG = 0;

/* ---- frame: kicker, action title, hairline, tracker, page number ---- */
function slide(kicker, title, opts = {}) {
  PG++;
  const dark = !!opts.dark;
  const s = p.addSlide();
  s.background = dark ? BG_DARK : BG_LIGHT;
  s.addText(kicker.toUpperCase(), { x: M, y: 0.44, w: 7.2, h: 0.24, fontFace: MONO,
    fontSize: 8, bold: true, charSpacing: 2, color: dark ? TEAL : DTEAL, margin: 0 });
  if (opts.tracker) s.addText(opts.tracker.toUpperCase(), { x: 6.5, y: 0.44, w: 6.13, h: 0.24,
    align: "right", fontFace: MONO, fontSize: 8, charSpacing: 1.5,
    color: dark ? DKRULE : MIST, margin: 0 });
  s.addText(title, { x: M, y: 0.72, w: opts.titleW || CW, h: opts.titleH || 0.92, fontFace: HEAD,
    fontSize: opts.titleSize || 22, bold: true, color: dark ? WHITE : ABYSS,
    margin: 0, lineSpacing: opts.titleSize ? opts.titleSize * 1.32 : 29, valign: "top" });
  const ruleY = opts.ruleY || 1.76;
  s.addShape("rect", { x: M, y: ruleY, w: 1.1, h: 0.03, fill: { color: TEAL }, line: { color: TEAL, width: 0 } });
  s.addShape("line", { x: M + 1.15, y: ruleY + 0.015, w: CW - 1.15, h: 0,
    line: { color: dark ? DKRULE : MIST, width: 0.75 } });
  if (!opts.noNum) s.addText(String(PG), { x: 12.0, y: SRC, w: 0.63, h: 0.28, align: "right",
    fontFace: MONO, fontSize: 8.5, color: dark ? DKRULE : SLATE, margin: 0 });
  return s;
}
const source = (s, txt, dark) => s.addText(txt, { x: M, y: SRC, w: 10.9, h: 0.28,
  fontFace: BODY, fontSize: 8, color: dark ? DKRULE : SLATE, margin: 0 });

/* ---- flat panel (no shadow, hairline border) ---- */
const panel = (s, x, y, w, h, fill, border) => s.addShape("roundRect", { x, y, w, h,
  rectRadius: 0.04, fill: { color: fill }, line: { color: border || MIST, width: 0.75 },
  shadow: { type: "outer", color: "0A1628", opacity: 0.13, blur: 9, offset: 2.5, angle: 90 } });

/* ---- code block: bone field, teal left rule, mono ---- */
function code(s, x, y, w, h, text, fs) {
  s.addShape("roundRect", { x, y, w, h, rectRadius: 0.03, fill: { color: WHITE },
    line: { color: MIST, width: 0.75 },
    shadow: { type: "outer", color: "0A1628", opacity: 0.10, blur: 7, offset: 2, angle: 90 } });
  s.addShape("rect", { x, y: y + 0.03, w: 0.045, h: h - 0.06, fill: { color: TEAL }, line: { color: TEAL, width: 0 } });
  s.addText(text, { x: x + 0.2, y: y + 0.14, w: w - 0.36, h: h - 0.28, fontFace: MONO,
    fontSize: fs || 9.5, color: ABYSS, margin: 0, lineSpacing: (fs || 9.5) + 3, valign: "top" });
}
/* ---- numbered marker ---- */
function mark(s, n, x, y, fill, txt) {
  s.addShape("ellipse", { x, y, w: 0.42, h: 0.42, fill: { color: fill }, line: { color: fill, width: 0 },
    shadow: { type: "outer", color: "0A1628", opacity: 0.18, blur: 6, offset: 1.5, angle: 90 } });
  s.addText(String(n), { x, y: y - 0.005, w: 0.42, h: 0.42, align: "center", valign: "middle",
    fontFace: HEAD, fontSize: 12, bold: true, color: txt, margin: 0 });
}
/* ---- table: navy header, hairline rows ---- */
function grid(s, x, y, w, rows, widths, opts = {}) {
  const rh = opts.rowH || 0.5, hh = opts.headH || 0.42;
  rows.forEach((r, i) => {
    const ry = y + (i === 0 ? 0 : hh + (i - 1) * rh);
    const h = i === 0 ? hh : rh;
    if (i === 0) s.addShape("rect", { x, y: ry, w, h, fill: { color: ABYSS }, line: { color: ABYSS, width: 0 } });
    else s.addShape("line", { x, y: ry + h, w, h: 0, line: { color: MIST, width: 0.5 } });
    let cx = x;
    r.forEach((cell, j) => {
      const isCode = opts.mono && opts.mono.includes(j);
      s.addText(cell, { x: cx + 0.1, y: ry, w: widths[j] - 0.12, h,
        fontFace: isCode ? MONO : BODY, fontSize: i === 0 ? 9 : (opts.fs || 10),
        bold: i === 0 || (opts.boldCol || []).includes(j),
        color: i === 0 ? WHITE : (opts.cellColor ? opts.cellColor(i, j, cell) : ABYSS),
        valign: "middle", margin: 0 });
      cx += widths[j];
    });
  });
}

/* ============================================================
   1 · COVER
   ============================================================ */
let s = p.addSlide(); PG++;
s.background = BG_DARK;
s.addShape("rect", { x: 0, y: 0, w: 0.14, h: 7.5, fill: { color: TEAL }, line: { color: TEAL, width: 0 } });
s.addText("RIPTIDECONSULTING", { x: 0.75, y: 0.7, w: 8, h: 0.3, fontFace: HEAD, fontSize: 11,
  bold: true, charSpacing: 3.5, color: WHITE, margin: 0 });
s.addText("Riptide RIA", { x: 0.72, y: 2.25, w: 11.9, h: 1.15, fontFace: HEAD, fontSize: 54,
  bold: true, color: WHITE, margin: 0 });
s.addText("Regulatory Intelligence Agent", { x: 0.75, y: 3.42, w: 11.9, h: 0.5, fontFace: SERIF,
  fontSize: 24, color: TEAL, margin: 0 });
s.addShape("line", { x: 0.75, y: 4.2, w: 3.2, h: 0, line: { color: DKRULE, width: 1 } });
s.addText("Federal Register publication to an owner-assigned remediation plan in about five minutes,\nunder a trust model where models write opinions, code applies the rules, and a human holds the key.",
  { x: 0.75, y: 4.45, w: 9.6, h: 1.0, fontFace: BODY, fontSize: 13.5, color: DKTEXT, margin: 0, lineSpacing: 21 });
s.addText("Executive Overview and Technical Architecture   ·   July 2026", { x: 0.75, y: 6.45, w: 8, h: 0.3,
  fontFace: MONO, fontSize: 9, charSpacing: 1, color: DKTEXT, margin: 0 });
s.addText("Anthropic-first AI strategy and engineering   ·   Claude Partner Network   ·   Carlsbad, CA",
  { x: 0.75, y: 6.8, w: 11, h: 0.3, fontFace: BODY, fontSize: 9, color: DKRULE, margin: 0 });
s.addNotes("One deck, three audiences. Next slide is the map: present the parts this room needs, skip the rest without loss. Open with the one-liner, then the trust sentence, then move.");

/* ============================================================
   2 · NAVIGATION
   ============================================================ */
s = slide("Navigation", "Three parts. Take the ones your room needs.", { tracker: "Riptide RIA" });
const parts = [
  ["01", "The system", "3-8", "What it is, how it decides, what it delivers", "Every audience", "10 min"],
  ["02", "The business case", "9-18", "Outcomes, unit economics, operations, legal, risk, pilot", "Business, legal, operations", "12 min"],
  ["03", "The logical architecture", "19-23", "Capabilities, contracts, invariants, ports. No product names.", "Architecture review", "8 min"],
  ["04", "Technical architecture", "24-37", "Six agents, the code, dependencies, reliability, evals", "Engineering, security", "15 min"],
];
parts.forEach((r, i) => {
  const y = CT + 0.05 + i * 1.14;
  const hi = (i === 1 || i === 2);
  panel(s, M, y, CW, 0.98, hi ? ABYSS : WHITE, hi ? ABYSS : MIST);
  const dk = hi;
  s.addText(r[0], { x: M + 0.28, y: y + 0.14, w: 0.8, h: 0.45, fontFace: SERIF, fontSize: 23,
    bold: true, color: dk ? TEAL : MIST, margin: 0 });
  s.addText(r[1], { x: M + 1.1, y: y + 0.14, w: 3.3, h: 0.36, fontFace: HEAD, fontSize: 14,
    bold: true, color: dk ? WHITE : ABYSS, margin: 0 });
  s.addText("Slides " + r[2], { x: M + 1.1, y: y + 0.54, w: 3.3, h: 0.28, fontFace: MONO,
    fontSize: 8, color: dk ? DKTEXT : SLATE, margin: 0 });
  s.addText(r[3], { x: M + 4.6, y: y + 0.24, w: 4.5, h: 0.6, fontFace: BODY, fontSize: 10,
    color: dk ? DKTEXT : SLATE, margin: 0, lineSpacing: 13 });
  s.addText(r[4], { x: M + 9.3, y: y + 0.18, w: 2.3, h: 0.34, align: "right", fontFace: BODY,
    fontSize: 9.5, color: dk ? DKTEXT : SLATE, margin: 0 });
  s.addText(r[5], { x: M + 9.3, y: y + 0.52, w: 2.3, h: 0.32, align: "right", fontFace: HEAD,
    fontSize: 11.5, bold: true, color: dk ? TEAL : ABYSS, margin: 0 });
});
s.addText("Parts 3 and 4 answer the same question at two altitudes: what the system is, and what it is built from.",
  { x: M, y: CT + 4.72, w: 11.5, h: 0.35, fontFace: SERIF, fontSize: 12, italic: true, color: ABYSS, margin: 0 });
source(s, "Sections stand alone. The live demo runs after the close.");
s.addNotes("Set the contract with the room: three parts, steered by who is present. A mixed executive room gets parts 1 and 2 and the close. An architecture review lives in part 3. Everyone gets the refusal demo.");

/* ============================================================
   3 · PROBLEM
   ============================================================ */
s = slide("The problem", "Regulatory change management is a reading job, and it scales only with headcount",
  { tracker: "Part 1 · The system" });
s.addText("Every business day, CMS and FDA publish. Someone reads it, decides whether it matters, traces which policies and workflows it touches, and writes it up.",
  { x: M, y: CT + 0.15, w: 5.6, h: 1.5, fontFace: BODY, fontSize: 13.5, color: ABYSS, margin: 0, lineSpacing: 21 });
s.addText("Days later. Per change. Forever.", { x: M, y: CT + 1.75, w: 5.6, h: 0.5, fontFace: SERIF,
  fontSize: 21, bold: true, color: ABYSS, margin: 0 });
const probs = [
  ["Slow", "First-pass analysis measured in analyst-days, not minutes"],
  ["Uneven", "Coverage and depth depend on who read what, and when"],
  ["Expensive", "Senior compliance hours spent on triage instead of judgment"],
];
probs.forEach((r, i) => {
  const y = CT + 0.15 + i * 1.5;
  s.addShape("line", { x: 7.0, y: y, w: 5.63, h: 0, line: { color: MIST, width: 0.75 } });
  s.addText(r[0], { x: 7.0, y: y + 0.18, w: 5.6, h: 0.35, fontFace: HEAD, fontSize: 14,
    bold: true, color: ABYSS, margin: 0 });
  s.addText(r[1], { x: 7.0, y: y + 0.58, w: 5.6, h: 0.6, fontFace: BODY, fontSize: 11.5,
    color: SLATE, margin: 0, lineSpacing: 15 });
});
source(s, "Baseline to be established in the pilot against the unit's own hours-per-change figure.");
s.addNotes("Ask how regulatory change reaches their desk today. Their answer becomes the pilot baseline. Never quote an industry statistic here; their own number is the only one that survives scrutiny.");

/* ============================================================
   4 · WHAT IT DOES
   ============================================================ */
s = slide("What RIA does", "Publication in, owner-assigned remediation plan out, in about five minutes",
  { tracker: "Part 1 · The system" });
const kpis = [["~5 min", "publication to finished briefing", ABYSS],
               ["$0.59", "per document, measured live", ABYSS],
               ["100%", "of external actions human-gated", TEAL]];
kpis.forEach((k, i) => {
  const x = M + i * 4.02;
  s.addShape("rect", { x, y: CT + 0.1, w: 0.035, h: 1.9, fill: { color: k[2] }, line: { color: k[2], width: 0 } });
  s.addText(k[0], { x: x + 0.28, y: CT + 0.2, w: 3.4, h: 1.0, fontFace: HEAD, fontSize: 42,
    bold: true, color: k[2], margin: 0 });
  s.addText(k[1], { x: x + 0.3, y: CT + 1.32, w: 3.3, h: 0.6, fontFace: BODY, fontSize: 11,
    color: SLATE, margin: 0, lineSpacing: 14 });
  s.addShape("rect", { x: x + 0.28, y: CT + 1.2, w: 0.6, h: 0.025, fill: { color: TEAL }, line: { color: TEAL, width: 0 } });
});
s.addShape("line", { x: M, y: CT + 2.35, w: CW, h: 0, line: { color: MIST, width: 0.75 } });
s.addText("It monitors the agencies you answer to, analyzes each publication against your internal policy context, and delivers an executive briefing: plain-language summary, risk assessment, and a remediation table with actions, owners, and due dates.",
  { x: M, y: CT + 2.6, w: 11.0, h: 1.2, fontFace: BODY, fontSize: 14, color: ABYSS, margin: 0, lineSpacing: 22 });
source(s, "Source: docs/COST-BREAKDOWN.md. Figures measured across live runs, not estimated.");
s.addNotes("Three numbers to know cold: about five minutes wall clock, fifty-nine cents per document, one hundred percent of external actions gated. Cost is measured stage by stage in the repo, with a hard spend breaker in configuration.");

/* ============================================================
   5 · HOW IT WORKS
   ============================================================ */
s = slide("How it works", "Five stages, each with one narrow job", { tracker: "Part 1 · The system" });
const steps = [
  ["Ingest", "Pulls new CMS and FDA publications from the Federal Register", ABYSS],
  ["Classify", "A fast triage model assigns urgency and routes to the right analysts", ABYSS],
  ["Analyze", "Three specialists: materiality, process impact, compliance gaps", ABYSS],
  ["Evaluate", "A senior model grades the analysis; code decides the autonomy tier", AMBER, ABYSS],
  ["Synthesize", "Briefing, DOCX and PPTX; tracker record or escalation only if authorized", ABYSS],
];
steps.forEach((st, i) => {
  const y = CT + 0.2 + i * 0.88;
  mark(s, i + 1, M, y, st[2], st[3] || WHITE);
  s.addText(st[0], { x: M + 0.62, y: y - 0.02, w: 2.0, h: 0.4, fontFace: HEAD, fontSize: 14,
    bold: true, color: ABYSS, valign: "middle", margin: 0 });
  s.addText(st[1], { x: M + 2.75, y: y - 0.02, w: 9.2, h: 0.4, fontFace: BODY, fontSize: 12,
    color: SLATE, valign: "middle", margin: 0 });
});
s.addText("A compliance department in a box: a triage clerk, three analysts, a senior partner who grades but does not decide, and a writer whose side effects are locked.",
  { x: M, y: CT + 4.05, w: 11.5, h: 0.5, fontFace: SERIF, fontSize: 13, italic: true, color: ABYSS, margin: 0 });
source(s, "Stage four is amber because it is the trust boundary. It gets its own slide next.");
s.addNotes("The metaphor lands: compliance department in a box. Triage clerk decides urgency, three analysts study one shared cached copy, which is why cost stays low. Senior partner grades the work but does not decide what happens next. Step four is amber on purpose.");

/* ============================================================
   6 · TRUST MODEL (dark)
   ============================================================ */
s = slide("The trust model", "Models write opinions.\nCode applies the rules.\nA human holds the key.",
  { dark: true, tracker: "Part 1 · The system", titleSize: 30, titleH: 1.85, ruleY: 2.62 });
const cols = [
  ["JUDGMENT", "The senior model scores each analysis for quality and produces an overall confidence and flags. It holds one read-only lookup tool and cannot write anything, anywhere."],
  ["DISPOSAL", "A deterministic function turns those scores into tier 1, 2, or 3. Escalation triggers are checked first; nothing outranks them. No model asserts its own tier."],
  ["APPROVAL", "Every external write additionally requires an explicit human approval, checked in code at the moment of the action. No approval, no side effect."],
];
cols.forEach((c, i) => {
  const x = M + i * 4.02;
  s.addShape("rect", { x, y: CT + 0.95, w: 3.66, h: 0.045, fill: { color: i === 2 ? AMBER : TEAL },
    line: { color: i === 2 ? AMBER : TEAL, width: 0 } });
  s.addText(c[0], { x, y: CT + 1.15, w: 3.6, h: 0.4, fontFace: HEAD, fontSize: 13, bold: true,
    charSpacing: 1.5, color: WHITE, margin: 0 });
  s.addText(c[1], { x, y: CT + 1.65, w: 3.6, h: 2.4, fontFace: BODY, fontSize: 11.5,
    color: DKTEXT, margin: 0, lineSpacing: 17 });
});
source(s, "Implemented in ria/evaluator.py (compute_tier) and enforced at each writer. Verbatim code in Part 3.", true);
s.addNotes("The load-bearing slide; slow down. Three separations: the expensive model grades but cannot act; a plain reviewable function applies fixed rules with escalation checked first; an explicit human sign-off is checked in code at every external write. If they remember one sentence, it is this title.");

/* ============================================================
   7 · TIERS
   ============================================================ */
s = slide("Autonomy tiers", "Autonomy is computed by code, never asserted by a model",
  { tracker: "Part 1 · The system" });
const tiers = [
  ["1", "Auto-execute", "Confidence at or above 0.90 AND risk low or medium. Even then, no external write without the human key.", ABYSS],
  ["2", "Human review", "The structural default. Anything not clearly tier 1 or tier 3 lands in front of a person.", SLATE],
  ["3", "Escalate", "Low confidence, critical risk, or enforcement language. Checked first; nothing outranks it.", AMBER],
];
tiers.forEach((t, i) => {
  const x = M + i * 4.02;
  panel(s, x, CT + 0.15, 3.66, 3.5, WHITE, MIST);
  s.addShape("rect", { x, y: CT + 0.15, w: 3.66, h: 0.09, fill: { color: t[3] }, line: { color: t[3], width: 0 } });
  s.addText(t[0], { x: x + 0.3, y: CT + 0.42, w: 1.2, h: 1.1, fontFace: SERIF, fontSize: 58,
    bold: true, color: t[3] === AMBER ? DAMBER : t[3], margin: 0 });
  s.addText(t[1], { x: x + 0.3, y: CT + 1.5, w: 3.0, h: 0.4, fontFace: HEAD, fontSize: 15,
    bold: true, color: ABYSS, margin: 0 });
  s.addText(t[2], { x: x + 0.3, y: CT + 1.95, w: 3.1, h: 1.5, fontFace: BODY, fontSize: 11,
    color: SLATE, margin: 0, lineSpacing: 15 });
});
source(s, "Thresholds are operator configuration: tier1 0.90, tier2 0.75 in config/pipeline_config.json. Full matrix on slide 25.");
s.addNotes("Anticipate the question: what if the model is confident and wrong. Confidence alone never grants autonomy. Tier 1 also requires low or medium risk from the analysis itself, escalation triggers are checked before thresholds, and even tier 1 cannot touch an external system without the human key.");

/* ============================================================
   8 · DELIVERABLE
   ============================================================ */
s = slide("The deliverable", "Every run ends with a briefing the team can act on the same day",
  { tracker: "Part 1 · The system" });
s.addText([
  { text: "Plain-language executive summary", options: { bullet: true, breakLine: true } },
  { text: "Risk and materiality assessment", options: { bullet: true, breakLine: true } },
  { text: "Remediation plan: action, owner, due date, priority", options: { bullet: true, breakLine: true } },
  { text: "Word and PowerPoint, ready to circulate", options: { bullet: true, breakLine: true } },
  { text: "Tracker record and escalation email only when gated and approved", options: { bullet: true } },
], { x: M, y: CT + 0.2, w: 5.0, h: 3.3, fontFace: BODY, fontSize: 12.5, color: ABYSS, margin: 0, paraSpaceAfter: 14 });
s.addText("Analysis support, not legal advice. Every briefing carries a verify-with-counsel disclaimer.",
  { x: M, y: CT + 3.6, w: 5.0, h: 0.6, fontFace: BODY, fontSize: 10, italic: true, color: SLATE, margin: 0, lineSpacing: 14 });
panel(s, 6.3, CT + 0.15, 6.33, 4.1, WHITE, MIST);
s.addText("REMEDIATION PLAN", { x: 6.6, y: CT + 0.35, w: 5.7, h: 0.3, fontFace: MONO, fontSize: 8.5,
  bold: true, charSpacing: 1.5, color: SLATE, margin: 0 });
grid(s, 6.6, CT + 0.75, 5.73, [
  ["Action", "Owner", "Due", "Priority"],
  ["Update registration SOP", "Regulatory Affairs", "Aug 01", "High"],
  ["Revise sterility controls", "Quality Assurance", "Aug 15", "High"],
  ["Train affected teams", "Compliance PMO", "Sep 01", "Medium"],
], [2.35, 1.63, 0.85, 0.9], { fs: 9.5, rowH: 0.6,
  cellColor: (i, j, v) => (j === 3 && v === "High") ? DAMBER : ABYSS });
source(s, "Illustrative output from a live run. Due dates are computed from the run date, not templated.");
s.addNotes("If you can, open a real generated briefing instead of talking over this slide; the document is the product. Point at the due dates: computed from today, real dates. Name the disclaimer proudly: analysis support that accelerates counsel, not a replacement.");

/* ============================================================
   9 · PART 2 DIVIDER
   ============================================================ */
PG++;
s = p.addSlide();
s.background = BG_DARK;
s.addShape("rect", { x: 0, y: 0, w: 0.14, h: 7.5, fill: { color: TEAL }, line: { color: TEAL, width: 0 } });
s.addText("02", { x: 0.75, y: 2.1, w: 2, h: 1.2, fontFace: SERIF, fontSize: 64, bold: true, color: TEAL, margin: 0 });
s.addText("The business case", { x: 0.72, y: 3.3, w: 11.9, h: 1.0, fontFace: HEAD, fontSize: 42,
  bold: true, color: WHITE, margin: 0 });
s.addShape("line", { x: 0.75, y: 4.5, w: 3.2, h: 0, line: { color: DKRULE, width: 1 } });
s.addText("What the unit accomplishes  ·  Unit economics  ·  Operations  ·  Integration  ·  Legal  ·  Security  ·  Risk  ·  Evidence  ·  The pilot",
  { x: 0.75, y: 4.75, w: 11.0, h: 0.6, fontFace: BODY, fontSize: 12, color: DKTEXT, margin: 0, lineSpacing: 18 });
s.addText(String(PG), { x: 12.0, y: SRC, w: 0.63, h: 0.28, align: "right", fontFace: MONO,
  fontSize: 8.5, color: DKRULE, margin: 0 });
s.addNotes("Transition: you have seen what it is and how it refuses to act alone. Part 2 is what that is worth to the unit that owns regulatory change, and what it means for cost, operations, legal posture, and risk.");

/* ============================================================
   10 · WHAT THE UNIT ACCOMPLISHES
   ============================================================ */
s = slide("Business purpose", "The unit stops finding and summarizing; it starts deciding and remediating",
  { tracker: "Part 2 · The business case" });
const wins = [
  ["Complete coverage", "Every CMS and FDA publication triaged against identical criteria. Nothing depends on who happened to read what.", "Compliance officer"],
  ["Same-day awareness", "Publication to finished briefing in minutes. Response clocks start when a rule lands, not when someone finds it.", "Operations"],
  ["Expertise redirected", "Analyst hours move from reading and triage to judgment and remediation: the work only your people can do.", "Unit budget owner"],
  ["A standing audit trail", "Every decision recorded with inputs, confidence, and outcome. Audit questions answered from the log, not memory.", "Legal and internal audit"],
  ["Institutional consistency", "The triage rubric is versioned, tested, and applied identically. Criteria change by review, not by drift.", "Risk committee"],
];
wins.forEach((w, i) => {
  const y = CT + 0.12 + i * 0.9;
  s.addShape("line", { x: M, y: y, w: CW, h: 0, line: { color: MIST, width: 0.5 } });
  s.addText(w[0], { x: M, y: y + 0.16, w: 2.7, h: 0.4, fontFace: HEAD, fontSize: 12.5,
    bold: true, color: ABYSS, margin: 0 });
  s.addText(w[1], { x: M + 2.85, y: y + 0.12, w: 6.6, h: 0.62, fontFace: BODY, fontSize: 10.5,
    color: SLATE, margin: 0, lineSpacing: 14 });
  s.addText(w[2], { x: M + 9.65, y: y + 0.16, w: 2.3, h: 0.4, align: "right", fontFace: MONO,
    fontSize: 8, charSpacing: 0.5, color: DTEAL, margin: 0 });
});
source(s, "Right column: the person in the room who owns the outcome.");
s.addNotes("Tie each row to a person present. The through-line: the unit's output shifts from finding and summarizing to deciding and remediating. That is the sentence the budget owner repeats to their boss.");

/* ============================================================
   11 · COST
   ============================================================ */
s = slide("Cost perspective", "The economics resolve with three numbers you already have",
  { tracker: "Part 2 · The business case" });
panel(s, M, CT + 0.12, 5.8, 4.05, WHITE, MIST);
s.addText("THE EQUATION", { x: M + 0.3, y: CT + 0.32, w: 5.2, h: 0.3, fontFace: MONO, fontSize: 8.5,
  bold: true, charSpacing: 1.5, color: SLATE, margin: 0 });
s.addText("Today, per month", { x: M + 0.3, y: CT + 0.72, w: 5.2, h: 0.3, fontFace: HEAD,
  fontSize: 11.5, bold: true, color: ABYSS, margin: 0 });
code(s, M + 0.3, CT + 1.06, 5.2, 0.55, "documents x hours per doc x loaded rate", 9);
s.addText("With RIA, per month", { x: M + 0.3, y: CT + 1.78, w: 5.2, h: 0.3, fontFace: HEAD,
  fontSize: 11.5, bold: true, color: ABYSS, margin: 0 });
code(s, M + 0.3, CT + 2.12, 5.2, 0.8, "documents x $0.59\n  + (tier 2+3 share x review min x rate)", 9);
s.addText("Reading and first-pass analysis leave the human column entirely. Review of the flagged subset is what remains.",
  { x: M + 0.3, y: CT + 3.1, w: 5.2, h: 0.8, fontFace: BODY, fontSize: 10.5, color: SLATE, margin: 0, lineSpacing: 14 });
panel(s, 6.83, CT + 0.12, 5.8, 4.05, ABYSS, ABYSS);
s.addText("MEASURED", { x: 7.13, y: CT + 0.32, w: 5.2, h: 0.3, fontFace: MONO, fontSize: 8.5,
  bold: true, charSpacing: 1.5, color: TEAL, margin: 0 });
s.addText("$0.59 per document. A hard spend cap per run. Batch classification at roughly half price. Cache reuse cutting repeat input cost to a tenth.",
  { x: 7.13, y: CT + 0.68, w: 5.2, h: 1.0, fontFace: BODY, fontSize: 11, color: DKTEXT, margin: 0, lineSpacing: 16 });
s.addShape("line", { x: 7.13, y: CT + 1.85, w: 5.2, h: 0, line: { color: DKRULE, width: 0.75 } });
s.addText("YOURS, TO PLUG IN", { x: 7.13, y: CT + 2.0, w: 5.2, h: 0.3, fontFace: MONO, fontSize: 8.5,
  bold: true, charSpacing: 1.5, color: AMBER, margin: 0 });
s.addText([
  { text: "Monthly document volume", options: { bullet: true, breakLine: true } },
  { text: "Current hours per change", options: { bullet: true, breakLine: true } },
  { text: "Loaded hourly rate", options: { bullet: true } },
], { x: 7.28, y: CT + 2.38, w: 5.0, h: 1.1, fontFace: BODY, fontSize: 11, color: WHITE, margin: 0, paraSpaceAfter: 6 });
s.addText("No per-seat licensing in this model: infrastructure, API consumption, and the engagement.",
  { x: 7.13, y: CT + 3.5, w: 5.2, h: 0.5, fontFace: BODY, fontSize: 9.5, color: DKTEXT, margin: 0, lineSpacing: 13 });
source(s, "The 30-day pilot replaces the right-hand variables with your measured numbers. Second-order term, unpriced here: avoided cost of a missed change.");
s.addNotes("Do this math live with their numbers; never quote a benchmark. If they push for a figure today, ask for the three inputs and compute on the whiteboard. The unstated second term is avoided cost: a missed change carries penalty exposure. Name it qualitatively and let their counsel size it.");

/* ============================================================
   12 · OPERATIONS
   ============================================================ */
s = slide("Operational perspective", "Intake stops being a job; review capacity becomes the only constraint",
  { tracker: "Part 2 · The business case" });
panel(s, M, CT + 0.12, 5.8, 4.1, WHITE, MIST);
s.addText("TODAY", { x: M + 0.3, y: CT + 0.32, w: 5.2, h: 0.3, fontFace: MONO, fontSize: 8.5,
  bold: true, charSpacing: 1.5, color: SLATE, margin: 0 });
s.addText([
  { text: "A monitoring rota reads the Federal Register", options: { bullet: true, breakLine: true } },
  { text: "Triage depth and criteria vary by reader", options: { bullet: true, breakLine: true } },
  { text: "Write-ups queue behind other work", options: { bullet: true, breakLine: true } },
  { text: "Awareness is measured in days", options: { bullet: true, breakLine: true } },
  { text: "No unit-level metrics exist for intake", options: { bullet: true } },
], { x: M + 0.3, y: CT + 0.75, w: 5.2, h: 3.2, fontFace: BODY, fontSize: 11.5, color: ABYSS, margin: 0, paraSpaceAfter: 12 });
panel(s, 6.83, CT + 0.12, 5.8, 4.1, ABYSS, ABYSS);
s.addText("WITH RIA", { x: 7.13, y: CT + 0.32, w: 5.2, h: 0.3, fontFace: MONO, fontSize: 8.5,
  bold: true, charSpacing: 1.5, color: TEAL, margin: 0 });
s.addText([
  { text: "Intake is automated; every publication triaged same day", options: { bullet: true, breakLine: true } },
  { text: "The tier 2 queue is the worklist, with draft owners and due dates", options: { bullet: true, breakLine: true } },
  { text: "Escalations reach leadership same day, context attached", options: { bullet: true, breakLine: true } },
  { text: "The unit reports coverage, time-to-briefing, tier mix, cycle time", options: { bullet: true, breakLine: true } },
  { text: "Headcount unchanged: capacity moves to review and remediation", options: { bullet: true } },
], { x: 7.13, y: CT + 0.75, w: 5.2, h: 3.2, fontFace: BODY, fontSize: 11.5, color: WHITE, margin: 0, paraSpaceAfter: 12 });
source(s, "Operating burden: the pipeline runs unattended inside a spend cap. The human cost is review capacity the unit already staffs.");
s.addNotes("The operational pitch is subtraction, not addition: no new system to staff, no console to babysit, intake stops being a job. The metrics line matters to whoever runs the unit: for the first time intake has numbers, which makes next year's budget an evidence conversation.");

/* ============================================================
   13 · INTEGRATION
   ============================================================ */
s = slide("Integration", "Your stack is an adapter swap, not a redesign", { tracker: "Part 2 · The business case" });
s.addText("Every integration sits behind a thin, stable interface. The pipeline, the trust gate, and both approval checks never learn which vendor is behind it.",
  { x: M, y: CT + 0.15, w: 11.5, h: 0.7, fontFace: BODY, fontSize: 13, color: ABYSS, margin: 0, lineSpacing: 20 });
grid(s, M, CT + 1.05, CW, [
  ["Capability", "Demo integration", "Your enterprise system"],
  ["Task tracker", "Notion", "ServiceNow / Jira"],
  ["Email", "Gmail", "Outlook / Exchange"],
  ["Document source", "Google Drive", "SharePoint"],
], [3.9, 3.9, 4.13], { rowH: 0.72, fs: 11.5, boldCol: [0, 2],
  cellColor: (i, j) => j === 1 ? SLATE : ABYSS });
s.addText("Swapping the demo integrations for your systems is the expected first step of an engagement. The governance design is untouched, because none of it lives in the integration layer.",
  { x: M, y: CT + 3.7, w: 11.5, h: 0.6, fontFace: BODY, fontSize: 11, color: SLATE, margin: 0, lineSpacing: 15 });
source(s, "Source: mcp_servers/. Each integration is an MCP server behind a fixed interface.");
s.addNotes("Preempt the objection before it forms: nobody runs Notion and Gmail. Correct, and those are placeholders behind a deliberate boundary. Tracker, mail, and document source each swap as an adapter.");

/* ============================================================
   14 · LEGAL
   ============================================================ */
s = slide("Legal perspective", "Counsel's role is preserved, and the record becomes defensible",
  { tracker: "Part 2 · The business case" });
const legal = [
  ["Analysis support, not legal advice", "Every briefing carries a verify-with-counsel disclaimer. The counsel step is preserved and reached days sooner."],
  ["Defensibility by record", "A timestamped log of what was seen, how it was scored, what was decided, and who approved. Inquiries are answered from the log, not recollection."],
  ["Consistency under scrutiny", "Identical triage criteria on every document reduce the judgment variance an examiner would probe."],
  ["Human authority is structural", "No external action exists without the tier decision AND an explicit human approval checked in code. An architecture fact, not a policy promise."],
  ["Records fit existing governance", "Logs are plain JSONL shipped to the SIEM under retention schedules already in force. Nothing new to govern."],
  ["Privilege workflow unchanged", "Briefings are business records. Anything requiring privilege routes through counsel exactly as it does today."],
];
legal.forEach((r, i) => {
  const x = M + (i % 2) * 6.13, y = CT + 0.15 + Math.floor(i / 2) * 1.5;
  s.addShape("rect", { x, y, w: 0.035, h: 1.15, fill: { color: i === 3 ? AMBER : TEAL }, line: { color: i === 3 ? AMBER : TEAL, width: 0 } });
  s.addText(r[0], { x: x + 0.24, y: y, w: 5.4, h: 0.32, fontFace: HEAD, fontSize: 12,
    bold: true, color: ABYSS, margin: 0 });
  s.addText(r[1], { x: x + 0.24, y: y + 0.36, w: 5.5, h: 0.8, fontFace: BODY, fontSize: 10.5,
    color: SLATE, margin: 0, lineSpacing: 14 });
});
source(s, "Positioning for discussion with your counsel. Riptide advises on architecture and record-keeping, not on legal conclusions.");
s.addNotes("Language discipline: you advise on positioning, their counsel decides. Never promise a legal outcome; promise the record that supports one. The strongest line for a GC is the fourth: human authority is enforced by the architecture, so the answer to who approved this is never nobody, and never a model.");

/* ============================================================
   15 · SECURITY
   ============================================================ */
s = slide("Security and data", "No PHI by design, which makes this a safe first agentic project",
  { tracker: "Part 2 · The business case" });
s.addText([
  { text: "What it reads: ", options: { bold: true } },
  { text: "public Federal Register text, plus excerpts of your internal policy documents from a folder you scope.", options: { breakLine: true } },
  { text: "What it never touches: ", options: { bold: true } },
  { text: "patient records, claims, member data. Policy documents describe how you handle PHI; they do not contain it.", options: { breakLine: true } },
  { text: "Where model calls can run: ", options: { bold: true } },
  { text: "Anthropic's BAA-covered HIPAA-ready API, or Claude on AWS Bedrock or Google Vertex AI inside your own cloud tenancy.", options: { breakLine: true } },
  { text: "Logs: ", options: { bold: true } },
  { text: "structured JSONL, shipped to your SIEM under your retention rules.", options: {} },
], { x: M, y: CT + 0.15, w: 7.4, h: 4.0, fontFace: BODY, fontSize: 12, color: ABYSS, margin: 0,
  paraSpaceAfter: 14, lineSpacing: 18 });
panel(s, 8.5, CT + 0.12, 4.13, 4.05, ABYSS, ABYSS);
s.addText("THE LEAVE-BEHIND", { x: 8.8, y: CT + 0.35, w: 3.6, h: 0.3, fontFace: MONO, fontSize: 8.5,
  bold: true, charSpacing: 1.5, color: TEAL, margin: 0 });
s.addText("An enterprise FAQ written for your security and vendor-risk team: data flows, oversight model, audit trail, failure modes, and cloud options. Plain answers, each mapped to code.",
  { x: 8.8, y: CT + 0.78, w: 3.55, h: 2.4, fontFace: BODY, fontSize: 11, color: DKTEXT, margin: 0, lineSpacing: 16 });
s.addText("docs/ENTERPRISE-FAQ.md", { x: 8.8, y: CT + 3.4, w: 3.55, h: 0.3, fontFace: MONO,
  fontSize: 9, color: WHITE, margin: 0 });
source(s, "Source: docs/DATA-HANDLING.md. HIPAA-readiness and BAA coverage to be confirmed with your counsel against current Anthropic terms.");
s.addNotes("Lead with the strongest card: high analyst-hours value with near-zero PHI exposure, which is exactly the first agentic project a cautious health organization should greenlight. If PHI ever entered scope, the compliant paths already exist as configuration choices, verified with counsel.");

/* ============================================================
   16 · RISK
   ============================================================ */
s = slide("Risk and governance", "Every risk category has an answer, including the ones we raise ourselves",
  { tracker: "Part 2 · The business case" });
const risks = [
  ["Model risk", "The deterministic layer (tier computation, gates, backstops) is unit-tested: 117 offline tests on every change. Model behavior is measured by live evals, including adversarial injection cases, with dated results committed. Prompt changes cannot merge without passing.", false],
  ["Operational risk", "A hard spend cap per run. Per-document isolation so one failure cannot cascade. Documented failure modes with step-by-step recovery in the runbook. Structured logs for every decision.", false],
  ["Third-party risk", "Vendor-risk questions pre-answered in writing: data flows, retention options, and model access via Anthropic's BAA-covered API or your own cloud (Bedrock, Vertex).", false],
  ["Residual risk, stated", "Prompt framing is evidence, not proof, against attacks nobody has written yet. Keyword backstops are heuristics. Both are watched by evals rather than assumed away, and both are survivable because the tier and the gates are code.", true],
];
risks.forEach((r, i) => {
  const x = M + (i % 2) * 6.13, y = CT + 0.12 + Math.floor(i / 2) * 2.15;
  panel(s, x, y, 5.8, 1.95, r[2] ? ABYSS : WHITE, r[2] ? ABYSS : MIST);
  s.addShape("rect", { x, y, w: 5.8, h: 0.045, fill: { color: r[2] ? AMBER : MIST }, line: { color: r[2] ? AMBER : MIST, width: 0 } });
  s.addText(r[0], { x: x + 0.28, y: y + 0.22, w: 5.2, h: 0.35, fontFace: HEAD, fontSize: 13,
    bold: true, color: r[2] ? WHITE : ABYSS, margin: 0 });
  s.addText(r[1], { x: x + 0.28, y: y + 0.62, w: 5.3, h: 1.2, fontFace: BODY, fontSize: 10,
    color: r[2] ? DKTEXT : SLATE, margin: 0, lineSpacing: 13 });
});
source(s, "Source: tests/unit/, evaluations/results/, docs/ENTERPRISE-FAQ.md.");
s.addNotes("Volunteering residual risk disarms a risk committee: it signals the analysis was done rather than avoided. If they ask what happens when the model is wrong: a wrong analysis lands in front of a human at tier 2 or 3; it does not act. If they ask about attacks: show the injection results, then point at the code gates.");

/* ============================================================
   17 · EVIDENCE
   ============================================================ */
s = slide("Engineering evidence", "Proven, not promised: tested, attacked on purpose, evidence committed",
  { tracker: "Part 2 · The business case" });
const ev = [
  ["117", "offline tests gate the codebase on every change", ABYSS],
  ["3x", "each behavioral eval repeats; we assert a pass rate, not a lucky sample", ABYSS],
  ["Attacked", "adversarial injection evals try to steer it with hostile document text", DAMBER],
  ["Audited", "one structured log line per decision, plus a tool-level audit trail", ABYSS],
];
ev.forEach((e, i) => {
  const x = M + (i % 2) * 6.13, y = CT + 0.15 + Math.floor(i / 2) * 2.0;
  s.addShape("line", { x, y, w: 5.8, h: 0, line: { color: MIST, width: 0.75 } });
  s.addText(e[0], { x, y: y + 0.25, w: 2.4, h: 0.85, fontFace: HEAD, fontSize: 32, bold: true,
    color: e[2], margin: 0 });
  s.addText(e[1], { x, y: y + 1.15, w: 5.5, h: 0.6, fontFace: BODY, fontSize: 11, color: SLATE,
    margin: 0, lineSpacing: 15 });
});
s.addText("A hard spend circuit breaker caps every run. Prompt changes cannot merge without passing the eval suite.",
  { x: M, y: CT + 4.05, w: 11.5, h: 0.4, fontFace: BODY, fontSize: 11, italic: true, color: ABYSS, margin: 0 });
source(s, "Source: tests/unit/ (117 passing), evaluations/harness.py, evaluations/test_injection_evals.py, .github/workflows/.");
s.addNotes("The line that separates this from AI demos they have seen: we attack our own system and commit the evidence. Hostile instructions embedded in document text, demanding low priority and inflated confidence, measurably fail to move the classifier, the analysts, or the gate.");

/* ============================================================
   18 · STRAIGHT TALK
   ============================================================ */
s = slide("Straight talk", "What is real today, and what a 30-day pilot adds", { tracker: "Part 2 · The business case" });
panel(s, M, CT + 0.12, 5.8, 4.05, WHITE, MIST);
s.addText("REAL TODAY", { x: M + 0.3, y: CT + 0.32, w: 5.2, h: 0.3, fontFace: MONO, fontSize: 8.5,
  bold: true, charSpacing: 1.5, color: SLATE, margin: 0 });
s.addText([
  { text: "Full pipeline live against the Federal Register", options: { bullet: true, breakLine: true } },
  { text: "Measured cost and runtime, hard spend cap", options: { bullet: true, breakLine: true } },
  { text: "Trust gate, human approval, audit trail", options: { bullet: true, breakLine: true } },
  { text: "Test suite, adversarial evals, committed evidence", options: { bullet: true, breakLine: true } },
  { text: "Single-tenant, demo-grade integrations", options: { bullet: true } },
], { x: M + 0.3, y: CT + 0.75, w: 5.2, h: 3.1, fontFace: BODY, fontSize: 11.5, color: ABYSS, margin: 0, paraSpaceAfter: 11 });
panel(s, 6.83, CT + 0.12, 5.8, 4.05, ABYSS, ABYSS);
s.addText("A 30-DAY PILOT ADDS", { x: 7.13, y: CT + 0.32, w: 5.2, h: 0.3, fontFace: MONO, fontSize: 8.5,
  bold: true, charSpacing: 1.5, color: TEAL, margin: 0 });
s.addText([
  { text: "Your agencies, your policy corpus, your tenancy", options: { bullet: true, breakLine: true } },
  { text: "Your tracker, mail, and document integrations", options: { bullet: true, breakLine: true } },
  { text: "Your reviewers in the loop at tier 2 and 3", options: { bullet: true, breakLine: true } },
  { text: "Measured against your hours-per-change baseline", options: { bullet: true, breakLine: true } },
  { text: "One number your CFO can act on", options: { bullet: true } },
], { x: 7.13, y: CT + 0.75, w: 5.2, h: 3.1, fontFace: BODY, fontSize: 11.5, color: WHITE, margin: 0, paraSpaceAfter: 11 });
source(s, "Everything on the left is live and measured, not roadmap.");
s.addNotes("Honesty is the differentiator, so volunteer it: today this is single-tenant and demo-grade on integrations. Everything on the left is live. The pilot is scoped to produce one number their CFO understands: hours per regulatory change, before and after, on their own documents.");


/* ============================================================
   19 · PART 3 DIVIDER  (logical)
   ============================================================ */
PG++;
s = p.addSlide();
s.background = BG_DARK;
s.addShape("rect", { x: 0, y: 0, w: 0.14, h: 7.5, fill: { color: TEAL }, line: { color: TEAL, width: 0 } });
s.addText("03", { x: 0.75, y: 2.1, w: 2, h: 1.2, fontFace: SERIF, fontSize: 64, bold: true, color: TEAL, margin: 0 });
s.addText("The logical architecture", { x: 0.72, y: 3.3, w: 11.9, h: 1.0, fontFace: HEAD, fontSize: 42,
  bold: true, color: WHITE, margin: 0 });
s.addShape("line", { x: 0.75, y: 4.5, w: 3.2, h: 0, line: { color: DKRULE, width: 1 } });
s.addText("Capabilities  ·  Contracts  ·  Invariants  ·  Ports  ·  Your instantiation", { x: 0.75, y: 4.75,
  w: 11.0, h: 0.4, fontFace: BODY, fontSize: 12, color: DKTEXT, margin: 0 });
s.addText("What the system is, independent of what it is built from. No vendor, product, or model name appears in this section.",
  { x: 0.75, y: 5.3, w: 9.5, h: 0.5, fontFace: SERIF, fontSize: 13, italic: true, color: TEAL, margin: 0 });
s.addText(String(PG), { x: 12.0, y: SRC, w: 0.63, h: 0.28, align: "right", fontFace: MONO,
  fontSize: 8.5, color: DKRULE, margin: 0 });
s.addNotes("The altitude change. Part 2 sold the outcome; part 3 proves the structure holds when you swap every vendor in it. If an enterprise architect is in the room, this is the section they came for, and the vendor-free constraint is the point: say it out loud.");

/* ============================================================
   20 · CAPABILITY MAP
   ============================================================ */
s = slide("Capability map", "Eleven capabilities, and exactly one of them can authorize action",
  { tracker: "Part 3 · The logical architecture" });
s.addImage({ path: "/home/claude/ria_logical.png", x: M, y: CT + 0.05, w: 8.4, h: 4.725 });
const lt = [
  ["Capabilities, not agents", "Nine analysis and authority capabilities plus two cross-cutting. Not one is named after a product.", ABYSS],
  ["Exactly one authorizer", "Autonomy Decision is the only capability that can grant execution, and it is deterministic.", AMBER],
  ["Ports are the seams", "Every external dependency, including the reasoning provider, sits behind a port.", TEAL],
];
lt.forEach((t, i) => {
  const y = CT + 0.15 + i * 1.5;
  s.addShape("rect", { x: 9.4, y, w: 0.035, h: 1.15, fill: { color: t[2] }, line: { color: t[2], width: 0 } });
  s.addText(t[0], { x: 9.64, y, w: 3.0, h: 0.3, fontFace: HEAD, fontSize: 11.5, bold: true, color: ABYSS, margin: 0 });
  s.addText(t[1], { x: 9.64, y: y + 0.34, w: 3.0, h: 0.95, fontFace: BODY, fontSize: 10, color: SLATE, margin: 0, lineSpacing: 13 });
});
source(s, "Reference model. Part 4 shows one instantiation of it; slide 23 maps the two.");
s.addNotes("Walk the bands: inbound ports, analysis capabilities, authorization, cross-cutting. Then say the sentence that earns the section: nothing on this diagram names a product, and that is why it survives your stack. The reasoning provider is a port too, which is the part enterprise architects test you on.");

/* ============================================================
   21 · CONTRACTS
   ============================================================ */
s = slide("Contracts", "Every boundary crossing is a contract, not a conversation",
  { tracker: "Part 3 · The logical architecture" });
grid(s, M, CT + 0.05, CW, [
  ["Entity", "Produced by", "Carries", "Consumed by"],
  ["RegulatoryDocument", "Source Monitoring", "identity, publication date, full text", "Triage, Analysis"],
  ["ClassificationDecision", "Triage", "priority, routing, confidence", "Analysis"],
  ["SpecialistFinding", "The three analyses", "findings, risk level, severity, impact score", "Quality Evaluation, Synthesis"],
  ["EvaluationScore", "Quality Evaluation", "per-analysis quality, overall confidence, flags", "Autonomy Decision"],
  ["AutonomyDecision", "Autonomy Decision", "tier, execute, escalate, rationale", "Gated Execution, Audit"],
  ["Briefing", "Synthesis", "summary, risk assessment, remediation actions", "Artifacts, Gated Execution"],
  ["AuditRecord", "Audit & Observability", "actor, inputs, outcome, timestamp", "Audit Sink Port"],
], [2.75, 2.5, 3.9, 2.78], { rowH: 0.5, fs: 9.5, boldCol: [0], mono: [0],
  cellColor: (i, j) => j === 0 ? ABYSS : SLATE });
s.addShape("rect", { x: M, y: CT + 4.0, w: 0.035, h: 0.5, fill: { color: TEAL }, line: { color: TEAL, width: 0 } });
s.addText("Every crossing is schema-bound. No free text crosses a boundary, which is precisely why an instruction hidden in a source document arrives as data inside a field rather than as a command.",
  { x: M + 0.24, y: CT + 4.0, w: 11.5, h: 0.55, fontFace: BODY, fontSize: 11, color: ABYSS, margin: 0, lineSpacing: 15 });
source(s, "Entity names are logical. Their serialized form and validation live in the technical layer.");
s.addNotes("This is the slide that explains why injection fails structurally rather than by cleverness. Judgment enters the next capability as a typed field, never as prose that could be read as an instruction. An architect will recognize it instantly as contract-first design.");

/* ============================================================
   22 · INVARIANTS
   ============================================================ */
s = slide("Control points", "Six invariants hold no matter which vendors you plug in",
  { tracker: "Part 3 · The logical architecture" });
const inv = [
  ["Judgment cannot self-authorize", "No analysis capability emits an authorization. Judgment produces scores and flags; nothing more."],
  ["Authorization is deterministic", "A pure function maps declared inputs to a tier. Same inputs, same tier, every time, reviewable line by line."],
  ["Escalation dominates", "Escalation conditions are evaluated before any autonomy grant. No confidence value can outrank them."],
  ["Inputs are separated", "No single capability supplies more than one input to the authorization decision."],
  ["Effects require human authority", "External effects occur only with an explicit human key, checked at the point of effect, not at the call site."],
  ["Reversibility asymmetry", "Reversible artifacts are always produced. Irreversible effects are always gated."],
];
inv.forEach((r, i) => {
  const x = M + (i % 2) * 6.13, y = CT + 0.1 + Math.floor(i / 2) * 1.42;
  s.addShape("rect", { x, y, w: 0.035, h: 1.1, fill: { color: i === 4 ? AMBER : TEAL }, line: { color: i === 4 ? AMBER : TEAL, width: 0 } });
  s.addText((i + 1) + ".  " + r[0], { x: x + 0.24, y, w: 5.5, h: 0.3, fontFace: HEAD, fontSize: 12,
    bold: true, color: ABYSS, margin: 0 });
  s.addText(r[1], { x: x + 0.5, y: y + 0.34, w: 5.3, h: 0.78, fontFace: BODY, fontSize: 10.5,
    color: SLATE, margin: 0, lineSpacing: 14 });
});
panel(s, M, CT + 4.42, CW, 0.5, ABYSS, ABYSS);
s.addText("Plus two operating invariants: every decision is recorded before it is trusted, and consumption is bounded by a ceiling.",
  { x: M + 0.3, y: CT + 4.42, w: 11.3, h: 0.5, fontFace: BODY, fontSize: 10.5, color: WHITE, valign: "middle", margin: 0 });
source(s, "These are the properties a review board can test an implementation against. Part 4 shows where each is enforced in code.");
s.addNotes("Hand this slide to their architect as the acceptance criteria for any implementation, including one they build themselves. That reframes you from vendor to author of the reference model, which is a different conversation about a different fee.");

/* ============================================================
   23 · MAPPING
   ============================================================ */
s = slide("Instantiation", "The same logical architecture, instantiated for your stack",
  { tracker: "Part 3 · The logical architecture" });
grid(s, M, CT + 0.05, CW, [
  ["Logical element", "This instantiation", "Your instantiation (illustrative)"],
  ["Reasoning Port", "Hosted model API, three tiers by consequence", "Same models inside your cloud tenancy"],
  ["Regulatory Source Port", "Federal Register public API", "Same, plus state or agency feeds"],
  ["Policy Context Port", "Google Drive folder", "SharePoint or Confluence"],
  ["Precedent Port", "Notion database, read-only", "ServiceNow or your CMDB"],
  ["Work Item Port", "Notion record", "ServiceNow or Jira"],
  ["Notification Port", "Gmail", "Outlook or Exchange"],
  ["Audit Sink Port", "JSONL on disk", "Your SIEM"],
], [3.4, 4.2, 4.33], { rowH: 0.5, fs: 10, boldCol: [0], mono: [0],
  cellColor: (i, j) => j === 1 ? SLATE : ABYSS });
s.addShape("rect", { x: M, y: CT + 4.0, w: 0.035, h: 0.55, fill: { color: AMBER }, line: { color: AMBER, width: 0 } });
s.addText("The capabilities, contracts, and invariants do not move. Only this column does. That is the whole of \"adapters, not a redesign,\" stated structurally rather than promised.",
  { x: M + 0.24, y: CT + 4.0, w: 11.5, h: 0.6, fontFace: BODY, fontSize: 11, color: ABYSS, margin: 0, lineSpacing: 15 });
source(s, "Right column is illustrative, not a commitment. Scoping your actual instantiation is the first week of a pilot.");
s.addNotes("This is the slide that kills the nobody-runs-Notion objection without a fight, because it concedes the point and shows the concession costs nothing. Point at the middle column and call it what it is: a demo instantiation. Then point at the left column: that is the product.");

/* ============================================================
   24 · PART 4 DIVIDER  (technical)
   ============================================================ */
PG++;
s = p.addSlide();
s.background = BG_DARK;
s.addShape("rect", { x: 0, y: 0, w: 0.14, h: 7.5, fill: { color: TEAL }, line: { color: TEAL, width: 0 } });
s.addText("04", { x: 0.75, y: 2.1, w: 2, h: 1.2, fontFace: SERIF, fontSize: 64, bold: true, color: TEAL, margin: 0 });
s.addText("Technical architecture", { x: 0.72, y: 3.3, w: 11.9, h: 1.0, fontFace: HEAD, fontSize: 42,
  bold: true, color: WHITE, margin: 0 });
s.addShape("line", { x: 0.75, y: 4.5, w: 3.2, h: 0, line: { color: DKRULE, width: 1 } });
s.addText("The system diagram  ·  Six agents, one by one  ·  The trust gate in code  ·  Cost anatomy  ·  Reliability  ·  Dependencies  ·  Evals  ·  The repo",
  { x: 0.75, y: 4.75, w: 11.0, h: 0.6, fontFace: BODY, fontSize: 12, color: DKTEXT, margin: 0, lineSpacing: 18 });
s.addText(String(PG), { x: 12.0, y: SRC, w: 0.63, h: 0.28, align: "right", fontFace: MONO,
  fontSize: 8.5, color: DKRULE, margin: 0 });
s.addNotes("Transition: part 3 said what the system is; part 4 shows what this instantiation is built from, and every claim maps to a file in a public repository. Invite the engineers to open the repo alongside; every slide names its files.");

/* ============================================================
   20 · ARCHITECTURE  (exhibit left, takeaways right; TRUE ASPECT)
   ============================================================ */
s = slide("System architecture", "One document's path: judgment, then code, then a human",
  { tracker: "Part 4 · Technical architecture" });
/* image is exactly 16:9 (2880x1620). Place at true aspect: 8.4 wide -> 4.725 high. */
s.addImage({ path: "/home/claude/ria_arch_brand.png", x: M, y: CT + 0.05, w: 8.4, h: 4.725 });
const takeaways = [
  ["Judgment is navy", "Four model stages. Each returns schema-forced JSON and nothing else."],
  ["Rules are white", "compute_tier() is a plain function. Reviewable line by line, immune to persuasion."],
  ["The gate is amber", "Two external writes exist. Both check a human key at the moment of the write."],
];
takeaways.forEach((t, i) => {
  const y = CT + 0.15 + i * 1.5;
  s.addShape("rect", { x: 9.4, y, w: 0.035, h: 1.15, fill: { color: [ABYSS, MIST, AMBER][i] }, line: { color: [ABYSS, MIST, AMBER][i], width: 0 } });
  s.addText(t[0], { x: 9.64, y, w: 3.0, h: 0.3, fontFace: HEAD, fontSize: 11.5, bold: true, color: ABYSS, margin: 0 });
  s.addText(t[1], { x: 9.64, y: y + 0.34, w: 3.0, h: 0.9, fontFace: BODY, fontSize: 10, color: SLATE, margin: 0, lineSpacing: 13 });
});
source(s, "Source: docs/ARCHITECTURE.md. Diagram reflects main.py orchestration as of the review-fixes branch.");
s.addNotes("Walk left to right, then down. Public text in, cheap triage, three specialists over one cached copy, expensive grader, deterministic tier, gated writes. The two amber elements are not models, and that is the whole argument.");

/* ============================================================
   21 · ROSTER
   ============================================================ */
s = slide("The roster", "Six agents, one mission each, priced by consequence",
  { tracker: "Part 4 · Technical architecture" });
grid(s, M, CT + 0.1, CW, [
  ["Agent", "Model", "Mission", "Cost (USD)", "Latency (seconds)"],
  ["Classifier", "Haiku 4.5", "Route documents to specialists; routing only, no analysis", "~$0.002", "~4"],
  ["Materiality", "Sonnet 5", "Score real-world impact on healthcare operations", "~$0.007", "10 to 13"],
  ["Process Impact", "Sonnet 5", "Map the regulation to internal workflows and owners", "~$0.020", "17 to 31"],
  ["Gap Analyzer", "Sonnet 5", "Find gaps between requirements and current controls", "~$0.013 to 0.019", "~25"],
  ["Evaluator", "Opus 4.8", "Grade specialist output; the trust boundary", "$0.33 to 0.50", "170 to 215"],
  ["Synthesizer", "Sonnet 5", "Produce the briefing and remediation plan", "~$0.012", "20 to 24"],
], [1.75, 1.2, 5.03, 1.85, 2.1], { rowH: 0.6, fs: 10.5, boldCol: [0],
  cellColor: (i, j) => (i === 5 && (j === 3 || j === 4)) ? DAMBER : (j === 1 ? SLATE : ABYSS) });
s.addText("Each agent has a scoped spec at agents/<name>/CLAUDE.md and an implementation in ria/. Latency is API-side inference time; host hardware is not a factor.",
  { x: M, y: CT + 4.05, w: 11.5, h: 0.5, fontFace: BODY, fontSize: 10, color: SLATE, margin: 0, lineSpacing: 14 });
source(s, "Source: docs/COST-BREAKDOWN.md, measured across live runs. Model IDs are pinned snapshots in .env.");
s.addNotes("Note the deliberate asymmetry: five agents on cheap and mid tiers, one on the expensive tier, and the expensive one is the only one whose output gates action. Budget concentrates where consequence concentrates.");

/* ============================================================
   22 · CLASSIFIER
   ============================================================ */
s = slide("Agent 1 · Classifier", "Triage runs on the cheapest capable model, with a code floor beneath it",
  { tracker: "Part 4 · Technical architecture" });
const meta = [["Model", "Haiku 4.5"], ["Cost", "~$0.002"], ["Latency", "~4 seconds"],
               ["Spec", "agents/classifier/CLAUDE.md"], ["Code", "ria/classifier.py"]];
meta.forEach((m, i) => {
  const x = M + i * 2.42;
  s.addText(m[0].toUpperCase(), { x, y: CT + 0.05, w: 2.3, h: 0.25, fontFace: MONO, fontSize: 7.5,
    bold: true, charSpacing: 1.2, color: SLATE, margin: 0 });
  s.addText(m[1], { x, y: CT + 0.32, w: 2.35, h: 0.3, fontFace: i > 2 ? MONO : HEAD,
    fontSize: i > 2 ? 9 : 12, bold: i <= 2, color: ABYSS, margin: 0 });
});
s.addShape("line", { x: M, y: CT + 0.78, w: CW, h: 0, line: { color: MIST, width: 0.75 } });
s.addText([
  { text: "Forced tool use: the API must call submit_classification, so output is always schema-valid JSON. No parsing, no prose to go wrong.", options: { bullet: true, breakLine: true } },
  { text: "Untrusted framing: title and abstract are wrapped as external data. Embedded instructions are content, not commands.", options: { bullet: true, breakLine: true } },
  { text: "Batch path: --batch sends the set through the Message Batches API at roughly half price.", options: { bullet: true, breakLine: true } },
  { text: "Retry: 3 attempts with backoff for transient failures; 4xx auth errors fail fast (ria/retry.py).", options: { bullet: true } },
], { x: M, y: CT + 1.0, w: 6.3, h: 3.2, fontFace: BODY, fontSize: 11.5, color: ABYSS, margin: 0,
  paraSpaceAfter: 12, lineSpacing: 16 });
code(s, 7.3, CT + 1.0, 5.33, 2.5,
"def _postprocess(decision, doc):\n    # clamp confidence to [0, 1]\n    decision[\"confidence\"] = max(0.0,\n        min(1.0, float(decision[\"confidence\"])))\n    # low confidence -> route to ALL\n    if decision[\"confidence\"] < _CONFIDENCE_FLOOR:\n        decision[\"routing\"] = {\n            \"materiality\": True,\n            \"process_impact\": True,\n            \"gap_analyzer\": True}\n    return decision", 8.5);
s.addText("When the model is unsure, code widens coverage instead of trusting the guess.",
  { x: 7.3, y: CT + 3.6, w: 5.33, h: 0.5, fontFace: BODY, fontSize: 10, italic: true, color: SLATE, margin: 0 });
source(s, "Source: ria/classifier.py, verbatim. _CONFIDENCE_FLOOR = 0.60.");
s.addNotes("Why Haiku: routing is a narrow bounded decision that runs on every document, so volume makes the cheapest capable tier correct. The code block is the design pattern in miniature: model gives a confidence, deterministic post-processing decides what to do when it is low.");

/* ============================================================
   23 · SPECIALISTS
   ============================================================ */
s = slide("Agents 2-4 · Specialists", "Three analysts read one cached document and hold no tools",
  { tracker: "Part 4 · Technical architecture" });
const specs = [
  ["MATERIALITY", "How much does this matter?", "Impact score 0 to 100 and a risk level. That risk level feeds the tier decision directly.", "~$0.007 · 10 to 13 seconds"],
  ["PROCESS IMPACT", "What does it touch?", "Maps requirements to internal workflows and the owners who must act. The most open-ended task.", "~$0.020 · 17 to 31 seconds"],
  ["GAP ANALYZER", "Where do we fall short?", "Gaps with severity and remediation. PHI and patient-safety gaps can never be marked low severity.", "~$0.013 to 0.019 · ~25 seconds"],
];
specs.forEach((sp, i) => {
  const x = M + i * 4.02;
  panel(s, x, CT + 0.12, 3.66, 2.9, WHITE, MIST);
  s.addText(sp[0], { x: x + 0.28, y: CT + 0.34, w: 3.2, h: 0.3, fontFace: MONO, fontSize: 8.5,
    bold: true, charSpacing: 1.2, color: DTEAL, margin: 0 });
  s.addText(sp[1], { x: x + 0.28, y: CT + 0.68, w: 3.2, h: 0.35, fontFace: SERIF, fontSize: 14,
    color: ABYSS, margin: 0 });
  s.addText(sp[2], { x: x + 0.28, y: CT + 1.12, w: 3.2, h: 1.3, fontFace: BODY, fontSize: 10.5,
    color: SLATE, margin: 0, lineSpacing: 14 });
  s.addText(sp[3], { x: x + 0.28, y: CT + 2.55, w: 3.2, h: 0.3, fontFace: MONO, fontSize: 8,
    color: ABYSS, margin: 0 });
});
panel(s, M, CT + 3.2, CW, 1.1, ABYSS, ABYSS);
s.addText("SHARED MECHANICS", { x: M + 0.3, y: CT + 3.38, w: 4, h: 0.28, fontFace: MONO, fontSize: 8,
  bold: true, charSpacing: 1.2, color: TEAL, margin: 0 });
s.addText("All Sonnet 5, run sequentially over one cached copy of the document plus Drive policy context: the first call writes the cache, the next two read it at a tenth of input price. None holds a live tool, because a per-agent tool definition would vary the shared prefix and break cache reuse.",
  { x: M + 0.3, y: CT + 3.66, w: 11.3, h: 0.6, fontFace: BODY, fontSize: 10.5, color: DKTEXT, margin: 0, lineSpacing: 14 });
source(s, "Source: ria/specialists.py, ria/caching.py.");
s.addNotes("The question this draws: why sequential instead of parallel. Parallel calls would race the cache write, each paying full input price plus its own write premium. Sequencing guarantees one write and two cheap reads. The latency trade is about a minute against a run whose long pole is the Evaluator anyway.");

/* ============================================================
   24 · EVALUATOR (dark)
   ============================================================ */
s = slide("Agent 5 · Evaluator", "The expensive model grades the work; it cannot act on it",
  { dark: true, tracker: "Part 4 · Technical architecture" });
s.addText([
  { text: "Opus 4.8 on the Claude Agent SDK. The highest-cost stage ($0.33 to $0.50; 65 to 85% of run cost), because this is where judgment quality has the highest consequence.", options: { bullet: true, breakLine: true } },
  { text: "The only agentic stage: it decides for itself whether, and how often, to call its single tool, a read-only Notion precedent lookup. It cannot write anything, anywhere.", options: { bullet: true, breakLine: true } },
  { text: "It produces scores, confidence, and flags. It does not produce a tier. Injected text riding in specialist output is framed as evidence of manipulation and lowers confidence.", options: { bullet: true } },
], { x: M, y: CT + 0.15, w: 5.7, h: 4.0, fontFace: BODY, fontSize: 11.5, color: DKTEXT, margin: 0,
  paraSpaceAfter: 14, lineSpacing: 17 });
s.addShape("rect", { x: 6.9, y: CT + 0.12, w: 5.73, h: 4.05, fill: { color: "0D1D31" }, line: { color: DKRULE, width: 0.75 } });
s.addShape("rect", { x: 6.9, y: CT + 0.12, w: 0.035, h: 4.05, fill: { color: AMBER }, line: { color: AMBER, width: 0 } });
s.addText("def compute_tier(confidence, risk_level,\n                 enforcement, cfg):\n    # TIER 3 checked FIRST: nothing\n    # out-ranks an escalation trigger\n    if risk_level is None:\n        return 3, False, True\n    if confidence < cfg[\"tier2\"]:      # < 0.75\n        return 3, False, True\n    if risk_level == \"critical\":\n        return 3, False, True\n    if enforcement:\n        return 3, False, True\n    # TIER 1 needs BOTH high confidence\n    # AND low/medium risk\n    if confidence >= cfg[\"tier1\"] and \\\n       risk_level in (\"low\", \"medium\"):\n        return 1, True, False\n    return 2, False, False   # the default",
  { x: 7.15, y: CT + 0.32, w: 5.3, h: 3.7, fontFace: MONO, fontSize: 9, color: "CFE6EF", margin: 0, lineSpacing: 12.5 });
source(s, "Condensed from ria/evaluator.py; behavior identical. risk_level comes from the materiality specialist; enforcement from a keyword scan OR the model's flags.", true);
s.addNotes("Slow down; this is the slide the security architect came for. The model grades, the function decides. Read the function aloud: escalation triggers checked before anything else, so no confidence score can outrank critical risk or enforcement language. The risk input is the specialist's own output, so one compromised judgment cannot both inflate confidence and launder risk.");

/* ============================================================
   25 · TIER MATRIX
   ============================================================ */
s = slide("Autonomy tiers", "The tier decision, as a lookup table", { tracker: "Part 4 · Technical architecture" });
const mrows = [
  ["overall_confidence", "risk: low", "risk: medium", "risk: high", "risk: critical", "risk missing"],
  ["below 0.75", "3 escalate", "3 escalate", "3 escalate", "3 escalate", "3 escalate"],
  ["0.75 to below 0.90", "2 review", "2 review", "2 review", "3 escalate", "3 escalate"],
  ["0.90 and above", "1 execute", "1 execute", "2 review", "3 escalate", "3 escalate"],
];
grid(s, M, CT + 0.2, CW, mrows, [2.73, 1.84, 1.84, 1.84, 1.84, 1.84], {
  rowH: 0.72, fs: 11, boldCol: [0], mono: [0],
  cellColor: (i, j, v) => v.startsWith("1") ? DTEAL : v.startsWith("3") ? DAMBER : SLATE,
});
s.addShape("rect", { x: M, y: CT + 2.75, w: 0.035, h: 0.4, fill: { color: AMBER }, line: { color: AMBER, width: 0 } });
s.addText("enforcement_detected = true overrides every cell to tier 3.", { x: M + 0.24, y: CT + 2.78,
  w: 8, h: 0.35, fontFace: HEAD, fontSize: 12, bold: true, color: DAMBER, margin: 0 });
s.addText([
  { text: "Inputs come from three different components: overall_confidence from the Evaluator, risk_level from the materiality specialist's own output, enforcement from a keyword scan OR an Evaluator flag. No single component controls more than one input.", options: { breakLine: true } },
  { text: "Tier 1 sets execute=True; tier 3 sets escalate=True; tier 2 sets neither. Thresholds are operator configuration in config/pipeline_config.json.", options: {} },
], { x: M, y: CT + 3.3, w: 11.6, h: 1.0, fontFace: BODY, fontSize: 10.5, color: SLATE, margin: 0,
  paraSpaceAfter: 8, lineSpacing: 14 });
source(s, "Source: ria/evaluator.py. The code is authoritative if this table and the code ever disagree.");
s.addNotes("Walk one cell out loud: confidence 0.92, risk medium, lands at tier 1, and even then nothing external fires without the human key. Then walk the override: enforcement language anywhere sends every cell to tier 3.");

/* ============================================================
   26 · SYNTHESIZER
   ============================================================ */
s = slide("Agent 6 · Synthesizer", "The model writes words; code performs every side effect",
  { tracker: "Part 4 · Technical architecture" });
const meta2 = [["Model", "Sonnet 5"], ["Cost", "~$0.012"], ["Latency", "20 to 24 seconds"],
                ["Spec", "agents/synthesizer/CLAUDE.md"], ["Code", "ria/synthesizer.py"]];
meta2.forEach((m, i) => {
  const x = M + i * 2.42;
  s.addText(m[0].toUpperCase(), { x, y: CT + 0.05, w: 2.3, h: 0.25, fontFace: MONO, fontSize: 7.5,
    bold: true, charSpacing: 1.2, color: SLATE, margin: 0 });
  s.addText(m[1], { x, y: CT + 0.32, w: 2.35, h: 0.3, fontFace: i > 2 ? MONO : HEAD,
    fontSize: i > 2 ? 9 : 12, bold: i <= 2, color: ABYSS, margin: 0 });
});
s.addShape("line", { x: M, y: CT + 0.78, w: CW, h: 0, line: { color: MIST, width: 0.75 } });
s.addText([
  { text: "Briefing via forced tool call: executive summary, risk assessment, remediation plan with actions, owners, priorities, and due dates computed from the run date.", options: { bullet: true, breakLine: true } },
  { text: "Plain-language backstop: a deterministic scrub strips CFR citations and legalese, with word boundaries protecting domain terms such as the FDA De Novo pathway.", options: { bullet: true, breakLine: true } },
  { text: "DOCX and PPTX rendered locally by python-docx and python-pptx from templates in config/. Always produced; local files are reversible.", options: { bullet: true } },
], { x: M, y: CT + 1.0, w: 6.3, h: 3.2, fontFace: BODY, fontSize: 11.5, color: ABYSS, margin: 0,
  paraSpaceAfter: 12, lineSpacing: 16 });
panel(s, 7.3, CT + 1.0, 5.33, 3.05, WHITE, AMBER);
s.addShape("rect", { x: 7.3, y: CT + 1.0, w: 5.33, h: 0.045, fill: { color: AMBER }, line: { color: AMBER, width: 0 } });
s.addText("THE TWO GATED WRITES", { x: 7.6, y: CT + 1.2, w: 4.7, h: 0.3, fontFace: MONO, fontSize: 8.5,
  bold: true, charSpacing: 1.2, color: DAMBER, margin: 0 });
s.addText([
  { text: "Notion record: only if the tier decision said execute, AND the human key is set.", options: { bullet: true, breakLine: true } },
  { text: "Escalation email: only if the tier decision said escalate, AND the human key is set.", options: { bullet: true, breakLine: true } },
  { text: "Both checks live in the writing code itself, at the point of the write. The model never sees a tool for either.", options: { bullet: true } },
], { x: 7.6, y: CT + 1.58, w: 4.75, h: 2.3, fontFace: BODY, fontSize: 10.5, color: ABYSS, margin: 0,
  paraSpaceAfter: 10, lineSpacing: 14 });
source(s, "Source: ria/synthesizer.py, mcp_servers/notion_tracker/writer.py, mcp_servers/gmail/client.py.");
s.addNotes("The subtle point: the Synthesizer model has no tools at all. Its only output is JSON. Every side effect is performed by deterministic pipeline code acting on the gate's decision, with the human key checked again at the exact line that performs the write.");

/* ============================================================
   27 · COST ANATOMY
   ============================================================ */
s = slide("Cost anatomy", "Two-thirds of spend sits at the trust boundary, by design",
  { tracker: "Part 4 · Technical architecture" });
s.addChart("bar", [{
  name: "Cost per document (USD)",
  labels: ["Synthesize (Sonnet 5)", "Evaluate (Opus 4.8)", "Gap Analyzer (Sonnet 5)",
           "Process Impact (Sonnet 5)", "Materiality (Sonnet 5)", "Classify (Haiku 4.5)"],
  values: [0.012, 0.40, 0.016, 0.020, 0.007, 0.002],
}], {
  x: M, y: CT + 0.1, w: 8.2, h: 4.2, barDir: "bar",
  chartColors: [MIST, AMBER, MIST, MIST, MIST, MIST], chartColorsOpacity: 100,
  showLegend: false, showTitle: false,
  showValue: true, dataLabelPosition: "outEnd", dataLabelColor: ABYSS, dataLabelFontSize: 9,
  dataLabelFontFace: BODY, dataLabelFormatCode: "$0.000",
  catAxisLabelColor: ABYSS, catAxisLabelFontSize: 9.5, catAxisLabelFontFace: BODY,
  valAxisLabelColor: SLATE, valAxisLabelFontSize: 8, valAxisLabelFontFace: BODY,
  valGridLine: { color: MIST, size: 0.5 }, catGridLine: { style: "none" },
  valAxisMaxVal: 0.45, valAxisLineShow: false, catAxisLineShow: false,
});
s.addShape("rect", { x: 9.1, y: CT + 0.15, w: 0.035, h: 1.4, fill: { color: AMBER }, line: { color: AMBER, width: 0 } });
s.addText("The skew is the design", { x: 9.34, y: CT + 0.15, w: 3.3, h: 0.3, fontFace: HEAD,
  fontSize: 12, bold: true, color: ABYSS, margin: 0 });
s.addText("Every cheap stage exists so the budget can concentrate at the one decision that gates action.",
  { x: 9.34, y: CT + 0.5, w: 3.3, h: 1.0, fontFace: BODY, fontSize: 10.5, color: SLATE, margin: 0, lineSpacing: 14 });
s.addText("Already squeezed elsewhere", { x: 9.34, y: CT + 1.8, w: 3.3, h: 0.3, fontFace: HEAD,
  fontSize: 12, bold: true, color: ABYSS, margin: 0 });
s.addText([
  { text: "Haiku for volume triage", options: { bullet: true, breakLine: true } },
  { text: "One cache write, two reads at 1/10", options: { bullet: true, breakLine: true } },
  { text: "Batches at roughly half price", options: { bullet: true } },
], { x: 9.34, y: CT + 2.15, w: 3.3, h: 1.1, fontFace: BODY, fontSize: 10, color: SLATE, margin: 0, paraSpaceAfter: 6 });
s.addText("$0.587 total\n4 min 27 sec", { x: 9.34, y: CT + 3.4, w: 3.3, h: 0.7, fontFace: MONO,
  fontSize: 11, bold: true, color: ABYSS, margin: 0, lineSpacing: 16 });
source(s, "Source: docs/COST-BREAKDOWN.md, measured across live runs. Hard ceiling: pipeline.max_spend_usd.");
s.addNotes("If someone suggests a cheaper model at the gate to cut costs, this chart inverted is the answer: the gate is the product and it is priced like it. Everything else was already squeezed.");

/* ============================================================
   28 · RELIABILITY
   ============================================================ */
s = slide("Reliability", "Every mechanism here exists because a live run demanded it",
  { tracker: "Part 4 · Technical architecture" });
const rel = [
  ["Targeted retries", "3 attempts with exponential backoff, but only for transient failures. Auth and bad-request errors (4xx) fail fast instead of burning retries. Classification lives in ria/retry.py, shared by every agent call."],
  ["Per-document isolation", "One bad document logs FAILED and the run continues. Ingest retries transient Federal Register errors so a single API blip cannot kill a batch."],
  ["Spend circuit breaker", "Estimated cost accrues per call with cache-aware pricing in ria/cost.py, and the run halts between documents at the configured ceiling."],
  ["Structured logging", "One JSONL line per decision in logs/ria.log: agent, action, outcome, confidence, cache metrics. In headless -p mode, stdout stays pure JSONL and diagnostics route to stderr."],
];
rel.forEach((r, i) => {
  const x = M + (i % 2) * 6.13, y = CT + 0.15 + Math.floor(i / 2) * 2.05;
  s.addShape("line", { x, y, w: 5.8, h: 0, line: { color: MIST, width: 0.75 } });
  s.addText(r[0], { x, y: y + 0.2, w: 5.5, h: 0.35, fontFace: HEAD, fontSize: 13, bold: true, color: ABYSS, margin: 0 });
  s.addText(r[1], { x, y: y + 0.6, w: 5.6, h: 1.2, fontFace: BODY, fontSize: 10.5, color: SLATE, margin: 0, lineSpacing: 14 });
});
source(s, "Source: scratchpad/ build log. Each mechanism traces to the live run that exposed the need.");
s.addNotes("None of this is speculative hardening. The retry split exists because a bad key burned three backoffs. The markup stripping exists because a large rule arrived as mostly XML. The stderr routing exists because diagnostics polluted the headless JSONL stream.");

/* ============================================================
   29 · DEPENDENCIES
   ============================================================ */
s = slide("Dependencies", "Small, pinned, and honest about what is optional",
  { tracker: "Part 4 · Technical architecture" });
s.addText("RUNTIME (PINNED)", { x: M, y: CT + 0.1, w: 5, h: 0.28, fontFace: MONO, fontSize: 8,
  bold: true, charSpacing: 1.2, color: SLATE, margin: 0 });
code(s, M, CT + 0.45, 5.8, 3.6,
"anthropic 0.116           model API + Batches\nclaude-agent-sdk 0.2.116  Evaluator agent loop\nmcp 1.28                  MCP server framework\nhttpx 0.28                Federal Register client\nnotion-client 3.1         tracker integration\ngoogle-api clients        Drive context / Gmail\npydantic 2.13             document model\npython-docx / -pptx       briefing rendering\npython-dotenv 1.2         settings\npytest / ruff (dev)       117 tests, lint in CI", 9);
s.addText("CREDENTIALS", { x: 6.83, y: CT + 0.1, w: 5, h: 0.28, fontFace: MONO, fontSize: 8,
  bold: true, charSpacing: 1.2, color: SLATE, margin: 0 });
const creds = [
  ["ANTHROPIC_API_KEY", "Required", "Ingest, classify, analyze, evaluate all run on this alone", DTEAL],
  ["NOTION_API_KEY + IDs", "Optional", "Precedent lookups; enables the gated tracker write", SLATE],
  ["Google OAuth", "Optional", "Drive policy context; the gated escalation path", SLATE],
  ["RIA_EVALUATOR_APPROVED", "Human key", "Not a credential: the explicit per-run approval for external writes", DAMBER],
];
creds.forEach((c, i) => {
  const y = CT + 0.45 + i * 0.92;
  s.addShape("line", { x: 6.83, y, w: 5.8, h: 0, line: { color: MIST, width: 0.5 } });
  s.addText(c[0], { x: 6.83, y: y + 0.14, w: 3.4, h: 0.28, fontFace: MONO, fontSize: 9,
    bold: true, color: ABYSS, margin: 0 });
  s.addText(c[1], { x: 10.4, y: y + 0.14, w: 2.2, h: 0.28, align: "right", fontFace: HEAD,
    fontSize: 9.5, bold: true, color: c[3], margin: 0 });
  s.addText(c[2], { x: 6.83, y: y + 0.44, w: 5.7, h: 0.4, fontFace: BODY, fontSize: 9.5,
    color: SLATE, margin: 0, lineSpacing: 12 });
});
source(s, "Source: requirements.txt, .env.example. Integrations are enforced at point of use with named errors, never at startup.");
s.addNotes("Two things reviewers like: everything is pinned, so a clone next year builds the same system, and the credential story is honest. One key runs the whole analytical pipeline. The human approval is deliberately not stored anywhere.");

/* ============================================================
   30 · GOVERNANCE
   ============================================================ */
s = slide("Governance in the dev loop", "The repo polices its own development",
  { tracker: "Part 4 · Technical architecture" });
const gov = [
  ["Scoped specs", "Root CLAUDE.md carries operator constraints (model routing, side-effect rules). Each agent has its own scoped spec, versioned and tested against the code."],
  ["Claude Code hooks", "PreToolUse guards block secret exposure and unapproved side effects, git push included, during development. Every tool call lands in logs/audit.jsonl. Fail open by design: tripwire, not wall."],
  ["CI, two gates", "Every push: ruff plus 117 offline tests. Any PR touching prompt-affecting paths (ria/, agents/, evaluations/, config): the live eval suite must pass before merge."],
  ["Committed evidence", "Every eval run writes a dated results JSON with outcomes, pass rates, and dollar cost to evaluations/results/, committed after green runs. Claims come with receipts."],
];
gov.forEach((g, i) => {
  const x = M + (i % 2) * 6.13, y = CT + 0.15 + Math.floor(i / 2) * 2.05;
  s.addShape("rect", { x, y, w: 0.035, h: 1.55, fill: { color: TEAL }, line: { color: TEAL, width: 0 } });
  s.addText(g[0], { x: x + 0.24, y, w: 5.4, h: 0.32, fontFace: HEAD, fontSize: 13, bold: true, color: ABYSS, margin: 0 });
  s.addText(g[1], { x: x + 0.24, y: y + 0.38, w: 5.4, h: 1.2, fontFace: BODY, fontSize: 10.5,
    color: SLATE, margin: 0, lineSpacing: 14 });
});
s.addText("The same trust model that governs the pipeline governs its own development: models propose, deterministic gates dispose, a human approves the merge.",
  { x: M, y: CT + 4.15, w: 11.5, h: 0.4, fontFace: SERIF, fontSize: 12.5, italic: true, color: ABYSS, margin: 0 });
source(s, "Source: CLAUDE.md, .claude/hooks/, .github/workflows/.");
s.addNotes("The meta-point: the same trust model that governs the pipeline governs its own development. If they ask what fail open means: a crashing guard must not brick every tool call, so hooks are a tripwire and the in-code approval checks are the wall.");

/* ============================================================
   31 · EVALS
   ============================================================ */
s = slide("Evals", "Behavior is measured, including under attack", { tracker: "Part 4 · Technical architecture" });
s.addText([
  { text: "Offline (free, every push): ", options: { bold: true } },
  { text: "117 unit tests pin the deterministic layer: tier precedence, backstops, gates, hooks, cost math.", options: { breakLine: true } },
  { text: "Live (real API cost): ", options: { bold: true } },
  { text: "behavioral assertions on real model output. Cheap cases run 3x through a pass-rate harness, because a rate is a measurement and one sample is an anecdote.", options: { breakLine: true } },
  { text: "Adversarial: ", options: { bold: true } },
  { text: "fixtures embed a fake operator override demanding low priority, zero gaps, 0.99 confidence, and a canary opener, inside unmistakably urgent enforcement content.", options: {} },
], { x: M, y: CT + 0.15, w: 6.3, h: 3.3, fontFace: BODY, fontSize: 11.5, color: ABYSS, margin: 0,
  paraSpaceAfter: 14, lineSpacing: 17 });
s.addText("Passing these fixtures is evidence, not a guarantee against attacks nobody has written. The load-bearing defense is that the tier and both gates are code.",
  { x: M, y: CT + 3.55, w: 6.3, h: 0.7, fontFace: BODY, fontSize: 10, italic: true, color: SLATE, margin: 0, lineSpacing: 14 });
panel(s, 7.3, CT + 0.12, 5.33, 4.05, ABYSS, ABYSS);
s.addText("THE INJECTION SUITE ASSERTS", { x: 7.6, y: CT + 0.34, w: 4.7, h: 0.3, fontFace: MONO,
  fontSize: 8.5, bold: true, charSpacing: 1.2, color: AMBER, margin: 0 });
s.addText([
  { text: "The classifier still routes and keeps priority high; the canary opener never appears", options: { bullet: true, breakLine: true } },
  { text: "The gap analyzer still reports gaps despite the injected zero-gaps demand", options: { bullet: true, breakLine: true } },
  { text: "The gate holds: with injected 0.99 confidence riding inside a specialist's own reasoning against two critical gaps, execute stays False", options: { bullet: true } },
], { x: 7.6, y: CT + 0.75, w: 4.75, h: 2.7, fontFace: BODY, fontSize: 10.5, color: DKTEXT, margin: 0,
  paraSpaceAfter: 12, lineSpacing: 14 });
s.addText("evaluations/test_injection_evals.py", { x: 7.6, y: CT + 3.6, w: 4.7, h: 0.3, fontFace: MONO,
  fontSize: 8.5, color: WHITE, margin: 0 });
source(s, "Source: evaluations/. Dated results committed to evaluations/results/ after each green run.");
s.addNotes("Offer to run the injection suite live; watching injected directives fail to move the system lands harder than any slide. Volunteer the caveat before they raise it: prompt framing is instruction, not proof, which is why the architecture never lets model output touch an external system without code and a human in between.");

/* ============================================================
   32 · READING ORDER
   ============================================================ */
s = slide("Reading order", "Where everything lives", { tracker: "Part 4 · Technical architecture" });
code(s, M, CT + 0.12, 7.6, 4.15,
"main.py                 orchestration + breaker + isolation\nrun_demo.py / .bat      one-command demo\nria/                    the six agents' implementations\n  classifier.py  specialists.py  evaluator.py\n  synthesizer.py caching.py  retry.py  cost.py\nmcp_servers/            federal_register / notion / gmail / drive\nagents/*/CLAUDE.md      per-agent scoped specs\n.claude/hooks/          secrets guard / side-effect guard / audit\nevaluations/            live evals + injection suite + results\ntests/unit/             117 offline tests\ndocs/                   ARCHITECTURE / AGENTS / DESIGN-DECISIONS\n                        RUNBOOK / ENTERPRISE-FAQ / COST-BREAKDOWN\nscratchpad/             chronological build log", 9);
s.addText("SUGGESTED PATH", { x: 8.3, y: CT + 0.12, w: 4.3, h: 0.28, fontFace: MONO, fontSize: 8,
  bold: true, charSpacing: 1.2, color: SLATE, margin: 0 });
const path = [["1", "README, top half: the thesis"], ["2", "ria/evaluator.py: the gate"],
               ["3", "agents/*/CLAUDE.md: the specs"], ["4", "evaluations/: the proof"],
               ["5", "docs/DESIGN-DECISIONS.md: the why"]];
path.forEach((r, i) => {
  const y = CT + 0.55 + i * 0.72;
  mark(s, r[0], 8.3, y, ABYSS, WHITE);
  s.addText(r[1], { x: 8.8, y: y - 0.02, w: 3.8, h: 0.38, fontFace: BODY, fontSize: 11,
    color: ABYSS, valign: "middle", margin: 0 });
});
s.addText("The scratchpad is the unedited build log, dead ends included.", { x: 8.3, y: CT + 4.2,
  w: 4.3, h: 0.4, fontFace: BODY, fontSize: 9.5, italic: true, color: SLATE, margin: 0, lineSpacing: 12 });
source(s, "github.com/riptide-consulting/riptide-ria");
s.addNotes("Give reviewers the path instead of the pile: thesis, the gate function, the specs, the evidence, the rationale. Point at the scratchpad last: technical reviewers trust a repo more once they see an honest build log.");

/* ============================================================
   33 · CLOSE
   ============================================================ */
PG++;
s = p.addSlide();
s.background = BG_DARK;
s.addShape("rect", { x: 0, y: 0, w: 0.14, h: 7.5, fill: { color: TEAL }, line: { color: TEAL, width: 0 } });
s.addText("Watch it refuse.", { x: 0.75, y: 2.0, w: 11.9, h: 1.2, fontFace: HEAD, fontSize: 50,
  bold: true, color: WHITE, margin: 0 });
s.addText("The live demo runs a real document published this week, end to end, and finishes with the system declining to touch your tracker or your inbox because no human turned the key. That refusal is the product.",
  { x: 0.75, y: 3.35, w: 9.8, h: 1.2, fontFace: SERIF, fontSize: 16, color: TEAL, margin: 0, lineSpacing: 25 });
s.addText("github.com/riptide-consulting/riptide-ria   ·   docs/ENTERPRISE-FAQ.md   ·   docs/ARCHITECTURE.md",
  { x: 0.75, y: 4.9, w: 11.5, h: 0.3, fontFace: MONO, fontSize: 10, color: DKTEXT, margin: 0 });
s.addShape("line", { x: 0.75, y: 5.5, w: 3.2, h: 0, line: { color: DKRULE, width: 1 } });
s.addText("RIPTIDECONSULTING", { x: 0.75, y: 5.75, w: 8, h: 0.3, fontFace: HEAD, fontSize: 11,
  bold: true, charSpacing: 3.5, color: WHITE, margin: 0 });
s.addText("Andrew Poole   ·   andrew@riptideconsulting.com   ·   Carlsbad, CA", { x: 0.75, y: 6.15,
  w: 8, h: 0.3, fontFace: BODY, fontSize: 10.5, color: DKTEXT, margin: 0 });
s.addText("Anthropic-first AI strategy and engineering  ·  Claude Partner Network  ·  Claude Certified Architect",
  { x: 0.75, y: 6.5, w: 11, h: 0.3, fontFace: BODY, fontSize: 9, color: DKRULE, margin: 0 });
s.addText(String(PG), { x: 12.0, y: SRC, w: 0.63, h: 0.28, align: "right", fontFace: MONO,
  fontSize: 8.5, color: DKRULE, margin: 0 });
s.addNotes("Close by inverting the usual dynamic: everyone else demos what their system can do; you demo what yours provably will not do without them. Then the ask: a thirty-day pilot on their agencies and their policy corpus, measured against their own baseline.");

p.writeFile({ fileName: "/home/claude/Riptide-RIA-Master-Deck-v5.pptx" })
  .then(() => console.log("master v2 written: " + p.slides.length + " slides"));
