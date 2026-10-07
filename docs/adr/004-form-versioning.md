# ADR-004: Draft/Published Form Versioning

**Status:** Accepted  
**Date:** 2026-10-07

## Context
Forms go through a lifecycle: draft → published → edited → republished/unpublished. We need to:
- Allow editing without affecting the live published form
- Bind responses to the exact version that was answered
- Preserve historical responses after edits or unpublishing
- Support "Publish edits" to update the live form

## Decision
Use a **snapshot-based versioning model**:

1. The `questions` table always represents the **current draft**
2. Publishing **snapshots** all questions into a `form_versions.questions_snapshot` JSON column
3. Each publish creates a new `form_version` with an incremented version number
4. `submissions` reference the `form_version_id` they were answered against
5. Answer `question_id` and `option_id` values reference IDs from the snapshot

## Consequences
### Positive
- Draft edits never affect the live form
- Historical responses always have their original context
- "Publish edits" is a simple new snapshot
- Unpublishing preserves all historical data
- Re-publishing restores the same slug

### Negative
- Question data is duplicated (draft in `questions` + snapshots in `form_versions`)
- Snapshot JSON is denormalized — not individually queryable
- Aggregation must handle questions across multiple versions

### Trade-offs
- Snapshot simplicity over a full change-tracking system
- JSON snapshot over duplicating all question rows into a version table — simpler for this scope
- Version-aware aggregation is more complex but ensures correctness

### Aggregation Strategy
- Summary statistics aggregate across all versions' responses
- Use `question_id` (stable across versions) as the grouping key
- Display the latest version's question titles in summaries
