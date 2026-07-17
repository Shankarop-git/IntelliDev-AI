from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import chat, code, github, project, settings

app = FastAPI(
    title="IntelliDev AI API",
    description="Backend API for IntelliDev AI - AI Developer Assistant",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Adjust in production, wildcards reject credentials
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
def health_check():
    return {"status": "healthy", "service": "IntelliDev AI API"}

# Include routers
app.include_router(chat.router, prefix="/api/chat", tags=["chat"])
app.include_router(code.router, prefix="/api/code", tags=["code"])
app.include_router(github.router, prefix="/api/github", tags=["github"])
app.include_router(project.router, prefix="/api/project", tags=["project"])
app.include_router(settings.router, prefix="/api/settings", tags=["settings"])
