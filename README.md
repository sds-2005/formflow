# FormFlow

FormFlow is a full-stack, Typeform-inspired form builder with a conversational one-question-at-a-time response experience. Creators can build, reorder, publish, duplicate, unpublish, and delete forms; respondents can answer a public form without authentication; and creators can review individual submissions and per-question analytics.

## Feature coverage

- Three-pane form builder with native drag-and-drop and `Alt + ↑/↓` keyboard reordering
- Eight required question types: short text, long text, multiple choice, dropdown, email, number, yes/no, and rating
- Required toggles, help text, choice editing, rating scale, and numeric min/max settings
- Draft/published lifecycle, immutable publish snapshots, stable public links, duplication, rename, and deletion
- Animated, keyboard-first public response flow with client and server validation
- Idempotent submission handling and persisted responses
- Summary charts/statistics, response table, individual response view, and CSV export
- Seeded published form with mixed questions and responses plus a draft form
- “Coming soon” placeholders for custom themes and thank-you screens

## Technology

| Layer | Technology |
|---|---|
| Frontend | Next.js 15 App Router, React 19, TypeScript, Tailwind CSS, TanStack Query, Framer Motion |
| Backend | Python 3.14, FastAPI, Pydantic v2, SQLAlchemy 2 async |
| Database | SQLite with Alembic migrations, foreign keys, WAL, and busy timeout |
| Deployment | Vercel frontend + Railway backend with a persistent SQLite volume |

## Local setup

### 1. Environment

Copy `.env.example` to `backend/.env` and `frontend/.env.local`. Use the same strong `PROXY_SECRET` in both files. The defaults are suitable only for local development.

### 2. Backend

```bash
cd backend
uv sync
uv run alembic upgrade head
uv run python -m app.seed
uv run uvicorn app.main:app --reload
```

The API runs at `http://localhost:8000`; interactive API docs are at `http://localhost:8000/api/v1/docs`.

### 3. Frontend

```bash
cd frontend
pnpm install
pnpm dev
```

Open `http://localhost:3000`, then choose **Enter Demo Workspace**. Each fresh demo workspace is automatically populated, so it is immediately usable even if the standalone seed command was not run.

## Architecture

```text
Browser
  → Next.js pages and client components
  → /api/proxy/* (server-side BFF; owns the HttpOnly session cookie)
  → FastAPI routes
  → services (business rules)
  → repositories (database access)
  → SQLite
```

Client components never call FastAPI directly. Creator routes require a hashed demo-session token; public form fetch and submission routes require no respondent login. Publishing copies the editable question set into an immutable `form_versions.questions_snapshot`, and every response points to the exact version it answered.

## Database schema

| Table | Purpose and important relationships |
|---|---|
| `creators` | Demo creator/workspace root |
| `creator_sessions` | Hashed, expiring creator sessions → `creators` |
| `forms` | Editable form metadata, stable slug, draft/published state → `creators` |
| `form_versions` | Immutable published question snapshots → `forms` |
| `questions` | Ordered editable questions and JSON settings → `forms` |
| `question_options` | Ordered choices → `questions` |
| `submissions` | Timestamped, idempotent responses → `forms`, `form_versions` |
| `answers` | Typed scalar answer storage → `submissions` |
| `answer_option_selections` | Choice answer snapshots (ID + label) → `answers` |

The `(form_id, idempotency_key)` unique constraint prevents duplicate submissions. Form/question deletion and position compaction are transactional. Alembic is the only production schema-management mechanism.

## API overview

All paths are under `/api/v1`.

| Area | Routes |
|---|---|
| Session | `POST /auth/demo`, `GET /auth/me` |
| Forms | `GET/POST /forms`, `GET/PATCH/DELETE /forms/{id}` |
| Lifecycle | `POST /forms/{id}/duplicate`, `/publish`, `/unpublish` |
| Questions | `GET/POST /forms/{id}/questions`, `PATCH/DELETE .../{questionId}`, `POST .../{questionId}/duplicate`, `PUT .../reorder` |
| Public | `GET /public/forms/{slug}`, `POST /public/forms/{slug}/submissions` |
| Results | `GET /forms/{id}/results`, `GET /forms/{id}/results/{submissionId}` |

Detailed request/response contracts are documented in [`docs/API.md`](docs/API.md).

## Quality checks

```bash
cd frontend
pnpm lint
pnpm type-check
pnpm build

cd ../backend
uv run ruff format --check .
uv run ruff check .
uv run mypy .
uv run pytest
```

## Assumptions

- Creator authentication is intentionally simplified to an isolated, expiring demo workspace.
- A published form must contain at least one valid question.
- Multiple choice is single-select, matching the minimum assignment requirement.
- Logic jumps, integrations, collaboration, payments, file upload, and custom theme editing are outside the required scope; relevant builder placeholders are visibly marked.
- SQLite is appropriate for the assignment deployment when Railway uses a persistent volume and a single application replica.

## Deployment

Deployment steps and required environment variables are in [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md). The repository includes `frontend/vercel.json` and `backend/railway.json`; production still requires the owner to connect the public repository, configure secrets, attach persistent storage, and supply the final hosted URL.
