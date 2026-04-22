from fastapi import APIRouter
from app.services.news_service import get_news_list, get_news_detail

router = APIRouter(prefix="/news", tags=["news"])

@router.get("/")
async def fetch_news(category: str = None):
    return await get_news_list(category)

@router.get("/{article_id}")
async def fetch_news_detail(article_id: int):
    return await get_news_detail(article_id)