import os
import time
import json
import psycopg2
from psycopg2.extras import Json
from dotenv import load_dotenv
from news_crawler import NaverNewsCrawler
from news_analyzer import NewsAnalyzer

# .env 로드
load_dotenv()

def validate_analysis(result):
    """AI 분석 결과에 필수 데이터가 모두 있는지 검증합니다."""
    required_keys = ["levels", "quizzes", "highlights"]
    if not all(k in result and result[k] for k in required_keys):
        return False
    return True

def save_to_db(conn, cursor, final_results):
    """전달받은 커넥션과 커서를 사용하여 데이터를 기사 단위로 저장합니다."""
    if not final_results:
        print("⚠️ [DB] 저장할 데이터가 없습니다.")
        return

    for news in final_results:
        try:
            # 1. news_articles (메타데이터) 저장 및 ID 반환
            cursor.execute("""
                INSERT INTO news_articles (title, url, pub_date)
                VALUES (%s, %s, %s)
                ON CONFLICT (url) DO NOTHING
                RETURNING id;
            """, (news['meta']['title'], news['meta']['url'], news['meta']['pub_date']))
            
            result = cursor.fetchone()
            if not result:
                print(f"⏩ [DB] 이미 존재하는 기사 (건너뜀): {news['meta']['title'][:20]}...")
                continue 
            article_id = result[0]

            # 2. article_versions (난이도별 본문) 저장
            cursor.execute("""
                INSERT INTO article_versions (article_id, levels)
                VALUES (%s, %s);
            """, (article_id, Json(news['levels'])))

            # 3. article_assets (퀴즈 및 하이라이트) 저장
            cursor.execute("""
                INSERT INTO article_assets (article_id, quizzes, highlights)
                VALUES (%s, %s, %s);
            """, (article_id, Json(news['quizzes']), Json(news['highlights'])))

            conn.commit() # 기사 한 건 성공 시 즉시 커밋
            print(f"✨ [DB] 저장 성공: {news['meta']['title'][:20]}...")

        except Exception as e:
            conn.rollback() # 에러 발생 시 해당 기사 작업만 롤백하고 트랜잭션 상태 초기화
            print(f"❌ [DB] 개별 기사 저장 중 오류: {e}")

def is_article_exists(cursor, url):
    """전달받은 커서를 사용하여 URL 중복 여부를 확인합니다."""
    try:
        cursor.execute("SELECT 1 FROM news_articles WHERE url = %s", (url,))
        return cursor.fetchone() is not None
    except Exception as e:
        print(f"⚠️ [DB] 중복 확인 중 오류: {e}")
        return False

def run_news_now_pipeline(keyword="반도체", count=3):
    crawler = NaverNewsCrawler()
    analyzer = NewsAnalyzer()
    
    print(f"🚀 [NewsNow] '{keyword}' 파이프라인 가동 (목표: {count}건)")
    
    news_list = crawler.get_news(query=keyword, display=count)
    if not news_list: return

    # DB 연결 정보 설정
    conn_params = {
        "host": os.getenv("DB_HOST"),
        "database": os.getenv("DB_NAME"),
        "user": os.getenv("DB_USER"),
        "password": os.getenv("DB_PASSWORD"),
        "port": os.getenv("DB_PORT")
    }

    final_results = []

    try:
        # 단일 연결 유지
        with psycopg2.connect(**conn_params) as conn:
            with conn.cursor() as cur:
                for i, news in enumerate(news_list):
                    print(f"\n--- 🔄 [{i+1}/{len(news_list)}] 처리 중 ---")
                    
                    # [중복 체크] 기존 커서 재사용 (오버헤드 없음)
                    if is_article_exists(cur, news['naver_link']):
                        print(f"⏩ 이미 분석된 기사입니다. (건너뜀)")
                        continue

                    body_text = crawler.extract_body(news['naver_link'])
                    if not body_text or len(body_text) < 200:
                        print("⚠️ 본문 부족으로 패스")
                        continue
                        
                    analysis_result = analyzer.analyze_and_reconstruct(body_text)
                    
                    if analysis_result and validate_analysis(analysis_result):
                        analysis_result['meta'] = {
                            "title": news['title'],
                            "url": news['naver_link'],
                            "pub_date": news['pub_date']
                        }
                        final_results.append(analysis_result)
                        print("✅ 분석 및 검증 완료")
                    else:
                        print("❌ AI 응답 데이터 품질 미달")

                    if i < len(news_list) - 1:
                        time.sleep(5) 

                # 루프 종료 후 저장 시 커넥션도 함께 전달
                if final_results:
                    save_to_db(conn, cur, final_results)
                    print(f"\n✅ [DB] 파이프라인 처리를 완료했습니다.")

    except Exception as e:
        print(f"❌ [DB] 데이터베이스 작업 중 오류 발생: {e}")

if __name__ == "__main__":
    run_news_now_pipeline(keyword="삼성전자 HBM", count=2)