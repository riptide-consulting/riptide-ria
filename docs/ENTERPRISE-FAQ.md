# Riptide RIA: Enterprise Reviewer FAQ

Written for the people who evaluate vendors and internal tools for a living: security,
compliance, vendor risk, and enterprise architecture. Plain answers, with pointers to the
code and docs that back each one. `docs/DATA-HANDLING.md` is the companion document on
data flows; this one is organized by the questions reviewers ask.

**Q: Does PHI touch this system?**

No, by design. The pipeline's inputs are (1) public Federal Register documents and (2)
excerpts of your internal policy and process documentation, pulled from a Drive folder you
control the scope of. Policy documents describe how an organization handles patient data;
they do not contain it. There is no patient record, claim, or member data anywhere in the
pipeline, which is exactly why regulatory-change monitoring is a strong first agentic use
case for a healthcare organization: high analyst-hours value, near-zero PHI exposure.

If a future variant ever did put PHI in scope (say, checking a regulation against actual
case handling), compliant paths exist and are a configuration decision, not a rebuild:
Anthropic offers a Business Associate Agreement covering its HIPAA-ready first-party API
(the Messages API this pipeline uses is an Eligible Service, with feature-level eligibility
rules), and Claude is also available through AWS Bedrock and Google Vertex AI, where the
cloud provider is the data processor under your existing cloud BAA. Verify current coverage
against Anthropic's Privacy Center and your counsel before any such change; features
outside the eligibility list (for example, web search, which this pipeline does not use)
are not covered.

**Q: What data leaves our environment, and where does it go?**

Per document: the regulation's title, abstract, and tag-stripped full text (all public),
plus any matched internal policy excerpts, are sent to the Anthropic API for analysis; the
model's structured analysis comes back. Outputs land as local DOCX/PPTX files, an optional
record in the configured tracker, and an optional escalation email. Logs are local
(`logs/ria.log`, `logs/audit.jsonl`) and contain decisions and metadata, not document
bodies. Anthropic offers distinct data-handling arrangements for the API (standard
retention, zero-data-retention agreements, and HIPAA-ready organizations); which one
applies is a contract-level choice made with your account team.

**Q: Can it act without a human?**

Not externally, and that is enforced twice, independently. First, the trust gate: a model
(Opus) scores analysis quality and confidence, and a deterministic function computes the
autonomy tier from those scores, with escalation triggers checked first so nothing
out-ranks them. Tier 1 (auto-execute) exists in the framework, but second: every external
write additionally requires an explicit operator approval (`RIA_EVALUATOR_APPROVED=1`)
checked in code at the exact point of the Notion write and the email send. No approval, no
side effect, regardless of what any model concluded. The standard demo never sets the
flag, so what you watch is the gate refusing.

**Q: What is the audit trail?**

Every stage writes one structured line per decision to `logs/ria.log`: document number,
agent, action, outcome, confidence, token/cache metrics. During development, Claude Code
hooks additionally write every tool invocation to `logs/audit.jsonl` and block side
effects and secret exposure pre-execution. In an enterprise deployment these logs are
plain JSONL and ship to your SIEM like any other application log; six-year retention and
access controls are your infrastructure's job, and the format was chosen so that is easy.

**Q: How do you know it keeps working? What is the model-risk story?**

Three layers. Deterministic controls are code and are unit-tested (117 offline tests: tier
computation, post-processing backstops, gates, hooks). Model behavior is measured by a
live eval suite that asserts on behavior, not just valid JSON: pass rates over repeated
runs, adversarial prompt-injection fixtures asserted at three stages, and a dated results
file committed after each green run so there is evidence, not just claims. And change
control: CI runs the eval suite on any pull request touching prompt-affecting files, so a
prompt edit that regresses behavior fails the gate before merge. Known residual risks are
written down rather than implied away (`README.md`, `docs/DESIGN-DECISIONS.md`).

**Q: What happens when it's wrong?**

The default tier is human review; auto-execution requires both high confidence and
low-to-medium risk, and enforcement language forces escalation no matter what. A
manipulated or simply bad analysis produces a wrong recommendation in front of a human,
not an autonomous action (`docs/DESIGN-DECISIONS.md` walks the worst case explicitly).
Every briefing carries a disclaimer that it is analysis support requiring counsel
verification before any compliance action. The system is built to reduce the hours between
publication and an informed human decision, not to remove the human.

**Q: Our stack is ServiceNow (or Jira), Outlook, and SharePoint, not Notion, Gmail, and
Drive. How much rework is that?**

An adapter each, not a redesign. Every integration sits behind the MCP-server boundary in
`mcp_servers/` as a thin client with a small, stable interface: the tracker exposes
search-precedent and create-record, mail exposes send-escalation, documents expose
search-and-excerpt. The pipeline, the trust gate, and both approval checks never learn
which vendor is behind the interface. Swapping the demo integrations for your systems is
the expected first step of an enterprise engagement.

**Q: Can this run in our cloud tenancy?**

The pipeline calls the Anthropic first-party API today. The same Claude models are
available through AWS Bedrock and Google Vertex AI, where your cloud provider is the data
processor and your existing cloud agreements govern; pointing the model-access layer at
those endpoints is a bounded change (auth and client configuration), and the governance
design is unaffected because none of it lives in the model layer. The rest of the system
is plain Python with no external runtime dependencies beyond the integrations you choose.

**Q: What does it cost to run?**

About $0.59 per document end to end, measured across live runs, with roughly 65-85% of
that concentrated in the one deliberately expensive stage (the Opus trust gate), and a
hard spend circuit breaker in configuration. `docs/COST-BREAKDOWN.md` has the
stage-by-stage table. The comparison that matters is your team's current hours per
regulatory change from publication to an owned remediation plan; that number is yours to
supply, and the pilot is designed to measure against it.
