"""기존 기사 하이라이트를 최신 정제 규칙으로 일괄 보정한다."""

import json

from psycopg2.extras import Json

from ai_db import get_db_connection
from highlight_utils import normalize_highlights


def main():
    updated = 0
    scanned = 0

    with get_db_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT av.article_id, av.levels, aa.highlights
                FROM article_versions av
                JOIN article_assets aa ON aa.article_id = av.article_id
                ORDER BY av.article_id
                """
            )
            rows = cur.fetchall()

            for article_id, levels, highlights in rows:
                scanned += 1
                normalized = normalize_highlights(levels, highlights)
                before = json.dumps(highlights, ensure_ascii=False, sort_keys=True)
                after = json.dumps(normalized, ensure_ascii=False, sort_keys=True)
                if before == after:
                    continue

                cur.execute(
                    "UPDATE article_assets SET highlights = %s WHERE article_id = %s",
                    (Json(normalized), article_id),
                )
                updated += 1

        conn.commit()

    print(f"완료: {scanned}건 검사, {updated}건 업데이트")


if __name__ == "__main__":
    main()
