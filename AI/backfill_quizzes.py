"""기존 기사 퀴즈를 최신 정제 규칙으로 일괄 보정한다."""

import json

from psycopg2.extras import Json

from ai_db import get_db_connection
from highlight_utils import normalize_highlights
from quiz_utils import normalize_quizzes
from news_analyzer import NewsAnalyzer


def main():
    updated = 0
    scanned = 0
    analyzer = NewsAnalyzer()

    with get_db_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT av.article_id, av.levels, aa.quizzes, aa.highlights
                FROM article_versions av
                JOIN article_assets aa ON aa.article_id = av.article_id
                ORDER BY av.article_id
                """
            )
            rows = cur.fetchall()

            for article_id, levels, quizzes, highlights in rows:
                scanned += 1
                normalized_highlights = normalize_highlights(levels, highlights)
                normalized_quizzes = normalize_quizzes(
                    levels,
                    quizzes,
                    normalized_highlights,
                    vocabulary_quiz_builder=lambda level_text, level_highlights: analyzer.regenerate_vocabulary_quiz(
                        level_text,
                        level_highlights,
                    ),
                )

                before = json.dumps(quizzes, ensure_ascii=False, sort_keys=True)
                after = json.dumps(normalized_quizzes, ensure_ascii=False, sort_keys=True)
                if before == after:
                    continue

                cur.execute(
                    "UPDATE article_assets SET quizzes = %s WHERE article_id = %s",
                    (Json(normalized_quizzes), article_id),
                )
                updated += 1

        conn.commit()

    print(f"완료: {scanned}건 검사, {updated}건 업데이트")


if __name__ == "__main__":
    main()
