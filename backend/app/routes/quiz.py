from fastapi import APIRouter
from pydantic import BaseModel
from app.services.quiz_service import save_quiz_result

router = APIRouter(prefix="/quiz", tags=["quiz"])

class QuizResultRequest(BaseModel):
    user_email: str
    category1: str
    category1_score: int
    category1_level: int
    category2: str
    category2_score: int
    category2_level: int
    overall_level: int

@router.post("/result")
async def submit_quiz_result(data: QuizResultRequest):
    return await save_quiz_result(
        user_email=data.user_email,
        category1=data.category1,
        category1_score=data.category1_score,
        category1_level=data.category1_level,
        category2=data.category2,
        category2_score=data.category2_score,
        category2_level=data.category2_level,
        overall_level=data.overall_level
    )