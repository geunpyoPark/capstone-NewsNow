import os
import time
import json
import psycopg2
from psycopg2.extras import Json
from dotenv import load_dotenv
from news_crawler import NaverNewsCrawler
from news_analyzer import NewsAnalyzer, is_retryable_error

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
        return

    for news in final_results:
        try:
            # 1. news_articles (메타데이터 + 카테고리) 저장 및 ID 반환
            cursor.execute("""
                INSERT INTO news_articles (title, url, pub_date, category)
                VALUES (%s, %s, %s, %s)
                ON CONFLICT (url) DO NOTHING
                RETURNING id;
            """, (news['meta']['title'], news['meta']['url'], news['meta']['pub_date'], news['meta'].get('category', '일반')))
            
            result = cursor.fetchone()
            if not result:
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
            print(f"✨ [DB] 저장 완료: {news['meta']['title'][:20]}...")

        except Exception as e:
            conn.rollback()
            print(f"❌ [DB] 개별 기사 저장 중 오류: {e}")

def run_news_now_pipeline(keyword="반도체", count=5, category="일반"):
    crawler = NaverNewsCrawler()
    analyzer = NewsAnalyzer()
    
    print(f"🚀 [NewsNow] '{keyword}' 목표 {count}건 수집 시작!")
    
    # DB 연결 설정
    conn_params = {
        "host": os.getenv("DB_HOST"),
        "database": os.getenv("DB_NAME"),
        "user": os.getenv("DB_USER"),
        "password": os.getenv("DB_PASSWORD"),
        "port": os.getenv("DB_PORT")
    }

    final_results_count = 0
    start_index = 1
    max_search = 100 # 안전장치: 최대 100번 기사까지만 탐색

    try:
        with psycopg2.connect(**conn_params) as conn:
            with conn.cursor() as cur:
                while final_results_count < count and start_index <= max_search:
                    print(f"🔍 검색 결과 {start_index}번부터 탐색 중... (현재 {final_results_count}/{count} 수집)")
                    news_list = crawler.get_news(query=keyword, display=10, start=start_index)
                    
                    if not news_list:
                        print("⚠️ 더 이상 검색 결과가 없습니다.")
                        break

                    for news in news_list:
                        if final_results_count >= count:
                            break
                        
                        # [1. 중복 체크]
                        if is_article_exists(cur, news['naver_link']):
                            print(f"⏩ 중복 기사 패스: {news['title'][:15]}...")
                            continue

                        # [2. 본문 추출 및 최적화]
                        body_text = crawler.extract_body(news['naver_link'])
                        if not body_text or len(body_text) < 200:
                            print(f"⚠️ 본문 부족 패스 ({len(body_text) if body_text else 0}자)")
                            continue
                        
                        # 💡 토큰 절약을 위해 본문 길이를 2500자로 제한
                        body_text = body_text[:2500]
                            
                        # [3. AI 분석]
                        print(f"🧠 AI 분석 중: {news['title'][:20]}...")
                        try:
                            analysis_result = analyzer.analyze_and_reconstruct(body_text)
                            
                            if analysis_result and validate_analysis(analysis_result):
                                analysis_result['meta'] = {
                                    "title": news['title'],
                                    "url": news['naver_link'],
                                    "pub_date": news['pub_date'],
                                    "category": category
                                }
                                # 분석 성공 시 즉시 DB 저장
                                save_to_db(conn, cur, [analysis_result])
                                final_results_count += 1
                                print(f"✅ {final_results_count}/{count} 기사 수집 성공!")
                            else:
                                print("❌ AI 응답 품질 미달 패스")
                        except Exception as e:
                            print(f"⚠️ 분석 실패 (건너뜀): {e}")
                            if is_retryable_error(e):
                                # 할당량 초과 에러가 재시도 끝에 실패했다면, 전체 흐름을 위해 길게 쉽니다.
                                print("🛑 API 제한 상태가 지속되어 60초간 쿨다운을 가집니다...")
                                time.sleep(60)
                            continue 

                        # API 할당량 보호: 평상시에도 15초간 대기
                        print(f"💤 다음 작업을 위해 15초간 대기합니다...")
                        time.sleep(15) 

                    # 다음 페이지로 이동
                    start_index += 10

    except Exception as e:
        print(f"❌ [Pipeline] 치명적 오류 발생: {e}")

def is_article_exists(cursor, url):
    """전달받은 커서를 사용하여 URL 중복 여부를 확인합니다."""
    try:
        cursor.execute("SELECT 1 FROM news_articles WHERE url = %s", (url,))
        return cursor.fetchone() is not None
    except Exception as e:
        print(f"⚠️ [DB] 중복 확인 중 오류: {e}")
        return False

if __name__ == "__main__":
    tasks = [
        {"category": "정치", "keyword": "국회 정책"},
        {"category": "경제", "keyword": "증시 금리"},
        {"category": "사회", "keyword": "사회 복지"},
        {"category": "IT과학", "keyword": "AI 반도체"}
    ]
    
    print("🚀 [NewsNow] 대규모 데이터 벌크업 파이프라인 가동!")
    start_time = time.time()

    for task in tasks:
        cat = task['category']
        kw = task['keyword']
        
        print(f"\n📂 [{cat}] 카테고리 수집 시작 (검색어: {kw})")
        run_news_now_pipeline(keyword=kw, count=5, category=cat)
        
        print(f"☕ {cat} 섹션 완료. 다음 작업을 위해 10초간 대기합니다...")
        time.sleep(10)

    end_time = time.time()
    elapsed = (end_time - start_time) / 60
    print(f"\n✨ [벌크업 완료] 총 소요 시간: {elapsed:.2f}분")
