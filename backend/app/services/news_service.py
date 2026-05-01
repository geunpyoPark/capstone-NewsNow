from sqlalchemy import select, desc
from app.database import AsyncSessionLocal
from app.models.news import NewsArticle, ArticleVersion, ArticleAsset, ComicStoryboard


def _normalize_category_for_query(category: str | None):
    if not category:
        return None
    mapping = {
        "IT/과학": "IT과학",
    }
    return mapping.get(category, category)


def _display_category(category: str | None):
    if not category:
        return "일반"
    mapping = {
        "IT과학": "IT/과학",
    }
    return mapping.get(category, category)


TITLE_REPLACEMENTS_FOR_EASY_LEVELS = [
    ("[사설]", "[사설]"),
    ("[칼럼]", "[칼럼]"),
    ("野", "야당"),
    ("與", "여당"),
    ("尹", "윤석열"),
    ("李대통령", "이 대통령"),
    ("李대통령", "이 대통령"),
    ("李", "이"),
    ("李", "이"),
    ("韓", "한국"),
    ("美", "미국"),
    ("中", "중국"),
    ("日", "일본"),
    ("北", "북한"),
    ("道", "도"),
    ("軍", "군"),
    ("檢", "검찰"),
    ("警", "경찰"),
]


def _display_title(title: str | None, level: int):
    if not title:
        return ""
    if level > 2:
        return title

    normalized = title
    for source, target in TITLE_REPLACEMENTS_FOR_EASY_LEVELS:
        normalized = normalized.replace(source, target)

    return normalized


def _resolve_highlights_by_level(highlights, level: int):
    if not highlights:
        return []
    if isinstance(highlights, dict):
        level_key = f"level_{level}"
        selected = highlights.get(level_key)
        if isinstance(selected, list):
            return selected
        fallback = highlights.get("level_1")
        if isinstance(fallback, list):
            return fallback
        return []
    if isinstance(highlights, list):
        return highlights
    return []


def _resolve_quizzes_by_level(quizzes, level: int):
    if not quizzes:
        return []
    if isinstance(quizzes, dict):
        level_key = f"level_{level}"
        selected = quizzes.get(level_key)
        if isinstance(selected, list):
            return selected
        fallback = quizzes.get("level_1")
        if isinstance(fallback, list):
            return fallback
        return []
    if isinstance(quizzes, list):
        return quizzes
    return []


async def get_news_list(category: str = None, level: int = 1):
    async with AsyncSessionLocal() as session:
        normalized_category = _normalize_category_for_query(category)
        if category:
            result = await session.execute(
                select(NewsArticle).where(NewsArticle.category == normalized_category)
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
                "title": _display_title(a.title, level),
                "category": _display_category(a.category),
                "pub_date": a.pub_date,
                "comic_path": a.comic_path,
                "content": v.levels.get(f"level_{level}", "") if v else "",
                "view_count": a.view_count or 0,
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
            "title": _display_title(article.title, level),
            "category": _display_category(article.category),
            "pub_date": article.pub_date,
            "comic_path": article.comic_path,
            "content": v.levels.get(f"level_{level}", "") if v else "",
            "quizzes": _resolve_quizzes_by_level(a.quizzes, level) if a else [],
            "highlights": _resolve_highlights_by_level(a.highlights, level) if a else []
        }


async def get_fourcut_list():
    async with AsyncSessionLocal() as session:
        result = await session.execute(
            select(NewsArticle, ComicStoryboard)
            .join(ComicStoryboard, ComicStoryboard.article_id == NewsArticle.id)
            .order_by(desc(NewsArticle.created_at))
        )
        rows = result.all()

        return [
            {
                "id": article.id,
                "title": _display_title(article.title, 2),
                "category": _display_category(article.category),
                "pub_date": article.pub_date,
                "comic_path": comic.comic_path,
            }
            for article, comic in rows
        ]


async def increment_view_count(article_id: int):
    async with AsyncSessionLocal() as session:
        article = await session.get(NewsArticle, article_id)
        if article:
            article.view_count = (article.view_count or 0) + 1
            await session.commit()
            return {"view_count": article.view_count}
        return {"view_count": 0}
