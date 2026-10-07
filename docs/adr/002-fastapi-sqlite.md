# ADR-002: FastAPI + SQLite for Backend

**Status:** Accepted  
**Date:** 2026-10-07

## Context
The backend must serve a REST API with:
- Python runtime (project requirement)
- Relational database with migrations
- Strong validation (Pydantic)
- OpenAPI documentation
- Simple deployment (Railway)

## Decision
Use **FastAPI** with **Pydantic v2**, **SQLAlchemy 2** ORM, **Alembic** migrations, and **SQLite** as the database.

## Consequences
### Positive
- FastAPI provides automatic OpenAPI docs, async support, dependency injection
- Pydantic v2 offers fast validation with type safety
- SQLAlchemy 2 provides modern async-compatible ORM
- SQLite eliminates database server management
- Single file database simplifies Railway deployment with persistent volume

### Negative
- SQLite has a single-writer constraint (one Uvicorn worker)
- No horizontal scaling of write operations
- Limited concurrent write throughput
- No built-in backup automation

### Mitigations
- WAL mode for concurrent reads during writes
- Busy timeout (5000ms) for lock contention
- Single worker deployment documented as architectural constraint
- Clear migration path to PostgreSQL documented

### Trade-offs
- Chose SQLite simplicity over PostgreSQL power — acceptable for a demo/evaluation application
- Single worker is sufficient for evaluation traffic
