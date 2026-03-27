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
    # 모든 키가 존재하고 내용이 비어있지 않은지 확인
    if not all(k in result and result[k] for k in required_keys):
        return False
    # 레벨이 4개인지, 퀴즈가 3개인지 등 세부 검증도 가능
    return True

def save_to_db(final_results):
    """3개의 테이블에 데이터를 나누어 안전하게 저장합니다."""
    if not final_results:
        print("⚠️ [DB] 저장할 데이터가 없습니다.")
        return

    try:
        # DB 연결 정보를 환경변수에서 로드
        conn_params = {
            "host": os.getenv("DB_HOST"),
            "database": os.getenv("DB_NAME"),
            "user": os.getenv("DB_USER"),
            "password": os.getenv("DB_PASSWORD"),
            "port": os.getenv("DB_PORT")
        }

        # with 문을 사용하여 커넥션과 커서를 자동으로 닫음 (안전성 확보)
        with psycopg2.connect(**conn_params) as conn:
            with conn.cursor() as cur:
                for news in final_results:
                    try:
                        # 1. news_articles (메타데이터) 저장 및 ID 반환
                        cur.execute("""
                            INSERT INTO news_articles (title, url, pub_date)
                            VALUES (%s, %s, %s)
                            ON CONFLICT (url) DO NOTHING
                            RETURNING id;
                        """, (news['meta']['title'], news['meta']['url'], news['meta']['pub_date']))
                        
                        result = cur.fetchone()
                        if not result: continue # 중복 기사면 건너뜀
                        article_id = result[0]

                        # 2. article_versions (난이도별 본문) 저장
                        cur.execute("""
                            INSERT INTO article_versions (article_id, levels)
                            VALUES (%s, %s);
                        """, (article_id, Json(news['levels'])))

                        # 3. article_assets (퀴즈 및 하이라이트) 저장
                        cur.execute("""
                            INSERT INTO article_assets (article_id, quizzes, highlights)
                            VALUES (%s, %s, %s);
                        """, (article_id, Json(news['quizzes']), Json(news['highlights'])))

                        print(f"✨ [DB] 저장 성공: {news['meta']['title'][:20]}...")

                    except Exception as e:
                        print(f"❌ [DB] 개별 기사 저장 중 오류: {e}")
                        conn.rollback() # 에러 발생 시 해당 기사 저장 취소
                
                conn.commit()
                print(f"\n✅ [DB] 총 {len(final_results)}건의 기사 처리를 완료했습니다.")

    except Exception as e:
        print(f"❌ [DB] 데이터베이스 연결 실패: {e}")

def run_news_now_pipeline(keyword="반도체", count=3):
    crawler = NaverNewsCrawler()
    analyzer = NewsAnalyzer()
    
    print(f"🚀 [NewsNow] '{keyword}' 파이프라인 가동 (목표: {count}건)")
    
    news_list = crawler.get_news(query=keyword, display=count)
    if not news_list: return

    final_results = []

    for i, news in enumerate(news_list):
        print(f"\n--- 🔄 [{i+1}/{len(news_list)}] 처리 중 ---")
        
        body_text = crawler.extract_body(news['naver_link'])
        if not body_text or len(body_text) < 200:
            print("⚠️ 본문 부족으로 패스")
            continue
            
        analysis_result = analyzer.analyze_and_reconstruct(body_text)
        
        # [검증 로직]
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
            time.sleep(5) # 할당량 보호 (5초로 최적화)

    # 최종 결과 저장
    save_to_db(final_results)

if __name__ == "__main__":
    run_news_now_pipeline(keyword="삼성전자 HBM", count=2)