# FormFlow — Evaluation Matrix

> Updated: Design Phase (Pre-Implementation)

## Status Legend
- 🔲 Not started
- 🚧 In progress
- ✅ Complete
- ⚠️ At risk

---

## 1. Functionality

| Requirement | Planned Implementation | Files/Modules | Tests | Doc Evidence | Demo Steps | Status | Risks |
|---|---|---|---|---|---|---|---|
| Form creation | POST /api/v1/forms → DB insert | `routes/forms.py`, `services/form_service.py`, `workspace/CreateFormButton.tsx` | `test_forms.py::test_create`, workspace E2E | API.md §4 | Click "Create form" → new form in list | 🔲 | — |
| Form rename | PATCH /api/v1/forms/:id | `routes/forms.py`, `workspace/FormActions.tsx` | `test_forms.py::test_rename` | API.md §4 | Three-dot → Rename → enter title | 🔲 | — |
| Form duplication | POST /api/v1/forms/:id/duplicate | `services/form_service.py` | `test_forms.py::test_duplicate_no_responses` | API.md §4 | Three-dot → Duplicate → copy appears | 🔲 | — |
| Form deletion | DELETE /api/v1/forms/:id | `routes/forms.py` | `test_forms.py::test_delete` | API.md §4 | Three-dot → Delete → confirm → removed | 🔲 | — |
| Draft/Published status | `forms.status`, `form_versions` | `models/form.py`, `services/form_service.py` | `test_forms.py::test_publish` | DATABASE.md §3 | Publish → badge changes | 🔲 | — |
| Response count | COUNT(submissions) per form | `repositories/form_repo.py` | `test_forms.py::test_list_with_counts` | API.md §4 | Visible in workspace table | 🔲 | — |
| All 8 question types | Question type registry + editors/renderers | `questions/registry.ts`, `editors/*`, `renderers/*` | Per-type tests | PRODUCT_SPEC.md §4 | Add each type in builder | 🔲 | — |
| Question editing | PATCH /api/v1/forms/:formId/questions/:id | `routes/questions.py`, `builder/Inspector.tsx` | `test_questions.py` | API.md §5 | Edit in canvas/inspector | 🔲 | — |
| Drag-and-drop reorder | PUT .../questions/reorder, dnd-kit | `builder/QuestionNavigator.tsx` | Keyboard reorder tests | INTERACTIONS.md §2 | Drag question in navigator | 🔲 | — |
| Keyboard reorder | Alt+↑/↓ | `builder/QuestionNavigator.tsx` | `test_keyboard_reorder` | INTERACTIONS.md §2 | Alt+↑ moves question up | 🔲 | — |
| Persistence after reload | TanStack Query + API | All data-fetching hooks | E2E reload test | ARCHITECTURE.md §6 | Reload → data preserved | 🔲 | — |
| Preview | Preview mode in builder | `builder/Canvas.tsx`, `app/forms/[id]/preview` | Preview E2E | PRODUCT_SPEC.md §3.4 | Click Preview → see flow | 🔲 | — |
| Publish | POST /api/v1/forms/:id/publish | `routes/forms.py`, `builder/BuilderHeader.tsx` | `test_forms.py::test_publish` | API.md §4 | Click Publish → live | 🔲 | — |
| Public form completion | GET/POST /api/v1/public/forms/:slug | `routes/public.py`, `respondent/RespondentFlow.tsx` | E2E respondent test | API.md §6 | Open /f/slug → complete | 🔲 | — |
| Keyboard navigation | Focus management, Enter/arrows | `respondent/*`, `hooks/useKeyboard.ts` | Keyboard E2E | INTERACTIONS.md §3 | Tab/Enter/arrows through form | 🔲 | — |
| Progress indicator | Progress bar component | `respondent/ProgressBar.tsx` | Component test | INTERACTIONS.md §3 | Visible progress during completion | 🔲 | — |
| Validation | Client + server validation | `lib/validation.ts`, `services/submission_service.py` | Validation tests | INTERACTIONS.md §3 | Required/email/number errors | 🔲 | — |
| Response persistence | Transactional submission | `services/submission_service.py` | `test_submissions.py` | DATABASE.md §7 | Submit → data in DB | 🔲 | — |
| Thank-you screen | ThankYouScreen component | `respondent/ThankYouScreen.tsx` | Component test | PRODUCT_SPEC.md §3.5 | Complete form → thank you | 🔲 | — |
| Responses table | Paginated results | `results/ResponsesTable.tsx`, `routes/results.py` | `test_results.py` | API.md §7 | Results → Responses tab | 🔲 | — |
| Individual response | Full response detail | `results/ResponseDetail.tsx` | Component + API test | API.md §7 | Click response → full Q&A | 🔲 | — |
| Summary statistics | Aggregation queries | `services/results_service.py`, `results/ResultsSummary.tsx` | `test_results.py::test_summary` | API.md §7 | Results → summary cards | 🔲 | — |
| Unpublish | POST /api/v1/forms/:id/unpublish | `routes/forms.py` | `test_forms.py::test_unpublish` | API.md §4 | Unpublish → public link 404 | 🔲 | — |

## 2. UI/UX

| Requirement | Planned Implementation | Files/Modules | Verification | Status | Risks |
|---|---|---|---|---|---|
| Typeform-style workspace | Forms table with status, counts, actions | `workspace/*`, `globals.css` | Visual review | 🔲 | — |
| Three-pane builder | BuilderLayout with navigator/canvas/inspector | `builder/BuilderLayout.tsx` | Visual review, responsive test | 🔲 | — |
| WYSIWYG canvas | Question preview matching respondent view | `builder/Canvas.tsx` | Visual comparison | 🔲 | — |
| Contextual settings | Inspector panel per question type | `builder/Inspector.tsx` | Per-type visual test | 🔲 | — |
| Clean modals | Radix Dialog with FormFlow styling | `ui/Dialog.tsx` | Visual review | 🔲 | — |
| Toast notifications | Toast system with types | `ui/Toast.tsx` | Interaction test | 🔲 | — |
| One-question-at-a-time | RespondentFlow with transitions | `respondent/RespondentFlow.tsx` | E2E visual test | 🔲 | — |
| Smooth transitions | Framer Motion directional animations | `respondent/QuestionCard.tsx` | Reduced motion test | 🔲 | — |
| Keyboard-first | Focus management throughout | All interactive components | Keyboard-only E2E | 🔲 | — |
| Mobile respondent UX | Responsive respondent layout | `respondent/*` | Mobile viewport E2E | 🔲 | — |
| Loading/empty/success/failure states | Per-component state handling | All data components | State-specific tests | 🔲 | — |
| FormFlow branding | Logo, colors, typography | `globals.css`, layout components | Visual review | 🔲 | — |

## 3. Database Design

| Requirement | Implementation | Evidence | Status |
|---|---|---|---|
| Alembic migrations | `backend/migrations/` | Migration files | ✅ |
| Documented schema | `docs/DATABASE.md` | This file | ✅ |
| Mermaid ER diagram | `docs/DATABASE.md` §1 | ER diagram | ✅ |
| Foreign keys | All relationships defined | Model definitions | ✅ |
| Constraints | CHECK, UNIQUE, NOT NULL | Model definitions | ✅ |
| Indexes | Per-table index definitions | Migration files | ✅ |
| Transaction boundaries | Documented per operation | DATABASE.md §7 | ✅ |
| Published-version handling | form_versions + snapshot | DATABASE.md §3 | ✅ |
| Response-to-version relationships | submissions.form_version_id | DATABASE.md §1 | ✅ |
| Typed answer handling | Separate value columns | DATABASE.md §2 (answers table) | ✅ |
| Deletion behaviour | CASCADE documented | DATABASE.md §4 | ✅ |
| SQLite config | WAL, FK, busy_timeout | DATABASE.md §8 | ✅ |
| Seed strategy | Idempotent seed command | DATABASE.md §9 | ✅ |

## 4. Backend/API Design

| Requirement | Implementation | Evidence | Status |
|---|---|---|---|
| Versioned routes | `/api/v1/` prefix | API.md §1 | ✅ |
| OpenAPI docs | FastAPI auto-generation | `/api/v1/docs` | 🔲 |
| Request/response schemas | Pydantic v2 models | API.md §2-7 | ✅ |
| Domain validation | Service-layer validation | SECURITY.md §6 | ✅ |
| Authorization boundaries | Session-scoped queries | SECURITY.md §2 | ✅ |
| Consistent errors | RFC 9457 Problem Details | API.md §2 | ✅ |
| Pagination | Offset pagination | API.md §2 | ✅ |
| Idempotent submission | Unique constraint on idempotency key | API.md §6, DATABASE.md | ✅ |
| Transactional mutations | Per DATABASE.md §7 | Service implementations | 🔲 |
| Structured logging | JSON logging without sensitive data | SECURITY.md §8 | 🔲 |
| API integration tests | Pytest + HTTPX | TESTING.md §2 | 🔲 |
| Security tests | Cross-workspace, XSS, injection | TESTING.md §2 | 🔲 |

## 5. Code Quality

| Requirement | Implementation | Verification | Status |
|---|---|---|---|
| Strict TypeScript | `tsconfig.json` strict: true | `pnpm type-check` | 🔲 |
| Typed Python | Mypy/Pyright | `uv run mypy .` | 🔲 |
| No unjustified any | ESLint rule | Lint + review | 🔲 |
| Clear naming | Convention docs | Code review | 🔲 |
| Focused functions | Small module sizes | Code review | 🔲 |
| Meaningful tests | Behavior-based testing | Test review | 🔲 |
| Consistent formatting | Prettier + Ruff | CI checks | 🔲 |
| No dead code | Lint rules | CI checks | 🔲 |
| No secrets | .gitignore, env review | CI secret scan | 🔲 |
| Incremental git history | Conventional commits | Git log review | 🔲 |

## 6. Code Modularity

| Responsibility | Module | Status |
|---|---|---|
| UI primitives | `components/ui/` | 🔲 |
| Feature components | `components/workspace/`, `builder/`, `respondent/`, `results/` | 🔲 |
| Question-type registry | `components/questions/registry.ts` | 🔲 |
| Question editors | `components/questions/editors/` | 🔲 |
| Question renderers | `components/questions/renderers/` | 🔲 |
| Builder orchestration | `components/builder/BuilderLayout.tsx` | 🔲 |
| Autosave logic | `hooks/useAutosave.ts` | 🔲 |
| API client | `lib/api-client.ts` | 🔲 |
| Backend routes | `app/routes/` | 🔲 |
| Services/domain | `app/services/` | 🔲 |
| Repositories | `app/repositories/` | 🔲 |
| Validation | `app/schemas/`, `lib/validation.ts` | 🔲 |
| Session/auth | `app/dependencies.py`, `app/middleware.py` | 🔲 |
| Results aggregation | `app/services/results_service.py` | 🔲 |

## 7. Code Understanding

| Topic | Document | Code Reference | Status |
|---|---|---|---|
| Overall architecture | ARCHITECTURE.md | All modules | ✅ |
| Request flow | ARCHITECTURE.md §2 | Proxy + routes | ✅ |
| Builder state flow | ARCHITECTURE.md §6 | Builder hooks | ✅ |
| Autosave race prevention | INTERACTIONS.md §2.5 | `useAutosave.ts` | ✅ |
| Drag-and-drop design | ADR-005 | `QuestionNavigator.tsx` | ✅ |
| Form versioning | DATABASE.md §3 | `form_service.py` | ✅ |
| Database relationships | DATABASE.md §1 | Models | ✅ |
| Server validation | SECURITY.md §6 | Services + schemas | ✅ |
| Session isolation | SECURITY.md §2 | Dependencies | ✅ |
| Submission idempotency | API.md §6, DATABASE.md | Submission service | ✅ |
| Results aggregation | API.md §7 | Results service | ✅ |
| SQLite constraints | DATABASE.md §8 | DEPLOYMENT.md §3 | ✅ |
| Security boundaries | SECURITY.md | Middleware | ✅ |
| Testing strategy | TESTING.md | Test files | ✅ |
| Major trade-offs | INTERVIEW_GUIDE.md | — | ✅ |
| Scale changes | INTERVIEW_GUIDE.md | — | ✅ |
| Excluded features | INTERVIEW_GUIDE.md | — | ✅ |

---

**Last updated:** After Milestone 6 (Results & Analytics)  
**Next update:** After Milestone 7 (Polish & Handover)
