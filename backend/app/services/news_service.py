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


def _summary_text(content: str | None, max_length: int = 180):
    if not content:
        return ""
    compact = " ".join(str(content).split())
    if len(compact) <= max_length:
        return compact
    return compact[:max_length].rstrip() + "..."


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
        level_key = f"level_{level}"
        level_content = ArticleVersion.levels[level_key].as_string().label("content")
        stmt = select(NewsArticle, level_content).outerjoin(
            ArticleVersion,
            ArticleVersion.article_id == NewsArticle.id,
        )
        if category:
            stmt = stmt.where(NewsArticle.category == normalized_category)
        stmt = stmt.order_by(desc(NewsArticle.created_at))

        result = await session.execute(stmt)
        rows = result.all()

        news_list = []
        for article, content in rows:
            news_list.append({
                "id": article.id,
                "title": _display_title(article.title, level),
                "category": _display_category(article.category),
                "pub_date": article.pub_date,
                "comic_path": article.comic_path,
                "content": _summary_text(content),
                "view_count": article.view_count or 0,
            })

        return news_list


async def get_news_detail(article_id: int, level: int = 1):
    async with AsyncSessionLocal() as session:
        result = await session.execute(
            select(NewsArticle, ArticleVersion, ArticleAsset)
            .outerjoin(ArticleVersion, ArticleVersion.article_id == NewsArticle.id)
            .outerjoin(ArticleAsset, ArticleAsset.article_id == NewsArticle.id)
            .where(NewsArticle.id == article_id)
        )
        row = result.first()
        if not row:
            return None
        article, version, asset = row

        return {
            "id": article.id,
            "title": _display_title(article.title, level),
            "category": _display_category(article.category),
            "pub_date": article.pub_date,
            "comic_path": article.comic_path,
            "content": version.levels.get(f"level_{level}", "") if version else "",
            "quizzes": _resolve_quizzes_by_level(asset.quizzes, level) if asset else [],
            "highlights": _resolve_highlights_by_level(asset.highlights, level) if asset else []
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
