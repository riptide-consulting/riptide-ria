# Process Impact Mapper - Scoped CLAUDE.md

## Role
Map regulatory requirements to specific internal processes and workflows
that require modification or review.

## Model
claude-sonnet-5

## Context Provided (no live tools)
This agent runs with NO tools of its own -- a deliberate cache-stability decision (a
per-specialist tool definition would vary the shared prefix and break cache reuse; see
docs/DESIGN-DECISIONS.md). The pipeline does the fetching and hands everything over in one
shared cached prefix (ria/caching.py):
- Regulatory sections: fetched once from the Federal Register MCP client
- Internal process documentation: searched once in Google Drive and folded in (or an honest
  "no documents found" statement)

## Output Schema
{
  "document_id": "string",
  "affected_processes": [
    {
      "process_name": "string",
      "current_state": "string",
      "required_change": "string",
      "effort_estimate": "low|medium|high",
      "owner_suggested": "string"
    }
  ],
  "reasoning": "string",
  "confidence": "float 0-1",
  "tokens_used": "integer",
  "cache_hit": "boolean"
}

## Constraints
- Never suggest process changes without citing specific regulatory text
- Always suggest a process owner based on the nature of the change
- Maximum 10 affected processes per document
