from sqlalchemy import select, desc
from app.database import AsyncSessionLocal
from app.models.quiz_result import QuizResult

async def save_quiz_result(
    user_email: str,
    category1: str,
    category1_score: int,
    category1_level: int,
    category2: str,
    category2_score: int,
    category2_level: int,
    overall_level: int
):
    async with AsyncSessionLocal() as session:
        result = QuizResult(
            user_email=user_email,
            category1=category1,
            category1_score=category1_score,
            category1_level=category1_level,
            category2=category2,
            category2_score=category2_score,
            category2_level=category2_level,
            overall_level=overall_level
        )
        session.add(result)
        await session.commit()
        return {"message": "퀴즈 결과 저장 완료!"}

async def get_user_level(user_email: str):
    async with AsyncSessionLocal() as session:
        result = await session.execute(
            select(QuizResult)
            .where(QuizResult.user_email == user_email)
            .order_by(desc(QuizResult.created_at))
            .limit(1)
        )
        r = result.scalar_one_or_none()
        if not r:
            return {"overall_level": 1, "categories": {}}
        
        return {
            "overall_level": r.overall_level,
            "categories": {
                r.category1: r.category1_level,
                r.category2: r.category2_level,
            }
        }