from fastapi import APIRouter
from app.services.news_service import get_news_list, get_news_detail

router = APIRouter(prefix="/news", tags=["news"])

@router.get("/")
async def fetch_news(category: str = None, level: int = 1):
    return await get_news_list(category, level)

@router.get("/{article_id}")
async def fetch_news_detail(article_id: int, level: int = 1):
    return await get_news_detail(article_id, level)