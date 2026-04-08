import asyncio
from app.database import engine, Base
from app.models.user import User
from app.models.quiz_result import QuizResult

async def init():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    print("✅ DB 테이블 생성 완료!")

asyncio.run(init())