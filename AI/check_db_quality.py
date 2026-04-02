import os
import json
import psycopg2
from dotenv import load_dotenv

# 퀄리티 리뷰 결과 파일

# .env 로드
load_dotenv()

def check_latest_article():
    conn_params = {
        "host": os.getenv("DB_HOST"),
        "database": os.getenv("DB_NAME"),
        "user": os.getenv("DB_USER"),
        "password": os.getenv("DB_PASSWORD"),
        "port": os.getenv("DB_PORT")
    }

    try:
        with psycopg2.connect(**conn_params) as conn:
            with conn.cursor() as cur:
                # 가장 최근에 저장된 기사 1건 조회 (Join 사용)
                query = """
                SELECT 
                    a.title, a.category, a.pub_date,
                    v.levels,
                    s.quizzes, s.highlights
                FROM news_articles a
                JOIN article_versions v ON a.id = v.article_id
                JOIN article_assets s ON a.id = s.article_id
                ORDER BY a.id DESC
                LIMIT 1;
                """
                cur.execute(query)
                row = cur.fetchone()

                if not row:
                    print("⚠️ DB에 저장된 데이터가 아직 없습니다.")
                    return

                title, category, pub_date, levels, quizzes, highlights = row

                print("\n" + "="*50)
                print(f"📌 [최신 기사 샘플 확인]")
                print(f"제목: {title}")
                print(f"카테고리: {category} | 날짜: {pub_date}")
                print("="*50)

                print("\n📊 [난이도별 재구성 본문]")
                for lv, text in levels.items():
                    print(f"\n▶️ {lv.upper()}:")
                    print(f"{text[:200]}..." if len(text) > 200 else text)

                print("\n" + "-"*50)
                print("📝 [퀴즈 샘플]")
                for i, q in enumerate(quizzes):
                    print(f"{i+1}. ({q['type']}) {q['question']}")
                    for j, opt in enumerate(q['options']):
                        mark = "✅" if j == q['answer'] else "  "
                        print(f"   {mark} {j+1}) {opt}")
                    print(f"   💡 해설: {q['explanation']}")

                print("\n" + "-"*50)
                print("💡 [하이라이트 단어]")
                for h in highlights:
                    print(f"• {h['word']}: {h['definition']}")
                print("="*50 + "\n")

    except Exception as e:
        print(f"❌ DB 조회 중 에러: {e}")

if __name__ == "__main__":
    check_latest_article()
