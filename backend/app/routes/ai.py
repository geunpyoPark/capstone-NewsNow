from pathlib import Path
import sys
from typing import Optional

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel


PROJECT_ROOT = Path(__file__).resolve().parents[3]
AI_DIR = PROJECT_ROOT / "AI"
if str(AI_DIR) not in sys.path:
    sys.path.insert(0, str(AI_DIR))

from main_pipeline import generate_news_comic_result


router = APIRouter(prefix="/ai", tags=["ai"])


class ComicGenerateRequest(BaseModel):
    title: str
    body: str
    article_id: Optional[int] = None
    category: Optional[str] = None


@router.post("/generate-comic")
def generate_comic(payload: ComicGenerateRequest):
    try:
        return generate_news_comic_result(
            title=payload.title,
            body=payload.body,
            article_id=payload.article_id,
            category=payload.category,
        )
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail={
                "status": "error",
                "error_message": str(exc),
            },
        ) from exc
