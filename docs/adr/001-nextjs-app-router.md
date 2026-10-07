# ADR-001: Next.js App Router for Frontend

**Status:** Accepted  
**Date:** 2026-10-07

## Context
We need a React framework that supports:
- Server-side rendering for public form pages (SEO, performance)
- API routes for BFF proxy (keeping backend URL server-only)
- File-based routing
- Modern React patterns (Server Components, Suspense)
- Vercel deployment

## Decision
Use **Next.js 15 with App Router** and strict TypeScript.

## Consequences
### Positive
- Built-in SSR/SSG for public forms
- API routes serve as BFF proxy without a separate server
- Vercel provides first-class deployment
- App Router supports React Server Components for reduced client JS
- Strong TypeScript integration

### Negative
- App Router has a learning curve with Server vs Client Component boundaries
- Some libraries may not fully support RSC yet
- Build times can be slower than Vite for development

### Trade-offs
- Chose App Router over Pages Router for modern patterns and better performance defaults
- Accepted additional complexity for the BFF proxy benefit (security)
