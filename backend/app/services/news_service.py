from sqlalchemy import select
from app.database import AsyncSessionLocal
from app.models.news import NewsArticle, ArticleVersion, ArticleAsset

async def get_news_list(category: str = None, level: int = 1):
    async with AsyncSessionLocal() as session:
        if category:
            result = await session.execute(
                select(NewsArticle).where(NewsArticle.category == category)
            )
        else:
            result = await session.execute(select(NewsArticle))
        
        articles = result.scalars().all()
        
        news_list = []
        for a in articles:
            version = await session.execute(
                select(ArticleVersion).where(ArticleVersion.article_id == a.id)
            )
            v = version.scalar_one_or_none()
            
            news_list.append({
                "id": a.id,
                "title": a.title,
                "category": a.category,
                "pub_date": a.pub_date,
                "comic_path": a.comic_path,
                "content": v.levels.get(f"level_{level}", "") if v else ""
            })
        
        return news_list

async def get_news_detail(article_id: int, level: int = 1):
    async with AsyncSessionLocal() as session:
        article = await session.get(NewsArticle, article_id)
        
        version = await session.execute(
            select(ArticleVersion).where(ArticleVersion.article_id == article_id)
        )
        asset = await session.execute(
            select(ArticleAsset).where(ArticleAsset.article_id == article_id)
        )
        
        v = version.scalar_one_or_none()
        a = asset.scalar_one_or_none()
        
        return {
            "id": article.id,
            "title": article.title,
            "category": article.category,
            "pub_date": article.pub_date,
            "comic_path": article.comic_path,
            "content": v.levels.get(f"level_{level}", "") if v else "",
            "quizzes": a.quizzes if a else [],
            "highlights": a.highlights if a else []
        }