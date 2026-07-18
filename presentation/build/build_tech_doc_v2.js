const fs = require("fs");
const _np = require("path");
const _fs = require("fs");
const ROOT = _np.join(__dirname, "..");
const ASSET = f => _np.join(ROOT, "assets", f);
const OUT = _np.join(ROOT, "out");
if (!_fs.existsSync(OUT)) _fs.mkdirSync(OUT, { recursive: true });

const {
  Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, ImageRun,
  Table, TableRow, TableCell, WidthType, ShadingType, BorderStyle, LevelFormat,
  Footer, PageNumber, PageBreak,
} = require("docx");

// Riptide brand system (riptideconsulting.com). DTEAL/DAMBER are the on-light text
// variants: pure Teal/Amber measure under 2:1 on a light page and fail WCAG AA.
const NAVY="0A1628", MID="16324B", TEAL="007A6A", INK="1B2B3A", MUTE="5B6B7C",
      WARN="9C5D00", CODEBG="F5F2ED", CARD="FAF7F2";
const H_F="Inter", B_F="Inter", M_F="Consolas", S_F="Source Serif 4";

const children = [];

// ---------- helpers ----------
const body = (text, opts={}) => new Paragraph({
  spacing:{ after: opts.after ?? 160, line: 276 },
  children:[ new TextRun({ text, font: B_F, size: 21, color: opts.color || INK,
    bold: !!opts.bold, italics: !!opts.italic }) ],
});
const rich = (runs, opts={}) => new Paragraph({
  spacing:{ after: opts.after ?? 160, line: 276 },
  children: runs.map(r => new TextRun({ font: B_F, size: 21, color: INK, ...r })),
});
const h1 = t => new Paragraph({ heading: HeadingLevel.HEADING_1, spacing:{ before: 360, after: 200 },
  children:[ new TextRun({ text: t, font: H_F, size: 32, bold: true, color: NAVY }) ] });
const h2 = t => new Paragraph({ heading: HeadingLevel.HEADING_2, spacing:{ before: 280, after: 160 },
  children:[ new TextRun({ text: t, font: H_F, size: 26, bold: true, color: MID }) ] });
const h3 = t => new Paragraph({ heading: HeadingLevel.HEADING_3, spacing:{ before: 220, after: 120 },
  children:[ new TextRun({ text: t, font: H_F, size: 22, bold: true, color: TEAL }) ] });
const bullet = (t, bold0) => new Paragraph({
  numbering:{ reference:"bullets", level:0 }, spacing:{ after: 100, line: 264 },
  children: Array.isArray(t)
    ? t.map(r => new TextRun({ font: B_F, size: 21, color: INK, ...r }))
    : [ new TextRun({ text: t, font: B_F, size: 21, color: INK, bold: !!bold0 }) ],
});
const step = (ref, t) => new Paragraph({
  numbering:{ reference: ref, level: 0 }, spacing:{ after: 80, line: 264 },
  children:[ new TextRun({ text: t, font: B_F, size: 21, color: INK }) ],
});
const codeBlock = lines => lines.map((ln, i) => new Paragraph({
  shading:{ type: ShadingType.CLEAR, fill: CODEBG },
  spacing:{ after: i === lines.length-1 ? 200 : 0, line: 240 },
  indent:{ left: 240, right: 240 },
  children:[ new TextRun({ text: ln.length ? ln : " ", font: M_F, size: 17, color: "12314F" }) ],
}));
const caption = t => new Paragraph({ spacing:{ after: 240 },
  children:[ new TextRun({ text: t, font: B_F, size: 18, italics: true, color: MUTE }) ] });
const cell = (t, opts={}) => new TableCell({
  width:{ size: opts.w, type: WidthType.DXA },
  shading: opts.fill ? { type: ShadingType.CLEAR, fill: opts.fill } : undefined,
  margins:{ top: 80, bottom: 80, left: 120, right: 120 },
  children:[ new Paragraph({ spacing:{ after: 0, line: 252 },
    children:[ new TextRun({ text: t, font: opts.mono ? M_F : B_F, size: opts.size || 19,
      bold: !!opts.bold, color: opts.color || INK }) ] }) ],
});
const table = (widths, rows) => new Table({
  width:{ size: widths.reduce((a,b)=>a+b,0), type: WidthType.DXA },
  columnWidths: widths,
  rows: rows.map((r, ri) => new TableRow({ children: r.map((c, ci) => cell(c,
    { w: widths[ci], bold: ri===0, fill: ri===0 ? NAVY : (ri%2===0 ? CARD : undefined),
      color: ri===0 ? "FFFFFF" : undefined })) })),
});

// ---------- title ----------
children.push(new Paragraph({ spacing:{ before: 1200, after: 80 },
  children:[ new TextRun({ text:"RIPTIDE RIA", font:H_F, size:64, bold:true, color:NAVY }) ] }));
children.push(new Paragraph({ spacing:{ after: 120 },
  children:[ new TextRun({ text:"Technical Documentation", font:S_F, size:40, color:TEAL }) ] }));
children.push(body("Architecture, launch guide, agent-by-agent code walkthrough, and the reasoning behind every load-bearing decision. Written for engineering, security, and architecture reviewers; every claim names the file that proves it.", { color: MUTE, after: 300 }));
children.push(body("Repository: github.com/riptide-consulting/riptide-ria", { color: MUTE, after: 60 }));
children.push(body("Companion: Riptide Attest (riptide-consulting/riptide-attest), deterministic verification of this system's remediation plans", { color: MUTE, after: 60 }));
children.push(body("Riptide Consulting  ·  Carlsbad, CA  ·  July 2026", { color: MUTE, after: 400 }));

children.push(h2("Contents"));
["1. System overview","2. Launch guide","3. Logical architecture","4. The agents, one by one",
 "5. The trust gate, in code","6. Shared infrastructure","7. Why the decisions were made",
 "8. Data flows and security summary","9. Appendix: dependencies and repository map"].forEach(t => children.push(body(t, { after: 60 })));
children.push(new Paragraph({ children:[ new PageBreak() ] }));

// ---------- 1. system overview ----------
children.push(h1("1. System overview"));
children.push(body("Riptide RIA is a governed multi-agent pipeline. It monitors CMS and FDA publications on the Federal Register, analyzes each document against an organization's internal policy context, and produces an executive briefing with an owner-assigned, due-dated remediation plan, in about five minutes for about $0.59 per document, measured across live runs."));
children.push(body("The design thesis, in one sentence: the autonomy tier is never something a model asserts. Models supply judgment (scores, confidence, flags); a deterministic function turns judgment into a tier; and every external side effect additionally requires an explicit human approval checked in code at the exact point of the write. Models write opinions, code applies the rules, a human holds the key."));
children.push(new Paragraph({ spacing:{ after: 80 }, alignment: AlignmentType.CENTER,
  children:[ new ImageRun({ type:"png", data: fs.readFileSync(ASSET("ria_arch_brand.png")),
    transformation:{ width: 620, height: 349 } }) ] }));
children.push(caption("Figure 1. One document's path through the pipeline. Navy boxes are model judgment; white boxes are deterministic code and artifacts; red elements are the two non-model controls: the tier function and the human key."));
children.push(body("Five stages run under main.py's orchestration: ingest, classify, analyze, evaluate, synthesize. Each stage is isolated per document (one failure logs and the run continues), cost accrues against a hard spend ceiling between documents, and every decision writes one structured log line. RIA is the judgment half of a paired architecture: the remediation plan it produces is a contract artifact with a named consumer, Riptide Attest, which compiles the plan's machine-checkable actions into human-approved specifications and verifies them deterministically, forever. Verification is out of RIA's scope by design, because it demands a property a probabilistic pipeline cannot offer: same evidence, same verdict, byte for byte."));

// ---------- 2. launch guide ----------
children.push(h1("2. Launch guide"));
children.push(h2("2.1 Prerequisites"));
children.push(bullet("Python 3.11 or newer, git, and an Anthropic API key. No other credentials are required for the analytical pipeline (ingest through evaluate)."));
children.push(bullet("Optional: Notion credentials (precedent lookups and the gated tracker write) and Google OAuth credentials (Drive policy context and the gated Gmail escalation). Both are enforced at their point of use with clear errors; nothing fails at startup for lacking them."));
children.push(h2("2.2 Setup (one time per machine)"));
children.push(...codeBlock([
  "git clone https://github.com/riptide-consulting/riptide-ria",
  "cd riptide-ria",
  "python -m venv .venv",
  ".venv\\Scripts\\pip install -r requirements.txt      (Windows)",
  ".venv/bin/pip install -r requirements.txt           (macOS / Linux)",
  "copy .env.example .env        then add ANTHROPIC_API_KEY",
]));
children.push(body("The .env file also carries the model routing policy. All four IDs are pinned snapshots; changing them is an operator decision per root CLAUDE.md, not a default."));
children.push(...codeBlock([
  "MODEL_CLASSIFIER=claude-haiku-4-5-20251001",
  "MODEL_SPECIALIST=claude-sonnet-5",
  "MODEL_EVALUATOR=claude-opus-4-8",
  "MODEL_SYNTHESIZER=claude-sonnet-5",
]));
children.push(h2("2.3 Running it"));
children.push(body("The one-command demo (2 documents end to end; never sets the human key, so you watch the gate correctly report blocked side effects):"));
children.push(...codeBlock([
  "python run_demo.py            cross-platform",
  "run_demo.bat                  Windows double-click; both validate setup first",
]));
children.push(body("Stage-by-stage control via main.py flags. Stages compose left to right; each flag adds a stage:"));
children.push(...codeBlock([
  "python main.py --limit 5                        ingest + classify only",
  "python main.py --batch --limit 10               classify via Message Batches API (~50% off)",
  "python main.py --analyze --evaluate --limit 2   add specialists + the Evaluator",
  "python main.py ... --synthesize                 add briefings + DOCX/PPTX (writes stay gated)",
  "python main.py -p --limit 5                     headless: JSONL on stdout, diagnostics on stderr",
]));
children.push(body("To authorize external writes for a run (the tracker record on execute, the escalation email on escalate), set the human key first. It is read from the environment at the moment of each write; there is no configuration-file equivalent:"));
children.push(...codeBlock([
  "set RIA_EVALUATOR_APPROVED=1        (Windows, current shell only)",
  "python main.py --batch --analyze --evaluate --synthesize --limit 2",
]));
children.push(h2("2.4 What you will see"));
children.push(bullet([{text:"Stage timing (measured, per document): ", bold:true},{text:"classify about 4 seconds; specialists 52 to 69 seconds combined; evaluate 170 to 215 seconds; synthesize 20 to 24 seconds (docs/COST-BREAKDOWN.md). The evaluate stage emits no stdout until the Opus call and its optional precedent-tool loop return, so a 3 to 4 minute gap in terminal output during that stage is expected behavior. Section 2.5, entry 6 covers when a longer gap warrants action."}]));
children.push(bullet([{text:"What drives these numbers: ", bold:true},{text:"per-stage latency is dominated by API-side inference time, so the host machine contributes almost nothing; the same run on a laptop, a workstation, or a cloud VM lands in the same ranges. Local work is limited to DOCX/PPTX rendering (sub-second) and network round trips. Variance within each range comes from four sources: model-server load (transient errors add backoff retries), output length (the Synthesizer may use up to its 8,192 token budget), the Evaluator's tool loop (zero to several precedent lookups, each a Notion round trip), and, when --batch is used, Message Batches queue latency, which trades interactive speed for the roughly 50% cost reduction; the batch path polls rather than streams for exactly this reason."}]));
children.push(bullet([{text:"Outputs: ", bold:true},{text:"briefings land in outputs/docx and outputs/pptx, named by document number. Logs land in logs/ria.log (one JSONL line per decision) and logs/audit.jsonl (tool-level events)."}]));
children.push(bullet([{text:"Expected gating message, not an error: ", bold:true},{text:"without RIA_EVALUATOR_APPROVED set, --synthesize logs that the Notion write and escalation email were skipped. That is the specified behavior of the gates in section 5."}]));
children.push(h2("2.5 Troubleshooting"));
children.push(body("Format: symptom, likely cause, resolution steps in order. File paths are relative to the repository root."));

children.push(h3("1. RuntimeError: ANTHROPIC_API_KEY is not set (or the demo reports no .env)"));
children.push(body("Cause: settings load requires this one variable; both demo launchers check for .env before any API spend.", { after: 80 }));
children.push(step("steps1","Copy .env.example to .env in the repository root."));
children.push(step("steps1","Add ANTHROPIC_API_KEY=<key> with no surrounding quotes and no trailing whitespace."));
children.push(step("steps1","Re-run from a fresh shell so the process loads the updated environment."));

children.push(h3("2. 401 authentication error, failing immediately with no retries"));
children.push(body("Cause: 4xx auth and request errors are classified fatal (ria/retry.py) and fail fast; only 408, 429, 5xx, and transport errors retry.", { after: 80 }));
children.push(step("steps2","Inspect the key value in .env; a pasted key frequently gains a trailing space or wrapping quotes."));
children.push(step("steps2","Confirm the key is active in the Anthropic Console and belongs to the intended workspace."));
children.push(step("steps2","Re-test at minimum cost: python main.py --limit 1 performs one Haiku classification (~$0.002)."));

children.push(h3("3. Notion is not configured, or the precedent tool returns an error result"));
children.push(body("Cause: Notion is optional at load and enforced at point of use; the Evaluator receives the tool error as data and proceeds without precedent context.", { after: 80 }));
children.push(step("steps3","If precedent lookups and the gated tracker write are not needed, take no action; every other stage is unaffected."));
children.push(step("steps3","Otherwise set NOTION_API_KEY and NOTION_DATABASE_ID in .env."));
children.push(step("steps3","Run python mcp_servers/notion_tracker/verify_connection.py; it validates the token, database access, and data source in one pass."));
children.push(step("steps3","If it reports a data-source mismatch, copy the id it prints into NOTION_DATA_SOURCE_ID and re-run it to confirm."));

children.push(h3("4. TimeoutError: batch <id> did not finish within 600s"));
children.push(body("Cause: Message Batches queue latency exceeded the default 600 second poll window. The batch continues server-side and is not lost.", { after: 80 }));
children.push(step("steps4","Record the batch id from the error message."));
children.push(step("steps4","Retrieve results later (available for 29 days): client.messages.batches.results(\"<id>\")."));
children.push(step("steps4","Or re-run the same documents synchronously by dropping --batch."));
children.push(step("steps4","For large recurring sets, pass a larger timeout to classify_batch."));

children.push(h3("5. Cost circuit breaker: stopping after N of M documents"));
children.push(body("Cause: accrued estimated cost reached pipeline.max_spend_usd (config/pipeline_config.json, default $10). The check runs between documents.", { after: 80 }));
children.push(step("steps5","Review per-call costs in logs/ria.log to confirm the spend matches expectation (evaluate dominates; section 4, table 3)."));
children.push(step("steps5","If the spend is intended, raise pipeline.max_spend_usd."));
children.push(step("steps5","Re-run for the remaining documents. There is no resume checkpoint: already-processed documents are reprocessed on a re-run, and their outputs overwrite by document number."));

children.push(h3("6. The evaluate stage runs long, or the terminal appears stalled"));
children.push(body("Cause: the Opus call plus its optional tool loop is the longest single operation (170 to 215 seconds measured); transient API errors add up to two backoff retries on top.", { after: 80 }));
children.push(step("steps6","Up to roughly 6 minutes for one document is within normal variance under load."));
children.push(step("steps6","Check the last line of logs/ria.log to confirm the run is in the evaluate stage, and note its timestamp."));
children.push(step("steps6","If no new log line appears for more than 10 minutes, Ctrl+C is safe: per-document isolation means completed documents are unaffected, and the run can be repeated."));
children.push(step("steps6","Repeated 5xx or 529 (overloaded) entries in the log indicate an API-side incident; wait and re-run."));

children.push(h3("7. Google OAuth errors, or Drive and Gmail stop working after weeks of use"));
children.push(body("Cause: the stored OAuth token expired or was revoked.", { after: 80 }));
children.push(step("steps7","Confirm GOOGLE_CREDENTIALS_PATH in .env points at the OAuth client JSON downloaded from Google Cloud Console."));
children.push(step("steps7","Delete the stale token: config/drive_token.json or config/gmail_token.json, whichever scope is failing."));
children.push(step("steps7","Re-run; a browser consent window re-issues the token for that scope."));
children.push(step("steps7","If Google access is not needed, nothing blocks the run: specialists state the Drive absence explicitly, and the escalation send is skipped with a log line."));

children.push(h3("8. Ingest returns zero documents"));
children.push(body("Cause: the lookback window, the agency filter, or network access to the Federal Register API.", { after: 80 }));
children.push(step("steps8","Increase --limit or the lookback window and re-run."));
children.push(step("steps8","Check federal_register.agencies in config/pipeline_config.json against the intended agencies."));
children.push(step("steps8","Confirm outbound HTTPS to federalregister.gov; the client already retries transient 5xx and 429 responses three times with backoff."));

children.push(h3("9. A downstream consumer of -p (headless) mode reports invalid JSON"));
children.push(body("Cause: the consumer is merging stdout and stderr into one stream.", { after: 80 }));
children.push(step("steps9","stdout carries only JSONL in -p mode; all diagnostics route to stderr."));
children.push(step("steps9","Capture the streams separately: python main.py -p --limit 5 2>errors.log."));
children.push(step("steps9","Validate one captured line with any JSON parser; each line is a single self-contained object."));
children.push(new Paragraph({ children:[ new PageBreak() ] }));


// ---------- 3. logical architecture ----------
children.push(h1("3. Logical architecture"));
children.push(body("Sections 4 through 6 describe one implementation. This section describes the system that implementation instantiates: its capabilities, the contracts between them, the invariants that must hold, and the ports through which every external dependency attaches. Nothing here names a vendor, a product, or a model, by construction. That constraint is the point: it is what makes the design reviewable independently of the stack it runs on, and portable to a different one."));
children.push(body("For an architecture review board, this is the artifact under review. For an organization considering the pattern, this is the specification an implementation can be tested against, including an implementation the organization builds itself."));
children.push(new Paragraph({ spacing:{ after: 80 }, alignment: AlignmentType.CENTER,
  children:[ new ImageRun({ type:"png", data: fs.readFileSync(ASSET("ria_logical.png")),
    transformation:{ width: 620, height: 349 } }) ] }));
children.push(caption("Figure 2. The logical architecture. Inbound ports feed analysis capabilities; exactly one capability can authorize action; effects leave only through gated execution and outbound ports. Navy is judgment, white is deterministic, amber is a control point or human authority, teal outlines are ports."));

children.push(h2("3.1 Capabilities"));
children.push(body("Eleven capabilities, named for what they do rather than what performs them."));
[["Source Monitoring","Detect and retrieve newly published regulatory instruments. Deterministic."],
 ["Triage","Assign priority and route each instrument to the analyses that apply. Judgment."],
 ["Materiality Assessment","Score operational impact and assign a risk level. Judgment."],
 ["Process Mapping","Map obligations to internal processes and the owners accountable for them. Judgment."],
 ["Gap Analysis","Compare obligations against current controls and documentation. Judgment."],
 ["Quality Evaluation","Grade the analyses and produce a confidence and flags. Judgment. Cannot authorize."],
 ["Autonomy Decision","Convert evaluation and risk into an authorization tier. Deterministic. The only authorizer."],
 ["Synthesis","Compose the briefing and remediation plan from evaluated findings. Judgment. Holds no effects."],
 ["Gated Execution","Perform external effects, and only those authorized and approved. Deterministic."],
 ["Audit & Observability","Record every decision with its inputs, outcome, and cost. Cross-cutting."],
 ["Cost Governance","Meter consumption and enforce a ceiling. Cross-cutting."]].forEach(c =>
  children.push(bullet([{text:c[0]+". ",bold:true},{text:c[1]}])));

children.push(h2("3.2 Contracts"));
children.push(body("Every boundary crossing is a typed entity, not prose. This is why an instruction embedded in a source document cannot become a command: it arrives inside a field of a schema-bound record, as data about the document, and the receiving capability has no interface through which such text could act."));
children.push(table([2400,2300,3100,1920],[
["Entity","Produced by","Carries","Consumed by"],
["RegulatoryDocument","Source Monitoring","identity, publication date, full text","Triage, analyses"],
["ClassificationDecision","Triage","priority, routing, confidence","Analyses"],
["SpecialistFinding","The three analyses","findings, risk level, severity, impact score","Quality Evaluation, Synthesis"],
["EvaluationScore","Quality Evaluation","per-analysis quality, overall confidence, flags","Autonomy Decision"],
["AutonomyDecision","Autonomy Decision","tier, execute, escalate, rationale","Gated Execution, Audit"],
["Briefing","Synthesis","summary, risk assessment, remediation actions","Artifacts, Gated Execution"],
["RemediationAction","Synthesis","action, owner, due date, priority","Briefing, work item, Riptide Attest (Control Source Port)"],
["AuditRecord","Audit & Observability","actor, inputs, outcome, timestamp","Audit sink"],
]));
children.push(caption("Table 1. Contracts between capabilities. Entity names are logical; their serialized form and validation live in the implementation (section 4)."));

children.push(h2("3.3 Invariants"));
children.push(body("The properties that must hold in any implementation of this architecture. They are the acceptance criteria a review board can test against, and section 5 shows the line of code that enforces each one in this build."));
[["Judgment cannot self-authorize","No analysis capability emits an authorization. Judgment produces scores, findings, and flags; nothing more."],
 ["Authorization is deterministic","A pure function maps declared inputs to a tier. Same inputs, same tier, every time, reviewable line by line, immune to persuasion."],
 ["Escalation dominates","Escalation conditions are evaluated before any autonomy grant. No confidence value, however high, can outrank them."],
 ["Inputs are separated","No single capability supplies more than one input to the authorization decision, so one compromised judgment cannot both inflate confidence and launder risk."],
 ["Effects require human authority","External effects occur only with an explicit human approval, checked at the point of effect rather than at the call site, so no refactor can forget it."],
 ["Reversibility asymmetry","Reversible artifacts are always produced. Irreversible effects are always gated."]].forEach((c,i) =>
  children.push(bullet([{text:(i+1)+". "+c[0]+". ",bold:true},{text:c[1]}])));
children.push(body("Two operating invariants accompany them: every decision is recorded before it is trusted, and consumption is bounded by a ceiling that halts work rather than exceeding it."));

children.push(h2("3.4 Ports and your instantiation"));
children.push(body("Every external dependency attaches through a port: a named interface with a fixed contract. The reasoning provider is a port like any other, which is the property that makes the architecture portable across model vendors and hosting arrangements. The capabilities, contracts, and invariants above do not change when the right-hand column changes."));
children.push(table([2900,3400,3420],[
["Port","This instantiation","Your instantiation (illustrative)"],
["Regulatory Source","Federal Register public API","Same, plus state or agency feeds"],
["Policy Context","Google Drive folder","SharePoint or Confluence"],
["Reasoning","Hosted model API, three tiers by consequence","Same models inside your cloud tenancy"],
["Precedent","Notion database, read-only","ServiceNow or your CMDB"],
["Work Item","Notion record","ServiceNow or Jira"],
["Notification","Gmail","Outlook or Exchange"],
["Audit Sink","JSONL on disk","Your SIEM"],
]));
children.push(caption("Table 2. Ports and adapters. This is the structural statement behind the claim that integration is an adapter swap rather than a redesign."));
children.push(new Paragraph({ children:[ new PageBreak() ] }));

// ---------- 4. agents ----------
children.push(h1("4. The agents, one by one"));
children.push(body("Six agents. Each has a scoped specification (agents/<name>/CLAUDE.md) and an implementation in ria/. Every agent call uses forced tool use, meaning the API is required to return a tool call matching a strict JSON schema; free-text parsing is never involved. Every agent's output then passes through deterministic post-processing that backstops its known failure modes."));

const agentTable = table([1700,1200,4100,1300,1500],[
  ["Agent","Model","Mission (from its spec)","Cost (USD)","Latency (seconds)"],
  ["Classifier","Haiku 4.5","Route documents to specialists; routing decisions only, no analysis","~$0.002","~4"],
  ["Materiality","Sonnet 5","Score how materially a regulation impacts healthcare operations","~$0.007","10 to 13"],
  ["Process Impact","Sonnet 5","Map requirements to internal processes and workflows needing review","~$0.020","17 to 31"],
  ["Gap Analyzer","Sonnet 5","Identify gaps between current documentation/controls and the regulation","~$0.013 to 0.019","~25"],
  ["Evaluator","Opus 4.8","Score specialist outputs; the trust boundary all execution passes through","$0.33 to 0.50","170 to 215"],
  ["Synthesizer","Sonnet 5","Combine evaluated outputs into the briefing and remediation plan","~$0.012","20 to 24"],
]);
children.push(agentTable);
children.push(caption("Table 3. The roster. Costs and latencies measured from live runs (docs/COST-BREAKDOWN.md). Latency is API-side inference time; host hardware is not a factor (section 2.4)."));

children.push(h2("4.1 Classifier (ria/classifier.py)"));
children.push(body("Reads only the document's title and abstract, wrapped in untrusted-content framing so instructions embedded in a hostile filing are content to note, never commands to follow. Produces priority, per-specialist routing booleans, confidence, and reasoning. Haiku is the right tier because routing is a narrow, bounded decision that runs on every document unconditionally; volume makes the cheapest capable model the correct default."));
children.push(body("Post-processing applies a routing floor: when reported confidence is below _CONFIDENCE_FLOOR (0.60), the document is routed to all three specialists rather than acting on an uncertain routing decision."));
children.push(...codeBlock([
"def _postprocess(decision: dict, doc: RegulatoryDocument) -> dict:",
"    \"\"\"Clamp confidence, apply the low-confidence routing rule, attach document_id.\"\"\"",
"    decision[\"confidence\"] = max(0.0, min(1.0, float(decision.get(\"confidence\", 0.0))))",
"    if decision[\"confidence\"] < _CONFIDENCE_FLOOR:",
"        decision[\"routing\"] = {\"materiality\": True, \"process_impact\": True, \"gap_analyzer\": True}",
"    decision[\"document_id\"] = doc.document_number",
"    return decision",
]));
children.push(caption("ria/classifier.py, verbatim. The --batch flag routes the same request shape through the Message Batches API at roughly half price."));

children.push(h2("4.2 The specialists (ria/specialists.py)"));
children.push(body("Three analysts, all Sonnet 5, all reading the same cached document context, all holding zero live tools. Materiality produces an impact score (integer, 0 to 100) and a risk level; that risk level later feeds the tier decision directly. Process Impact maps the regulation to specific internal workflows and owners; the most open-ended task and, measured, the most expensive specialist call. Gap Analyzer produces gaps with severity, remediation actions, and effort estimates."));
children.push(body("Why zero tools: a per-specialist tool definition would vary the shared prompt prefix and break cache reuse, so the pipeline fetches everything once (Federal Register full text, Drive policy context) and hands it over. Absence is stated honestly: if no Drive documents matched, the prefix says so, and specialists score against that stated absence rather than guessing."));
children.push(body("Gap Analyzer's backstop enforces its spec's hard rule deterministically: PHI and patient-safety gaps can never be reported at low severity, and critical gaps can never lack a remediation action."));
children.push(...codeBlock([
"# ria/specialists.py, gap analyzer post-processing (core)",
"if gap.get(\"severity\") == \"critical\" and not (gap.get(\"remediation_action\") or \"\").strip():",
"    gap[\"remediation_action\"] = \"Remediation action required -- escalate to compliance for review.\"",
"if gap.get(\"severity\") == \"low\" and any(k in description for k in _PHI_KEYWORDS):",
"    gap[\"severity\"] = \"medium\"   # PHI / patient-safety floor; the override is logged",
]));

children.push(h2("4.3 Evaluator (ria/evaluator.py)"));
children.push(body("The highest-cost stage ($0.33 to $0.50 per document; 65-85% of run cost) and the only stage that operates agentically. Opus 4.8 runs on the Claude Agent SDK and decides for itself whether, and how many times, to consult its single tool: a read-only Notion lookup for precedent (similar past documents already in the tracker). It cannot write anything, anywhere. Its prompt frames all specialist-derived content as untrusted evidence; anything inside it that reads like a command is treated as a signal of a manipulated analysis and lowers confidence."));
children.push(body("The Evaluator produces scores, confidence, and flags. It does not produce a tier. Section 5 shows the code that does."));

children.push(h2("4.4 Synthesizer (ria/synthesizer.py)"));
children.push(body("Writes the briefing: plain-language executive summary, risk assessment, and a remediation plan with actions, owners, priorities, and due dates computed from the current date. A deterministic scrub then enforces the plain-language constraint (stripping CFR citations and legalese) with word boundaries that protect domain vocabulary such as the FDA De Novo pathway."));
children.push(body("The model's only output is JSON. Every side effect is performed by pipeline code acting on the Evaluator's decision: DOCX and PPTX are always rendered locally (reversible, zero external reach); the Notion record fires only on execute=True; the escalation email only on escalate=True; and both external writes are additionally gated by the human key, checked again at the exact line that performs the write. A Synthesizer failure or manipulation is therefore bounded to briefing content; no code path from this agent reaches an external system."));
children.push(new Paragraph({ children:[ new PageBreak() ] }));

// ---------- 4. trust gate ----------
children.push(h1("5. The trust gate, in code"));
children.push(body("The governance behavior is implemented in two functions and one environment check, reproduced verbatim below. First, tier computation, from ria/evaluator.py:"));
children.push(...codeBlock([
"def compute_tier(",
"    overall_confidence: float,",
"    risk_level: str | None,",
"    enforcement_detected: bool,",
"    autonomy_config: dict,",
") -> tuple[int, bool, bool]:",
"    \"\"\"Deterministic autonomy-tier decision. Returns (tier, execute, escalate).\"\"\"",
"    tier1 = autonomy_config.get(\"tier1_threshold\", 0.90)",
"    tier2 = autonomy_config.get(\"tier2_threshold\", 0.75)",
"    critical_escalates = autonomy_config.get(\"critical_risk_always_escalates\", True)",
"    enforcement_escalates = autonomy_config.get(\"enforcement_language_always_escalates\", True)",
"",
"    if risk_level is None:",
"        # Materiality didn't run, so there's no risk signal to trust a tier-1/2 call on.",
"        return 3, False, True",
"    risk_level = risk_level.lower()",
"",
"    if overall_confidence < tier2:",
"        return 3, False, True",
"    if critical_escalates and risk_level == \"critical\":",
"        return 3, False, True",
"    if enforcement_escalates and enforcement_detected:",
"        return 3, False, True",
"    if overall_confidence >= tier1 and risk_level in (\"low\", \"medium\"):",
"        return 1, True, False",
"    return 2, False, False",
]));
children.push(body("Three properties of this function. Escalation triggers are checked first, so no confidence score, however high, can outrank critical risk or enforcement language. The risk input is the materiality specialist's own output, not something the Evaluator restates, so a single compromised judgment cannot both inflate confidence and launder risk. And tier 2, human review, is the structural default: it is what happens when nothing else fires."));
children.push(body("Enforcement detection backstops the model's flags with a plain keyword scan, verbatim:"));
children.push(...codeBlock([
"def _detect_enforcement(specialist_results: dict, flags: list[str]) -> bool:",
"    if any(\"enforcement\" in f.lower() for f in flags):",
"        return True",
"    materiality = (specialist_results or {}).get(\"materiality\", {}).get(\"result\", {})",
"    reasoning = (materiality.get(\"reasoning\") or \"\").lower()",
"    return any(kw in reasoning for kw in _ENFORCEMENT_KEYWORDS)",
]));
children.push(body("Second, the human key. Both external writers check it at the point of action; verbatim from mcp_servers/notion_tracker/writer.py (the Gmail sender carries the identical check):"));
children.push(...codeBlock([
"def _require_approval() -> None:",
"    if os.environ.get(\"RIA_EVALUATOR_APPROVED\", \"\").strip().lower() not in (\"1\", \"true\"):",
"        raise PermissionError(",
"            \"RIA_EVALUATOR_APPROVED is not set -- refusing to write to Notion. \"",
"            \"Set RIA_EVALUATOR_APPROVED=1 to explicitly approve this external side effect.\"",
"        )",
]));
children.push(body("The check lives inside the writing function itself rather than at the call site, so no future refactor of the pipeline can forget it. During development, a Claude Code PreToolUse hook enforces the same rule against the tooling layer; the hook is an audit-and-block tripwire; this in-code check is the layer no tooling failure can remove."));

children.push(h2("5.1 Tier decision matrix"));
children.push(body("compute_tier() expressed as a lookup. Rows are the Evaluator's overall_confidence; columns are the materiality specialist's risk_level. enforcement_detected = true overrides every cell to tier 3."));
children.push(table([2450,1450,1450,1450,1500,1500],[
["overall_confidence","risk: low","risk: medium","risk: high","risk: critical","risk missing"],
["below 0.75","3 escalate","3 escalate","3 escalate","3 escalate","3 escalate"],
["0.75 to below 0.90","2 review","2 review","2 review","3 escalate","3 escalate"],
["0.90 and above","1 execute","1 execute","2 review","3 escalate","3 escalate"],
]));
children.push(caption("Table 4. Tier outcomes. Thresholds are operator configuration (tier1_threshold 0.90, tier2_threshold 0.75). Tier 1 sets execute=True; tier 3 sets escalate=True; tier 2 sets neither. Risk missing means the materiality specialist did not run; with no risk signal, nothing auto-executes. The compute_tier() source above is authoritative if this table and the code ever disagree."));

children.push(h2("5.2 Where each input comes from"));
children.push(table([2500,2700,4600],[
["Input","Produced by","Mechanism"],
["overall_confidence","Evaluator (Opus 4.8)","Model-supplied score, 0 to 1, in the forced tool schema"],
["risk_level","Materiality specialist (Sonnet 5)","Model-supplied enum in its own result; the Evaluator never restates it"],
["enforcement_detected","Code: _detect_enforcement()","Keyword scan of the materiality reasoning, OR an enforcement flag raised by the Evaluator"],
["tier thresholds","Operator","config/pipeline_config.json; changes are versioned configuration, not model behavior"],
]));
children.push(caption("Table 5. Input provenance. No single component controls more than one input, so one compromised judgment cannot both inflate confidence and launder risk."));

children.push(h2("5.3 Scales and score fields"));
children.push(table([3400,3400,3000],[
["Field","Range / values","Set by"],
["priority (classifier)","critical | high | medium | low","Classifier model"],
["confidence (classifier)","0 to 1; below 0.60 triggers route-to-all","Classifier model + code floor"],
["impact_score (materiality)","integer, 0 to 100","Materiality model"],
["risk_level (materiality)","critical | high | medium | low; feeds compute_tier","Materiality model"],
["severity (per gap)","critical | high | medium | low; PHI or patient-safety gaps floored to medium","Gap analyzer model + code floor"],
["*_quality (three fields)","0 to 1 per specialist (materiality_quality, process_impact_quality, gap_analysis_quality)","Evaluator model"],
["overall_confidence (evaluator)","0 to 1; feeds compute_tier","Evaluator model"],
["flags / human_review_notes","free-text list; nullable note. Enforcement wording in a flag triggers the tier 3 override","Evaluator model"],
]));
children.push(caption("Table 6. Every enum and range a reviewer will meet in outputs and logs, with the component that sets it."));
children.push(new Paragraph({ children:[ new PageBreak() ] }));

// ---------- 5. shared infrastructure ----------
children.push(h1("6. Shared infrastructure"));
children.push(h2("6.1 The cached document context (ria/caching.py)"));
children.push(body("Every specialist reads one shared prefix: a header, the tag-stripped full regulation text inside untrusted-content framing, and the Drive policy context (or an honest statement that none was found), with the cache breakpoint on the last block so everything caches together. The first specialist call writes the cache at a 1.25x premium; the next two read it at a tenth of input price. The specialists run sequentially because parallel calls would race the cache write and each pay full input price; sequential execution guarantees one write and two discounted reads. Cache reuse is measured, not assumed; cache_read token counts appear in every log line."));
children.push(h2("6.2 Retry policy (ria/retry.py)"));
children.push(body("Three attempts with exponential backoff, but only for failures worth retrying. HTTP 4xx auth and request errors fail fast (except 408 and 429, which are transient by definition); 5xx, overloads, and transport errors retry. Before this split existed, a bad API key burned three backoffs before failing; the classification is unit-tested against real SDK exception types."));
children.push(h2("6.3 Cost controls (ria/cost.py)"));
children.push(body("Every call's cost is estimated cache-aware (writes at 1.25x, reads at 0.1x) and accrued against pipeline.max_spend_usd; the run halts between documents at the ceiling. Pricing lives in one module shared by the runtime breaker and the eval suite's cost reporting, so there is exactly one place to update when prices change."));
children.push(h2("6.4 Logging"));
children.push(body("logs/ria.log carries one structured JSONL line per decision: agent, action, outcome, confidence, token and cache metrics. logs/audit.jsonl carries tool-level events from the development hooks. In headless -p mode, stdout is pure JSONL for pipes and all diagnostics route to stderr. Both files are plain JSONL by design, so they can be shipped to a SIEM without format conversion."));

// ---------- 6. decisions ----------
children.push(h1("7. Why the decisions were made"));
children.push(body("Condensed from docs/DESIGN-DECISIONS.md and the chronological build log in scratchpad/. Each entry is the question a reviewer actually asks, answered the way the repo answers it."));
const qa = [
["Why four models instead of one?","Because the stages have different consequence profiles. Routing is bounded and high-volume: Haiku. Analysis needs genuine reasoning at moderate stakes: Sonnet. The one decision that gates action gets the strongest judgment available: Opus, at 65-85% of run cost, on purpose. Model routing is operator policy in root CLAUDE.md; changing it requires explicit approval, not a convenient default."],
["Why do specialists run sequentially instead of in parallel?","Parallel calls would race the cache write: each request would miss, pay full input price, and attempt its own write premium. Sequencing guarantees one write and two cheap reads. The latency cost is roughly a minute against a run whose long pole is the Evaluator anyway; if latency ever dominates, the correct parallelism is across documents, not within one."],
["Why do the specialists hold no tools?","Cache stability. A per-specialist tool definition would vary the shared prefix and break reuse, so the pipeline fetches once and hands everything over, stating absence explicitly when a source had nothing. A side benefit: an analyst that cannot fetch cannot be steered into fetching something hostile."],
["Why is the tier computed by code instead of asked of the model?","Because a tier is an authorization, not an opinion. Model judgment is valuable but fallible; encoding the authorization rules as a pure function makes them reviewable, testable, and immune to persuasion. The injection evals exist to prove the distinction holds under attack."],
["Why is there a second gate (the human key) if the tier function already decides?","Defense in depth against the failure mode where judgment and rules are both wrong. The tier function decides what should happen; a person decides whether anything external actually does. The key is an environment variable set per run, deliberately not stored anywhere, and checked inside the writing functions themselves."],
["Why no orchestration framework?","The control flow is five stages with per-document isolation; plain Python expresses it in one readable file. A framework would add a dependency surface and an abstraction layer precisely where reviewability is the product. The complexity budget went to governance instead."],
["Why do the development hooks fail open?","A crashing guard would brick every tool call, which teaches operators to disable guards. The hooks are therefore a tripwire (block known-bad patterns, audit everything); the wall is the in-code approval check that no tooling failure can remove."],
["What happens after the plan ships?","Previously, the honest answer was human follow-up, unverified. Now the plan's machine-checkable subset compiles into hash-approved specifications for Riptide Attest, the deterministic companion system, and is re-verified continuously at zero marginal model cost. RIA's human-authority model is unchanged: Attest adds a second named-human gate of its own (the approval pin) and removes none of RIA's."],
["What is the honest residual risk?","Prompt framing is instruction, not proof: the injection evals show current models with these prompts resist the fixtures written so far, which is evidence, not a guarantee. The enforcement and PHI backstops are keyword heuristics a novel phrasing could pass. Both are watched by evals rather than assumed away, and both are survivable because the tier and the gates are code."],
];
qa.forEach(([q,a])=>{ children.push(h3(q)); children.push(body(a)); });
children.push(new Paragraph({ children:[ new PageBreak() ] }));

// ---------- 7. data flows ----------
children.push(h1("8. Data flows and security summary"));
children.push(bullet([{text:"Inputs: ", bold:true},{text:"public Federal Register documents, plus excerpts of internal policy documents from a Drive folder the operator scopes. No PHI is in scope by design: policy documents describe how an organization handles patient data; they do not contain it."}]));
children.push(bullet([{text:"What leaves the environment: ", bold:true},{text:"document text, policy excerpts, and derived analysis go to the model API. Enterprise deployments choose the access path: Anthropic's BAA-covered HIPAA-ready API, or Claude via AWS Bedrock or Google Vertex AI inside the client's cloud tenancy."}]));
children.push(bullet([{text:"Outputs: ", bold:true},{text:"local DOCX/PPTX always; a tracker record and escalation email only when the gate decided and a human approved. Logs are local JSONL, SIEM-ready. The remediation plan additionally flows to the companion verifier, Riptide Attest, as a local JSON artifact - no new external surface, and no new data leaving the environment."}]));
children.push(body("docs/ENTERPRISE-FAQ.md is the companion written for vendor-risk review; docs/DATA-HANDLING.md covers current flows and what an enterprise deployment changes."));

// ---------- 8. appendix ----------
children.push(h1("9. Appendix: dependencies and repository map"));
children.push(h2("9.1 Pinned dependencies"));
children.push(table([2600,1400,5800],[
["Package","Version","Role"],
["anthropic","0.116.0","Messages API, prompt caching, Message Batches"],
["claude-agent-sdk","0.2.116","The Evaluator's agentic loop and its single tool"],
["mcp","1.28.1","MCP server framework (four integration servers)"],
["httpx","0.28.1","Federal Register client with retry and markup stripping"],
["notion-client","3.1.0","Precedent lookups and the gated tracker write"],
["google-auth / api clients","2.55 / 2.198","Drive policy context; gated Gmail escalation"],
["pydantic","2.13.4","RegulatoryDocument model and validation"],
["python-docx / python-pptx","1.2.0 / 1.0.2","Briefing rendering from templates"],
["python-dotenv","1.2.2","Settings loading (.env)"],
["pytest / ruff (dev)","9.1.1 / 0.15.21","117 offline tests; lint, both gating CI"],
]));
children.push(caption("Table 7. requirements.txt, annotated. All versions are pinned for reproducible builds."));
children.push(h2("9.2 Repository map"));
children.push(...codeBlock([
"main.py                 orchestration + circuit breaker + per-document isolation",
"run_demo.py / .bat      one-command demo (cross-platform / Windows)",
"ria/                    the six agents: classifier, specialists, evaluator,",
"                        synthesizer + caching, retry, cost, settings, logging",
"mcp_servers/            federal_register · notion_tracker · gmail · google_drive",
"agents/*/CLAUDE.md      per-agent scoped specifications",
".claude/hooks/          secrets guard · side-effect guard · audit log",
"evaluations/            live evals + injection suite + pass-rate harness + results",
"tests/unit/             117 offline tests (free, every push)",
"docs/                   ARCHITECTURE · AGENTS · DESIGN-DECISIONS · RUNBOOK ·",
"                        ENTERPRISE-FAQ · COST-BREAKDOWN · DATA-HANDLING · more",
"scratchpad/             complete chronological build log",
]));
children.push(body("Suggested reading order for a technical reviewer: the README's top half for the thesis, ria/evaluator.py for the gate, the agent specs, evaluations/ for the proof, and docs/DESIGN-DECISIONS.md for the reasoning. Companion repository: github.com/riptide-consulting/riptide-attest - the verification half; its documentation mirrors this one.", { after: 60 }));

// ---------- document ----------
const doc = new Document({
  numbering:{ config:[
    { reference:"bullets",
      levels:[{ level:0, format:LevelFormat.BULLET, text:"\u2022", alignment:AlignmentType.LEFT,
        style:{ paragraph:{ indent:{ left:360, hanging:200 } } } }] },
    ...Array.from({length:9},(_,i)=>({ reference:`steps${i+1}`,
      levels:[{ level:0, format:LevelFormat.DECIMAL, text:"%1.", alignment:AlignmentType.LEFT,
        style:{ paragraph:{ indent:{ left:460, hanging:260 } } } }] })),
  ] },
  styles:{ default:{ document:{ run:{ font:B_F, size:21, color:INK } } } },
  sections:[{
    properties:{ page:{ size:{ width:12240, height:15840 },
      margin:{ top:1080, bottom:1080, left:1260, right:1260 } } },
    footers:{ default: new Footer({ children:[ new Paragraph({ alignment:AlignmentType.CENTER,
      children:[
        new TextRun({ text:"Riptide RIA Technical Documentation  ·  Riptide Consulting  ·  page ", font:B_F, size:16, color:MUTE }),
        new TextRun({ children:[PageNumber.CURRENT], font:B_F, size:16, color:MUTE }),
      ] }) ] }) },
    children,
  }],
});

Packer.toBuffer(doc).then(buf => {
  fs.writeFileSync(_np.join(OUT, "Riptide-RIA-Technical-Documentation.docx"), buf);
  console.log("docx written");
});
