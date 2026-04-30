from fastapi import APIRouter, HTTPException
from app.services.news_service import get_news_list, get_news_detail, get_fourcut_list

router = APIRouter(prefix="/news", tags=["news"])

@router.get("/")
async def fetch_news(category: str = None, level: int = 1):
    return await get_news_list(category, level)

@router.get("/fourcut")
async def fetch_fourcut():
    try:
        return await get_fourcut_list()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{article_id}")
async def fetch_news_detail(article_id: int, level: int = 1):
    return await get_news_detail(article_id, level)

@router.patch("/{article_id}/view")
async def update_view_count(article_id: int):
    return await increment_view_count(article_id)