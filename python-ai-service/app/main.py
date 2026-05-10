from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes.pdf import router as pdf_router
from app.api.routes.video import router as video_router

from contextlib import asynccontextmanager
import asyncio
from app.services.transcription import get_model

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Load model in background so it doesn't block server startup
    asyncio.create_task(asyncio.to_thread(get_model))
    yield

app = FastAPI(
    title="Video & PDF Summarizer API", 
    version="4.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
async def health():
    return {"status": "ok"}

app.include_router(video_router)
app.include_router(pdf_router)

