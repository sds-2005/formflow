# FormFlow — Project Context

## Product
FormFlow is a Typeform-style form builder and respondent experience, built as a take-home assignment for ScalerAI. It demonstrates full-stack engineering across 7 evaluation criteria: Functionality, UI/UX, Database Design, Backend/API Design, Code Quality, Code Modularity, and Code Understanding.

## Constraints
- **Deadline:** Thursday, 8 October 2026, 8:00 PM IST
- **No runtime LLM:** The deployed app must not call AI APIs or display AI-generated content
- **Original code:** No copying from Typeform or existing clones
- **Demo auth:** Simplified creator sessions, not production authentication
- **SQLite:** Single-writer constraint, persistent volume on Railway
- **Single deployment:** Vercel (frontend) + Railway (backend)

## Key Stakeholders
- **Creator:** Builds, publishes, and reviews forms
- **Respondent:** Completes published forms via public link (no auth required)
- **Evaluator:** Reviews code, tests features, interviews on decisions

## Quality Priorities
1. Core functionality (builder + respondent flow) must be production-quality
2. Reduce optional scope before weakening required functionality
3. Testing accompanies every milestone
4. Documentation matches code

## Technology
- Frontend: Next.js 15 (App Router, strict TypeScript, pnpm)
- Backend: FastAPI (Python 3.14, Pydantic v2, SQLAlchemy 2, Alembic, uv)
- Database: SQLite (WAL mode, persistent volume)

## Communication
- All design decisions documented in ADRs
- Progress tracked in `docs/PROGRESS.md`
- Evaluation readiness tracked in `docs/EVALUATION_MATRIX.md`
