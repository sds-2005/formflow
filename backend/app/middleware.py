from fastapi import Request, status
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware

from app.config import settings


class ProxySecretMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        # We only protect /api/ routes.
        # Health checks, OpenAPI docs, etc. can bypass if needed,
        # but to be safe, we protect all /api/v1/ except /health and public docs.
        # Actually, let's just protect routes that mutate or fetch sensitive data,
        # or simply rely on Next.js proxy for all /api/v1/ routes (except docs).

        path = request.url.path

        # Bypass for docs and health
        if path.startswith(("/api/v1/docs", "/api/v1/openapi.json", "/api/v1/health")):
            return await call_next(request)

        # Bypass for public respondent endpoints (no proxy secret needed for these, though typically the proxy will send it anyway)
        # However, to be strict, we enforce proxy secret for ALL non-doc API endpoints
        # because the frontend proxy routes EVERYTHING through /api/proxy.

        secret = request.headers.get("x-proxy-secret")
        if secret != settings.PROXY_SECRET:
            return JSONResponse(
                status_code=status.HTTP_403_FORBIDDEN,
                content={
                    "detail": "Invalid proxy secret. Direct backend access is forbidden."
                },
            )

        return await call_next(request)
