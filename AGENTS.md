# FormFlow — AGENTS.md

## Repository Map

```
/
├── frontend/          # Next.js 15 App Router (TypeScript, pnpm)
├── backend/           # FastAPI (Python 3.14, uv)
├── docs/              # All project documentation
│   ├── adr/           # Architecture Decision Records
│   └── *.md           # Spec, design, architecture, API, DB, security, etc.
├── AGENTS.md          # THIS FILE — repository guide
├── README.md          # Project overview and setup
├── .env.example       # Environment variable template (no secrets)
└── .gitignore         # Ignore rules
```

## Canonical Commands

### Frontend (`frontend/`)
```bash
pnpm install              # Install dependencies (uses lockfile)
pnpm dev                  # Start dev server
pnpm build                # Production build
pnpm lint                 # ESLint
pnpm type-check           # TypeScript strict check
pnpm test                 # Vitest unit/component tests
pnpm test:e2e             # Playwright E2E tests
pnpm format:check         # Prettier check
```

### Backend (`backend/`)
```bash
uv sync                   # Install dependencies (uses lockfile)
uv run ruff format --check .   # Format check
uv run ruff check .             # Lint
uv run mypy .                   # Type check
uv run pytest                   # Tests
uv run alembic upgrade head     # Run migrations
uv run python -m app.seed       # Idempotent seed
uv run uvicorn app.main:app --reload  # Dev server
```

## Architectural Boundaries

1. **Frontend ↔ Backend**: Frontend NEVER calls FastAPI directly from client components. All API calls go through Next.js `/api/` BFF proxy routes.
2. **Backend routes ↔ services**: Route handlers delegate to service functions. Business logic lives in services, not route handlers.
3. **Services ↔ repositories**: Database access is through repository functions. Services don't construct SQL or use ORM sessions directly.
4. **Public vs creator**: Public endpoints (form fetch, submission) require no auth. Creator endpoints require valid session.

## Documentation Locations

| Document | Path | Purpose |
|---|---|---|
| Product Spec | `docs/PRODUCT_SPEC.md` | Features, screens, requirements |
| Design System | `docs/DESIGN_SYSTEM.md` | Visual tokens, components |
| Interactions | `docs/INTERACTIONS.md` | Keyboard, transitions, states |
| Architecture | `docs/ARCHITECTURE.md` | System design, data flow |
| Database | `docs/DATABASE.md` | Schema, ER diagram, migrations |
| API | `docs/API.md` | Routes, schemas, errors |
| Security | `docs/SECURITY.md` | Threat model, mitigations |
| Testing | `docs/TESTING.md` | Strategy, coverage targets |
| Deployment | `docs/DEPLOYMENT.md` | Vercel + Railway setup |
| Decisions | `docs/DECISIONS.md` | ADR index |
| Progress | `docs/PROGRESS.md` | Milestone tracking |
| Evaluation | `docs/EVALUATION_MATRIX.md` | Criteria → evidence mapping |
| Interview | `docs/INTERVIEW_GUIDE.md` | Architecture explanations |

## Required Checks Before Committing

1. Run `pnpm lint && pnpm type-check` in `frontend/`
2. Run `uv run ruff check . && uv run mypy .` in `backend/`
3. Run relevant tests for changed modules
4. Update documentation if contracts changed
5. Verify no secrets, `.env`, or database files staged

## Secret-Handling Rules

- **Never commit** `.env`, API keys, tokens, or database files
- Backend URL and proxy secret are **server-only** Next.js env vars (no `NEXT_PUBLIC_` prefix)
- Use `.env.example` with placeholder values only
- Creator session tokens stored as **hashed values** in the database
- Cookies are `HttpOnly`, `Secure`, `SameSite=Lax`

## Migration Rules

- All schema changes go through Alembic migrations
- Never use `create_all()` in production
- Migrations must be reversible (include downgrade)
- Test migrations against empty database
- Run `alembic upgrade head` before starting the backend

## Targeted-Reading Policy

At the start of each task:
1. Read this `AGENTS.md`
2. Read `docs/PROGRESS.md` for current state
3. Read only the specific docs relevant to your task
4. Search for affected routes, symbols, contracts
5. Do NOT scan entire `node_modules`, `.next`, `__pycache__`, or build output
