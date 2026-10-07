# FormFlow — Deployment

## 1. Architecture

```
Internet → Vercel (Next.js) → Railway (FastAPI + SQLite)
```

## 2. Vercel (Frontend)

### Configuration
- Framework: Next.js
- Build command: `pnpm build`
- Output directory: `.next`
- Install command: `pnpm install --frozen-lockfile`
- Root directory: `frontend`
- Node.js version: 20.x

### Environment Variables (Server-Only)
| Variable | Description | Example |
|---|---|---|
| `BACKEND_URL` | FastAPI Railway URL | `https://formflow-api.railway.app` |
| `PROXY_SECRET` | Shared proxy authentication secret | `<random-64-char-hex>` |

**None of these use `NEXT_PUBLIC_` prefix.**

### Routes
- `/` → Forms workspace
- `/forms/[id]/edit` → Builder
- `/forms/[id]/share` → Share
- `/forms/[id]/results` → Results
- `/f/[slug]` → Public respondent flow
- `/api/proxy/[...path]` → BFF proxy to FastAPI

## 3. Railway (Backend)

### Configuration
- Runtime: Python 3.12+ (Nixpacks)
- Start command: `alembic upgrade head && uvicorn app.main:app --host 0.0.0.0 --port $PORT --workers 1`
- Root directory: `backend`
- Persistent volume: `/data` (for SQLite database)

### Environment Variables
| Variable | Description | Example |
|---|---|---|
| `DATABASE_URL` | SQLite file path | `sqlite:///data/formflow.db` |
| `PROXY_SECRET` | Shared proxy authentication secret | (same as Vercel) |
| `ALLOWED_ORIGINS` | Comma-separated allowed origins | `https://formflow.vercel.app` |
| `ENVIRONMENT` | Deployment environment | `production` |
| `SESSION_EXPIRY_HOURS` | Session lifetime | `24` |

### Volume
- Mount path: `/data`
- Contains: `formflow.db`, `formflow.db-wal`, `formflow.db-shm`
- **Critical:** database survives restarts only if on persistent volume

### Constraints
- **Single worker:** `--workers 1` (SQLite single-writer limitation)
- **No horizontal scaling:** only one Railway instance
- **WAL mode:** enabled for better read concurrency
- **Busy timeout:** 5000ms for lock contention

## 4. Database Persistence

### Railway Volume
- Mount: `/data`
- Database: `/data/formflow.db`
- WAL files co-located on same volume

### Backup Strategy
1. Copy `/data/formflow.db`, `.db-wal`, `.db-shm` during low traffic
2. Railway doesn't provide automated backups — manual process
3. Consider periodic backup to object storage for production

### Verification
After deploy:
1. Create a form via the app
2. Restart Railway service
3. Verify form still exists
4. This confirms persistent volume is correctly mounted

## 5. Migration Release

### Process
1. `alembic upgrade head` runs as part of the start command (before uvicorn)
2. Migrations are forward-compatible — new code works with old schema during deploy
3. Never run destructive migrations without data backup
4. Test migrations on empty database before deploy

### Rollback
1. Deploy previous code version
2. Run `alembic downgrade -1` if needed
3. Note: data changes from the new version may be lost

## 6. Seed Data

### Command
```bash
uv run python -m app.seed
```

### Behavior
- **Idempotent:** checks for existing data before creating
- **Non-destructive:** never drops or truncates tables
- **Manual only:** never runs automatically on startup
- Creates demo forms with sample responses for evaluation

### Production Seeding
1. Deploy and verify migrations
2. SSH/exec into Railway container
3. Run seed command once
4. Verify via the application

## 7. Local Development

### Prerequisites
- Node.js 20+
- Python 3.12+
- pnpm
- uv

### Setup
```bash
# Clone repo
git clone <repo-url>

# Backend
cd backend
uv sync
cp .env.example .env  # Edit with local values
uv run alembic upgrade head
uv run python -m app.seed  # Optional: seed data
uv run uvicorn app.main:app --reload --port 8000

# Frontend (separate terminal)
cd frontend
pnpm install
cp .env.example .env.local  # Edit with local values
pnpm dev
```

### Local Environment Variables
**Backend `.env`:**
```
DATABASE_URL=sqlite:///./dev.db
PROXY_SECRET=dev-secret-change-in-production
ALLOWED_ORIGINS=http://localhost:3000
ENVIRONMENT=development
SESSION_EXPIRY_HOURS=24
```

**Frontend `.env.local`:**
```
BACKEND_URL=http://localhost:8000
PROXY_SECRET=dev-secret-change-in-production
```

## 8. Health Checks

### Endpoints
- `GET /api/v1/health` → basic liveness
- `GET /api/v1/health/ready` → database connectivity check

### Railway Configuration
- Health check path: `/api/v1/health/ready`
- Health check interval: 30s
- Restart on consecutive failures

## 9. Deployment Checklist

- [ ] All tests pass locally
- [ ] Production build succeeds (`pnpm build`, no errors)
- [ ] Migrations tested on empty database
- [ ] Environment variables set in Vercel
- [ ] Environment variables set in Railway
- [ ] Railway persistent volume mounted at `/data`
- [ ] PROXY_SECRET matches between Vercel and Railway
- [ ] ALLOWED_ORIGINS matches Vercel deployment URL
- [ ] Health endpoint responds
- [ ] Create form → persists after Railway restart
- [ ] Public form accessible without auth
- [ ] Form submission works
- [ ] Results show submitted data

## 10. Scaling Limitations

### Current (SQLite)
- Single writer
- Single instance
- ~100 concurrent readers (WAL mode)
- Suitable for demo/evaluation

### Future Migration Path
- PostgreSQL on Railway or managed service
- Multiple uvicorn workers
- Horizontal scaling possible
- Connection pooling
- Proper backup automation
