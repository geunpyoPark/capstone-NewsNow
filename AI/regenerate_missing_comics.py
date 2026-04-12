import argparse
import os
import time

import psycopg2
from dotenv import load_dotenv

from comic_generator import ComicGenerator
from main_pipeline import generate_comic_scenarios


BASE_DIR = os.path.dirname(os.path.abspath(__file__))


def get_db_connection():
    load_dotenv()
    conn_params = {
        "host": os.getenv("DB_HOST"),
        "database": os.getenv("DB_NAME"),
        "user": os.getenv("DB_USER"),
        "password": os.getenv("DB_PASSWORD"),
        "port": os.getenv("DB_PORT"),
    }
    return psycopg2.connect(**conn_params)


def resolve_level_1_text(levels, fallback_title):
    if not isinstance(levels, dict):
        return fallback_title
    return (
        levels.get("level_1")
        or levels.get("level1")
        or levels.get("1")
        or fallback_title
    )


def is_missing_image(comic_path):
    if not comic_path:
        return True
    full_path = os.path.join(BASE_DIR, comic_path)
    return not os.path.exists(full_path)


def fetch_target_articles(cursor, limit):
    query = """
        SELECT
            a.id,
            a.title,
            a.comic_path,
            v.levels
        FROM news_articles a
        JOIN article_versions v ON a.id = v.article_id
        ORDER BY a.id DESC
    """
    cursor.execute(query)
    rows = cursor.fetchall()

    targets = []
    for article_id, title, comic_path, levels in rows:
        if is_missing_image(comic_path):
            targets.append(
                {
                    "id": article_id,
                    "title": title,
                    "comic_path": comic_path,
                    "levels": levels,
                }
            )
        if limit and len(targets) >= limit:
            break
    return targets


def regenerate_missing_comics(limit=None):
    os.makedirs(os.path.join(BASE_DIR, "static/comics"), exist_ok=True)

    with get_db_connection() as conn:
        with conn.cursor() as cur:
            targets = fetch_target_articles(cur, limit)

            if not targets:
                print("✅ 복구 대상이 없습니다. NULL 또는 유실된 이미지가 없습니다.")
                return

            print(f"🛠️ 복구 대상 기사 수: {len(targets)}")
            comic_gen = ComicGenerator(font_path=os.path.join(BASE_DIR, "my_font.ttf"))

            success_count = 0
            failure_count = 0

            for idx, article in enumerate(targets, start=1):
                article_id = article["id"]
                title = article["title"]
                level_1_text = resolve_level_1_text(article["levels"], title)

                print(f"\n[{idx}/{len(targets)}] 카드뉴스 복구 중: {title[:40]}...")
                try:
                    scenarios = generate_comic_scenarios(title, level_1_text)
                    comic_img = comic_gen.generate_news_card(scenarios)

                    img_rel_path = f"static/comics/{int(time.time() * 100)}.png"
                    img_full_path = os.path.join(BASE_DIR, img_rel_path)
                    comic_img.save(img_full_path)

                    cur.execute(
                        "UPDATE news_articles SET comic_path = %s WHERE id = %s",
                        (img_rel_path, article_id),
                    )
                    conn.commit()

                    success_count += 1
                    print(f"✅ 복구 완료: {img_rel_path}")
                except Exception as e:
                    conn.rollback()
                    failure_count += 1
                    print(f"❌ 복구 실패: {e}")

            print("\n" + "=" * 50)
            print(f"복구 성공: {success_count}건")
            print(f"복구 실패: {failure_count}건")
            print("=" * 50)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        description="comic_path가 비어 있거나 실제 파일이 없는 기사 카드뉴스를 다시 생성합니다."
    )
    parser.add_argument(
        "--limit",
        type=int,
        default=None,
        help="복구할 최대 기사 수",
    )
    args = parser.parse_args()

    regenerate_missing_comics(limit=args.limit)
