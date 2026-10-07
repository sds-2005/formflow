# FormFlow — Security Design

## 1. Threat Model

### Assets
| Asset | Sensitivity | Location |
|---|---|---|
| Form definitions | Medium | SQLite |
| Response data | High | SQLite |
| Session tokens | High | Cookie + hashed in DB |
| Proxy secret | High | Server env var |
| Database file | High | Railway volume |

### Trust Boundaries
```
┌─────────────────────────────────────────┐
│ Browser (Untrusted)                     │
│  ├── Creator UI                         │
│  └── Public Respondent                  │
└───────────┬─────────────────────────────┘
            │ HTTPS (same-origin cookies)
┌───────────▼─────────────────────────────┐
│ Vercel / Next.js BFF (Semi-trusted)     │
│  ├── Static assets                      │
│  ├── Server-rendered pages              │
│  └── /api/proxy/* routes                │
└───────────┬─────────────────────────────┘
            │ HTTPS + X-Proxy-Secret
┌───────────▼─────────────────────────────┐
│ Railway / FastAPI (Trusted)             │
│  ├── API routes                         │
│  ├── Business logic                     │
│  └── SQLite database                    │
└─────────────────────────────────────────┘
```

### Public Endpoints (No Auth)
| Endpoint | Risk | Mitigation |
|---|---|---|
| GET /public/forms/:slug | Enumeration | Crypto-random slugs, rate limiting |
| POST /public/forms/:slug/submit | Spam, injection | Rate limiting, validation, idempotency |
| POST /sessions | Abuse | Rate limiting, session expiry |
| GET /health | Information disclosure | Minimal info only |

### Creator Endpoints (Session Required)
| Endpoint | Risk | Mitigation |
|---|---|---|
| All /forms/* | IDOR, unauthorized access | Session-scoped queries, workspace isolation |
| All /questions/* | IDOR | Form ownership verification |
| All /results/* | Data exposure | Session-scoped, form ownership |

### Abuse Cases
| Attack | Mitigation |
|---|---|
| Session token theft | HttpOnly, Secure cookies; token hashing |
| Cross-workspace access | All queries scoped to creator_id from session |
| CSRF | Origin/Referer validation + custom header |
| XSS | No dangerouslySetInnerHTML; output escaping |
| SQL injection | Parameterized ORM queries only |
| Response spam | Rate limiting, idempotency keys |
| SSRF via proxy | Fixed upstream URL, no user-controlled destinations |
| Secret enumeration | Non-enumerable UUIDs for all public identifiers |
| Mass assignment | Explicit Pydantic schemas for all inputs |

## 2. Session Security

### Demo Session Model
- "Enter demo workspace" creates an isolated creator + session
- Session token: 32-byte cryptographically random hex (using `secrets.token_hex(32)`)
- Only SHA-256 hash stored in database
- Raw token placed in cookie
- Cookie attributes: `HttpOnly`, `Secure`, `SameSite=Lax`, `Path=/`
- Session expires after 24 hours
- Expired sessions rejected at middleware level

### Authorization Flow
```
Request → Extract cookie → Hash token → Lookup in DB
  → Verify not expired → Verify is_active
  → Load creator_id → Scope all queries to creator_id
```

### Workspace Isolation
- Every creator query includes `WHERE creator_id = :session_creator_id`
- Form ownership verified before question/result access
- Cross-workspace access returns 404 (not 403, to prevent enumeration)

### Limitations (Documented)
- No password authentication (demo sessions only)
- No email verification
- No multi-device session management
- Sessions not invalidated on token rotation
- No 2FA
- Acceptable for a demo application; documented honestly in README

## 3. CSRF Protection

### Strategy
- **Origin/Referer validation:** Reject requests where Origin doesn't match allowed origins
- **Custom header:** All proxy requests include `X-Requested-With: FormFlow` header
- **SameSite=Lax cookies:** Prevent cross-origin cookie attachment on POST
- Public submission endpoints also require the custom header (set by the client-side fetch)

### Implementation
```python
# Middleware checks on state-changing requests (POST, PATCH, PUT, DELETE)
origin = request.headers.get("origin")
if origin and origin not in ALLOWED_ORIGINS:
    raise HTTPException(403, "Invalid origin")

requested_with = request.headers.get("x-requested-with")
if requested_with != "FormFlow":
    raise HTTPException(403, "Missing required header")
```

## 4. BFF Proxy Security

### Fixed Upstream
```typescript
const BACKEND_URL = process.env.BACKEND_URL; // Server-only, never NEXT_PUBLIC_
const PROXY_SECRET = process.env.PROXY_SECRET; // Server-only
```

### Request Validation
1. Allow only known path patterns: `/api/v1/sessions/**`, `/api/v1/forms/**`, `/api/v1/public/**`
2. Allow only known methods: GET, POST, PATCH, PUT, DELETE
3. Enforce body size limit (256 KB max)
4. Strip headers: `host`, `connection`, `transfer-encoding`, `x-proxy-secret` (from client)
5. Add `X-Proxy-Secret` header
6. Forward `cookie` header for session
7. Fixed upstream URL — user input never controls destination

### Backend Verification
```python
# FastAPI middleware
def verify_proxy(request: Request):
    secret = request.headers.get("x-proxy-secret")
    if secret != settings.PROXY_SECRET:
        # Allow health endpoints without proxy secret
        if request.url.path.startswith("/api/v1/health"):
            return
        raise HTTPException(403, "Unauthorized proxy request")
```

## 5. Security Headers

### Response Headers (FastAPI Middleware)
```python
headers = {
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "X-XSS-Protection": "0",  # Modern browsers: CSP preferred
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
    "Cache-Control": "no-store",  # For API responses
}
```

### Content Security Policy (Next.js)
```
default-src 'self';
script-src 'self';
style-src 'self' 'unsafe-inline';
img-src 'self' data:;
font-src 'self';
connect-src 'self';
frame-ancestors 'none';
base-uri 'self';
form-action 'self';
```

## 6. Input Validation

### Server-Side Limits
| Field | Limit |
|---|---|
| Form title | 1-200 characters |
| Question title | 1-500 characters |
| Question description | 0-1000 characters |
| Choice label | 1-200 characters |
| Choices per question | 1-50 |
| Questions per form | 1-100 |
| Text answer | 0-5000 characters |
| Email answer | Valid format, ≤254 characters |
| Number answer | -1,000,000 to 1,000,000 |
| Request body | 256 KB max |

### Input Normalization
- Trim whitespace from text inputs
- Normalize email to lowercase
- Strip HTML from text answers (server-side)
- Reject null bytes

### Output Escaping
- React auto-escapes JSX content
- No `dangerouslySetInnerHTML` for user content
- API responses are JSON — no HTML rendering of user content

## 7. Rate Limiting

### Implementation
- In-memory rate limiter (acceptable for single-instance SQLite deployment)
- Per-IP for public endpoints
- Per-session for creator endpoints
- Sliding window algorithm

### Limits
| Endpoint Category | Limit |
|---|---|
| Session creation | 10/min per IP |
| Public form fetch | 60/min per IP |
| Public submission | 30/min per IP |
| Creator operations | 120/min per session |

### Headers
```
X-RateLimit-Limit: 30
X-RateLimit-Remaining: 28
X-RateLimit-Reset: 1696694400
```

### Privacy
- Rate limit identifiers (IP hashes) are transient (in-memory only)
- Not persisted to database
- No IP address logging

## 8. Data Privacy

### Minimization
- No IP addresses stored
- No user agents stored
- No analytics/telemetry
- No third-party tracking
- Session tokens hashed before storage

### Logging
- Structured JSON logging
- Request ID for tracing
- **Never log:** response content, email answers, tokens, cookies, request bodies
- Log: method, path, status code, duration, request ID, creator_id (for creator routes)

## 9. CORS Configuration

### FastAPI CORS Middleware
```python
CORS(
    allow_origins=[settings.FRONTEND_URL],  # Exact origin, never wildcard
    allow_methods=["GET", "POST", "PATCH", "PUT", "DELETE"],
    allow_headers=["Content-Type", "X-Requested-With", "X-Proxy-Secret"],
    allow_credentials=True,
    max_age=86400,
)
```

**No wildcard origins with credentials.** Only the exact Vercel frontend URL is allowed.

## 10. Dependency Security

- Pin all dependency versions in lockfiles (`pnpm-lock.yaml`, `uv.lock`)
- No prerelease dependencies
- Review `npm audit` and `uv pip audit` results
- No unnecessary dependencies

## 11. Environment Variables

| Variable | Location | Secret | Purpose |
|---|---|---|---|
| `BACKEND_URL` | Next.js server | Yes | FastAPI upstream URL |
| `PROXY_SECRET` | Both | Yes | Proxy authentication |
| `DATABASE_URL` | FastAPI | Yes | SQLite file path |
| `ALLOWED_ORIGINS` | FastAPI | No | CORS allowed origins |
| `SESSION_EXPIRY_HOURS` | FastAPI | No | Session lifetime |
| `ENVIRONMENT` | Both | No | dev/staging/production |

**None of these use the `NEXT_PUBLIC_` prefix.**
