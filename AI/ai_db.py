"""AI 파이프라인이 쓰는 DB 연결 및 저장 로직만 분리한 모듈."""

import os

import psycopg2
from psycopg2.extras import Json


def get_db_connection_params():
    """환경변수에서 PostgreSQL 접속 정보를 읽는다."""
    return {
        "host": os.getenv("DB_HOST"),
        "database": os.getenv("DB_NAME"),
        "user": os.getenv("DB_USER"),
        "password": os.getenv("DB_PASSWORD"),
        "port": os.getenv("DB_PORT"),
    }


def get_db_connection():
    """호출 측에서 with 문으로 사용할 DB 연결 객체를 만든다."""
    return psycopg2.connect(**get_db_connection_params())


def ensure_comic_storyboards_table(cursor):
    """만화 스토리보드 전용 테이블이 없으면 생성한다."""
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS comic_storyboards (
            article_id INTEGER PRIMARY KEY REFERENCES news_articles(id) ON DELETE CASCADE,
            character_profile JSONB NOT NULL,
            style_profile JSONB NOT NULL,
            panels JSONB NOT NULL,
            bubble_layouts JSONB,
            comic_path TEXT,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW()
        );
    """)


def is_article_exists(cursor, url):
    """중복 수집 방지를 위해 기사 URL 존재 여부를 확인한다."""
    cursor.execute("SELECT 1 FROM news_articles WHERE url = %s", (url,))
    return cursor.fetchone() is not None


def save_news_result(conn, cursor, news):
    """뉴스 분석/만화 결과를 기존 서비스 스키마에 맞춰 저장한다."""
    try:
        ensure_comic_storyboards_table(cursor)
        cursor.execute("""
            INSERT INTO news_articles (title, url, pub_date, category, comic_path)
            VALUES (%s, %s, %s, %s, %s)
            ON CONFLICT (url) DO NOTHING
            RETURNING id;
        """, (
            news["meta"]["title"],
            news["meta"]["url"],
            news["meta"]["pub_date"],
            news["meta"].get("category", "일반"),
            news.get("comic_path"),
        ))

        result = cursor.fetchone()
        if not result:
            return
        article_id = result[0]

        cursor.execute(
            "INSERT INTO article_versions (article_id, levels) VALUES (%s, %s);",
            (article_id, Json(news["levels"])),
        )
        cursor.execute(
            "INSERT INTO article_assets (article_id, quizzes, highlights) VALUES (%s, %s, %s);",
            (article_id, Json(news["quizzes"]), Json(news["highlights"])),
        )
        if news.get("storyboard"):
            storyboard = news["storyboard"]
            cursor.execute("""
                INSERT INTO comic_storyboards (
                    article_id, character_profile, style_profile, panels, bubble_layouts, comic_path, updated_at
                )
                VALUES (%s, %s, %s, %s, %s, %s, NOW())
                ON CONFLICT (article_id) DO UPDATE SET
                    character_profile = EXCLUDED.character_profile,
                    style_profile = EXCLUDED.style_profile,
                    panels = EXCLUDED.panels,
                    bubble_layouts = EXCLUDED.bubble_layouts,
                    comic_path = EXCLUDED.comic_path,
                    updated_at = NOW();
            """, (
                article_id,
                Json(storyboard["character_profile"]),
                Json(storyboard["style_profile"]),
                Json(storyboard["panels"]),
                Json(news.get("bubble_layouts", [])),
                news.get("comic_path"),
            ))

        conn.commit()
        print(f"✨ [DB] 저장 성공: {news['meta']['title'][:20]}...")
    except Exception as e:
        conn.rollback()
        print(f"❌ [DB] 저장 실패: {e}")
