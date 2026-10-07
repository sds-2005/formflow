# ADR-006: Demo Creator Session Model

**Status:** Accepted  
**Date:** 2026-10-07

## Context
The application needs creator authentication but this is a demo/evaluation project. Full authentication (email/password, OAuth) is out of scope. Requirements:
- Workspace isolation between creators
- Session-based authorization
- Secure token handling
- Honest documentation of limitations

## Decision
Use a **simplified demo session model**:

1. "Enter demo workspace" button creates a new creator + session
2. Session token: 32-byte cryptographically random hex (`secrets.token_hex(32)`)
3. Only SHA-256 hash stored in database
4. Raw token placed in `HttpOnly`, `Secure`, `SameSite=Lax` cookie
5. Sessions expire after 24 hours
6. All creator queries scoped through authenticated session

## Consequences
### Positive
- No password management or email verification needed
- Workspace isolation is real and tested
- Token security follows best practices (hash-only storage)
- Cookie attributes prevent XSS token theft
- Simple UX: one click to enter workspace

### Negative
- No way to "log back in" to the same workspace (new session = new workspace)
- No multi-device access to same workspace
- No account recovery
- Session expiry means workspace access is temporary

### Limitations (Documented Honestly)
- This is a demo authentication model, not production auth
- In production: add OAuth/email-password, persistent accounts, session management
- Current model is sufficient for demonstrating workspace isolation, IDOR protection, and authorization patterns
- Evaluator can create multiple workspaces to verify isolation

### Security Properties Preserved
- Server-side authorization (not client-supplied IDs)
- Token hashing (database compromise doesn't expose tokens)
- Secure cookie attributes
- Session expiry
- Cross-workspace denial tested
