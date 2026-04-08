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