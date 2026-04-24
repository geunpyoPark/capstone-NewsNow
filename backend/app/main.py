from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware  
from app.routes import ai, auth, quiz, news, scrap
from app.database import engine, Base
from app.models.user import User
from app.models.quiz_result import QuizResult


@asynccontextmanager
async def lifespan(app: FastAPI):
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield


app = FastAPI(lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def root():
    return {"message": "Hello FastAPI 성공 🎉"}

app.include_router(auth.router)
app.include_router(quiz.router)
app.include_router(news.router)
app.include_router(ai.router)
app.include_router(scrap.router)