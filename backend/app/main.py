from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.middleware import ProxySecretMiddleware
from app.routes import auth, forms, questions, public, submissions

app = FastAPI(
    title="FormFlow API",
    description="Backend API for FormFlow typeform clone",
    version="1.0.0",
    docs_url="/api/v1/docs",
    openapi_url="/api/v1/openapi.json",
)

app.add_middleware(ProxySecretMiddleware)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api/v1")
app.include_router(forms.router, prefix="/api/v1")
app.include_router(questions.router, prefix="/api/v1")
app.include_router(public.router, prefix="/api/v1")
app.include_router(submissions.router, prefix="/api/v1")

@app.get("/api/v1/health")
async def health_check():
    return {"status": "ok", "environment": settings.ENVIRONMENT}
