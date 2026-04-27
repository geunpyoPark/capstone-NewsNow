from sqlalchemy import select
from app.database import AsyncSessionLocal
from app.models.scrap import NewsQuizResult, ScrapWord, ScrapArticle

async def save_news_quiz(user_email: str, article_id: int, score: int, total: int):
    async with AsyncSessionLocal() as session:
        result = NewsQuizResult(user_email=user_email, article_id=article_id, score=score, total=total)
        session.add(result)
        await session.commit()
        return {"message": "퀴즈 결과 저장 완료!"}

async def save_scrap_word(user_email: str, word: str, definition: str, article_id: int):
    async with AsyncSessionLocal() as session:
        scrap = ScrapWord(user_email=user_email, word=word, definition=definition, article_id=article_id)
        session.add(scrap)
        await session.commit()
        return {"message": "단어 스크랩 저장 완료!"}

async def save_scrap_article(user_email: str, article_id: int):
    async with AsyncSessionLocal() as session:
        scrap = ScrapArticle(user_email=user_email, article_id=article_id)
        session.add(scrap)
        await session.commit()
        return {"message": "뉴스 스크랩 저장 완료!"}

async def get_scrap_words(user_email: str):
    async with AsyncSessionLocal() as session:
        result = await session.execute(
            select(ScrapWord).where(ScrapWord.user_email == user_email)
        )
        words = result.scalars().all()
        return [{"id": w.id, "word": w.word, "definition": w.definition} for w in words]

async def get_scrap_articles(user_email: str):
    async with AsyncSessionLocal() as session:
        result = await session.execute(
            select(ScrapArticle).where(ScrapArticle.user_email == user_email)
        )
        articles = result.scalars().all()
        return [{"id": a.id, "article_id": a.article_id} for a in articles]