from fastapi import APIRouter
from pydantic import BaseModel
from app.services.scrap_service import save_news_quiz, save_scrap_word, save_scrap_article, get_scrap_words, get_scrap_articles

router = APIRouter(prefix="/scrap", tags=["scrap"])

class NewsQuizRequest(BaseModel):
    user_email: str
    article_id: int
    score: int
    total: int

class ScrapWordRequest(BaseModel):
    user_email: str
    word: str
    definition: str
    article_id: int

class ScrapArticleRequest(BaseModel):
    user_email: str
    article_id: int

@router.post("/quiz")
async def post_news_quiz(data: NewsQuizRequest):
    return await save_news_quiz(data.user_email, data.article_id, data.score, data.total)

@router.post("/word")
async def post_scrap_word(data: ScrapWordRequest):
    return await save_scrap_word(data.user_email, data.word, data.definition, data.article_id)

@router.post("/article")
async def post_scrap_article(data: ScrapArticleRequest):
    return await save_scrap_article(data.user_email, data.article_id)

@router.get("/words/{user_email}")
async def get_words(user_email: str):
    return await get_scrap_words(user_email)

@router.get("/articles/{user_email}")
async def get_articles(user_email: str):
    return await get_scrap_articles(user_email)