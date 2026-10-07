# ADR-003: BFF Proxy Pattern for Security

**Status:** Accepted  
**Date:** 2026-10-07

## Context
The frontend (Vercel) and backend (Railway) are deployed on different origins. We need to:
- Keep the backend URL secret from the browser
- Authenticate proxy requests
- Prevent SSRF through the proxy
- Handle cookies properly
- Avoid exposing secrets to client-side JavaScript

## Decision
Use Next.js API routes as a **Backend-for-Frontend (BFF) proxy**.

All browser → backend communication flows through same-origin `/api/proxy/*` routes, which forward requests to FastAPI with a server-only `X-Proxy-Secret` header.

## Consequences
### Positive
- Backend URL never exposed to client
- Proxy secret never in browser
- Same-origin requests avoid CORS complexity for the browser
- Session cookies work naturally (same origin)
- Centralized request validation and header management

### Negative
- Additional hop adds latency (~10-20ms)
- Proxy code must be maintained
- Risk of SSRF if proxy destination is user-controlled (mitigated)

### Mitigations
- Fixed upstream URL — user input never controls destination
- Allowlist of path patterns and HTTP methods
- Body size limits enforced at proxy
- Hop-by-hop headers stripped
- Proxy secret verified by FastAPI middleware

### Alternatives Considered
- **Direct browser → FastAPI with CORS:** Exposes backend URL, requires credential CORS, complicates cookie handling
- **API Gateway (nginx/Cloudflare):** Additional infrastructure for a demo project
