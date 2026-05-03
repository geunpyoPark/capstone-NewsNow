from sqlalchemy import select, desc
from app.database import AsyncSessionLocal
from app.models.quiz_result import QuizResult

MAIN_CATEGORIES = ["정치", "경제", "사회", "IT/과학"]

def normalize_main_category(cat: str | None) -> str:
    key = (cat or "").replace(" ", "")
    if "정치" in key:
        return "정치"
    if "경제" in key or "금융" in key:
        return "경제"
    if "사회" in key:
        return "사회"
    if "IT" in key or "과학" in key:
        return "IT/과학"
    return cat or ""

def normalize_level_map(levels: dict[str, int] | None) -> dict[str, int]:
    next_levels = {cat: 2 for cat in MAIN_CATEGORIES}
    for cat, level in (levels or {}).items():
        normalized = normalize_main_category(cat)
        if normalized not in next_levels:
            continue
        next_levels[normalized] = min(4, max(1, round(level or 2)))
    return next_levels

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
            return {"overall_level": 2, "categories": normalize_level_map({}), "has_result": False}

        categories = normalize_level_map({
            r.category1: r.category1_level,
            r.category2: r.category2_level,
        })
        
        return {
            "overall_level": r.overall_level,
            "categories": categories,
            "has_result": True,
        }
