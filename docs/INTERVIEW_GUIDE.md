# FormFlow — Interview Guide

> This document explains the implemented system in plain language. Every section references implemented code.

## 1. Overall Architecture

FormFlow uses a two-service architecture:

- **Frontend (Vercel):** Next.js 15 with App Router serves the UI and acts as a Backend-for-Frontend (BFF) proxy. The browser never contacts the backend directly.
- **Backend (Railway):** FastAPI serves the REST API and manages SQLite via SQLAlchemy ORM.

The BFF proxy pattern keeps the backend URL and proxy secret server-side only. All browser API calls go to same-origin `/api/proxy/*` routes, which forward to FastAPI with an `X-Proxy-Secret` header.

**Code:** `frontend/src/app/api/proxy/[...path]/route.ts`, `backend/app/middleware.py`

## 2. Request Flow

```
Browser → Next.js /api/proxy/forms → [adds X-Proxy-Secret, forwards cookie]
  → FastAPI /api/v1/forms → [verifies proxy secret, extracts session]
  → Service layer → Repository → SQLite → Response back through chain
```

Public respondent requests follow the same path but skip session authentication.

**Code:** `frontend/src/lib/api-client.ts`, `backend/app/dependencies.py`

## 3. Builder State Flow

The builder separates server state (TanStack Query) from UI state (React state):

- **Server state:** Form data, questions list — cached and synchronized via TanStack Query
- **UI state:** Selected question, autosave status, drag state, panel visibility

Mutations go through TanStack Query's `useMutation`, which handles optimistic updates, error rollback, and cache invalidation.

**Code:** `frontend/src/hooks/useForm.ts`, `frontend/src/hooks/useQuestions.ts`

## 4. Autosave Race Prevention

The autosave system prevents stale writes using a version counter:

1. Each edit increments a local version counter
2. When debounce expires, the save request carries the current version
3. If a newer edit occurs during the in-flight save, the response is discarded
4. A new save fires with the latest data

This ensures the server always has the latest content without complex conflict resolution.

**Code:** `frontend/src/hooks/useAutosave.ts`

## 5. Drag-and-Drop Design

Uses dnd-kit with @dnd-kit/sortable for question reordering:

- **Pointer:** Drag handle → visual clone → drop indicators → position update
- **Keyboard:** Alt+↑/↓ for quick reorder, or Enter → Arrow → Enter for full drag flow
- Reorder is transactional: all positions updated in one API call
- ARIA live region announces position changes

**Code:** `frontend/src/components/builder/QuestionNavigator.tsx`

## 6. Form Versioning

Forms use a snapshot-based versioning model:

- The `questions` table always holds the current draft
- Publishing snapshots all questions into `form_versions.questions_snapshot` (JSON)
- Each publish creates a new version with incremented `version_number`
- Respondent submissions reference the exact `form_version_id` they answered
- Draft edits never affect the published version
- "Publish edits" creates a new snapshot, replacing the live version

**Code:** `backend/app/services/form_service.py`, `backend/app/models/form.py`

## 7. Database Relationships

```
creators 1──* forms 1──* questions 1──* question_options
                    1──* form_versions
                    1──* submissions 1──* answers 1──* answer_option_selections
```

Key relationships:
- Forms scoped to creators (workspace isolation)
- Questions belong to forms with ordered positions
- Submissions reference both form and specific version
- Answers reference stable question IDs from the version snapshot

**Code:** `backend/app/models/`, `docs/DATABASE.md`

## 8. Server Validation

Validation happens at three layers:

1. **Pydantic schemas:** Type validation, string length limits, enum validation
2. **Service layer:** Business rules (can't publish empty form, required answers present)
3. **Database constraints:** CHECK constraints, UNIQUE constraints, foreign keys

For submissions, the server loads the published version's question snapshot and validates:
- All required questions have answers
- No unknown question IDs
- Answer types match question types
- Email format is valid, numbers are in range
- Choice IDs exist in the version

**Code:** `backend/app/schemas/`, `backend/app/services/submission_service.py`

## 9. Session Isolation

Every creator query includes a workspace scope:
```python
query.filter(Form.creator_id == current_session.creator_id)
```

The creator ID comes from the authenticated session (token hash lookup), never from client input. Cross-workspace access returns 404 (not 403) to prevent enumeration.

**Code:** `backend/app/dependencies.py`, `backend/app/repositories/`

## 10. Public Submission Idempotency

The client generates a UUID idempotency key (stored in sessionStorage):

1. First request with key → creates submission → returns 201
2. Subsequent requests with same key → returns 200 with original submission ID
3. Enforced by UNIQUE constraint on `(form_id, idempotency_key)`

This prevents duplicate submissions from double-clicks, retries, or network issues.

**Code:** `backend/app/services/submission_service.py`, `frontend/src/hooks/useSubmission.ts`

## 11. Results Aggregation

Summary statistics are computed server-side:

- **Choice/Dropdown/Yes-No:** COUNT and percentage per option across all submissions
- **Number/Rating:** AVG, MIN, MAX
- **Text/Email:** Recent values (last 10)

Aggregation uses the stable `question_id` across all versions, with the latest version's titles for display.

**Code:** `backend/app/services/results_service.py`

## 12. SQLite Deployment Constraints

- Database on Railway persistent volume (`/data/formflow.db`)
- WAL mode for concurrent reads during writes
- Foreign keys enabled (`PRAGMA foreign_keys = ON`)
- Busy timeout of 5000ms for lock contention
- Single Uvicorn worker (single writer constraint)
- No horizontal scaling of write operations

**Code:** `backend/app/database.py`, `docs/DEPLOYMENT.md`

## 13. Security Boundaries

Key security measures:
- **BFF proxy:** Backend URL never in browser, proxy secret server-only
- **Session tokens:** SHA-256 hashed in DB, HttpOnly/Secure cookies
- **CSRF:** Origin validation + custom X-Requested-With header
- **Input validation:** Server-side limits on all string fields
- **No user-controlled redirects or paths** in the proxy
- **Rate limiting:** Per-IP for public, per-session for creator
- **No dangerouslySetInnerHTML** for user content
- **Parameterized queries** via SQLAlchemy ORM

**Code:** `backend/app/middleware.py`, `docs/SECURITY.md`

## 14. Testing Strategy

Three layers:
- **Backend (Pytest):** API integration tests against test SQLite database, covering CRUD, validation, security, aggregation
- **Frontend (Vitest + RTL):** Component tests for all interactive elements, state management, error handling
- **E2E (Playwright):** Full user journeys including workspace isolation, form completion, and accessibility scans

**Code:** `backend/tests/`, `frontend/src/__tests__/`, `frontend/src/e2e/`

## 15. Major Trade-offs

| Decision | Trade-off |
|---|---|
| SQLite over PostgreSQL | Simpler deployment but single-writer limit |
| JSON version snapshots | Simpler than row-level versioning but denormalized |
| Demo sessions | Quick UX but no persistent accounts |
| BFF proxy | Security benefit at ~10ms latency cost |
| dnd-kit over native DnD | Library dependency for accessibility benefit |
| In-memory rate limiting | Simple but resets on restart |

## 16. What Would Change at Scale

- **Database:** PostgreSQL with connection pooling
- **Workers:** Multiple Uvicorn workers behind load balancer
- **Auth:** OAuth/email-password with proper account management
- **Rate limiting:** Redis-backed distributed rate limiter
- **File storage:** S3 for any uploaded assets
- **Caching:** Redis for session lookup, query caching
- **Search:** Full-text search index (Elasticsearch or pg_trgm)
- **Monitoring:** APM, error tracking, structured log aggregation
- **Background jobs:** Celery/Dramatiq for async operations (email, export)

## 17. Features Intentionally Excluded

| Feature | Reason |
|---|---|
| Conditional logic | Scope reduction — complex branching not required for core evaluation |
| CSV export | Nice-to-have — listed as bonus only |
| Custom themes | Marked "Coming soon" in inspector — UI placeholder acceptable |
| File upload question | Not in required types |
| Dark mode | Bonus feature |
| Partial response tracking | Adds complexity without core value |
| Real-time collaboration | Out of scope for single-user demo |
| Analytics/telemetry | Privacy-conscious decision |
