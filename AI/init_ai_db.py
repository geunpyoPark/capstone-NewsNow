"""AI 파이프라인이 사용하는 PostgreSQL 스키마를 초기화한다."""

from ai_db import get_db_connection, ensure_comic_storyboards_table


def init_ai_db():
    with get_db_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                CREATE TABLE IF NOT EXISTS news_articles (
                    id SERIAL PRIMARY KEY,
                    title TEXT NOT NULL,
                    url TEXT NOT NULL UNIQUE,
                    pub_date TEXT,
                    category TEXT NOT NULL DEFAULT '일반',
                    comic_path TEXT,
                    created_at TIMESTAMPTZ DEFAULT NOW()
                );
                """
            )

            cur.execute(
                """
                CREATE TABLE IF NOT EXISTS article_versions (
                    id SERIAL PRIMARY KEY,
                    article_id INTEGER NOT NULL REFERENCES news_articles(id) ON DELETE CASCADE,
                    levels JSONB NOT NULL,
                    created_at TIMESTAMPTZ DEFAULT NOW()
                );
                """
            )

            cur.execute(
                """
                CREATE TABLE IF NOT EXISTS article_assets (
                    id SERIAL PRIMARY KEY,
                    article_id INTEGER NOT NULL REFERENCES news_articles(id) ON DELETE CASCADE,
                    quizzes JSONB NOT NULL,
                    highlights JSONB NOT NULL,
                    created_at TIMESTAMPTZ DEFAULT NOW()
                );
                """
            )

            ensure_comic_storyboards_table(cur)
        conn.commit()

    print("✅ AI DB 스키마 초기화 완료")


if __name__ == "__main__":
    init_ai_db()
