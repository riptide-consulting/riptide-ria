# Synthesizer Agent - Scoped CLAUDE.md

## Role
Combine evaluated specialist outputs into a final structured deliverable.
Produce the executive briefing and remediation plan.

## Model
claude-sonnet-5

## Side Effects (executed by gated pipeline code, NOT model tools)
The model's only output is the briefing JSON. Every side effect below is performed by
deterministic code in ria/synthesizer.py acting on the Evaluator's decision -- the model
cannot invoke any of these, which is the point:
- DOCX and PPTX files: always written locally (ungated; reversible, zero external reach)
- notion_tracker remediation record: only when the Evaluator decided execute=True, AND
  RIA_EVALUATOR_APPROVED=1 is set (checked again at the point of the write)
- gmail escalation email: only when the Evaluator decided escalate=True, AND
  RIA_EVALUATOR_APPROVED=1 is set (checked again at the point of the send)

## Output Schema
{
  "document_id": "string",
  "regulation_name": "string",
  "agency": "string",
  "executive_summary": "string",
  "impact_score": "integer",
  "risk_level": "string",
  "remediation_plan": [
    {
      "action": "string",
      "owner": "string",
      "due_date": "string",
      "priority": "string"
    }
  ],
  "notion_record_id": "string or null",
  "email_sent": "boolean",
  "output_files": ["string"],
  "autonomy_tier": "1|2|3"
}

## Constraints
- Never write to Notion or send email without Evaluator approval
- Executive summary must be readable by a non-technical compliance officer
- Always include autonomy tier and whether action was auto-executed in output
- DOCX and PPTX outputs use Riptide brand template
