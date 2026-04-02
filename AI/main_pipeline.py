import os
import time
import json
import psycopg2
from psycopg2.extras import Json
from dotenv import load_dotenv
import google.generativeai as genai
from news_crawler import NaverNewsCrawler
from news_analyzer import NewsAnalyzer, is_retryable_error
from comic_generator import ComicGenerator

# 1. 환경 설정 로드
load_dotenv()

# Gemini 설정 (카드뉴스 시나리오 생성용)
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
gemini_model = genai.GenerativeModel('gemini-flash-latest')

def validate_analysis(result):
    """AI 분석 결과 필수 데이터 검증"""
    required_keys = ["levels", "quizzes", "highlights"]
    return all(k in result and result[k] for k in required_keys)

def generate_comic_scenarios(text):
    """Level 1 텍스트를 기반으로 4컷 시나리오 생성"""
    prompt = f"""
    아래 뉴스 요약본을 바탕으로 4컷 카드뉴스 시나리오를 만드세요.
    내용: {text}
    
    각 컷마다 [하단 문장]과 [그림 묘사(English)]를 생성하세요.
    반드시 아래 JSON 형식으로만 답변하세요:
    [
      {{"text": "문장1", "scenario": "English description"}},
      {{"text": "문장2", "scenario": "English description"}},
      {{"text": "문장3", "scenario": "English description"}},
      {{"text": "문장4", "scenario": "English description"}}
    ]
    """
    response = gemini_model.generate_content(prompt)
    json_str = response.text.replace('```json', '').replace('```', '').strip()
    return json.loads(json_str)

def is_article_exists(cursor, url):
    """DB에 해당 URL의 기사가 이미 존재하는지 확인합니다."""
    cursor.execute("SELECT 1 FROM news_articles WHERE url = %s", (url,))
    return cursor.fetchone() is not None

def save_to_db(conn, cursor, news):
    """DB 저장 (이미지 경로 포함)"""
    try:
        cursor.execute("""
            INSERT INTO news_articles (title, url, pub_date, category, comic_path)
            VALUES (%s, %s, %s, %s, %s)
            ON CONFLICT (url) DO NOTHING
            RETURNING id;
        """, (
            news['meta']['title'], 
            news['meta']['url'], 
            news['meta']['pub_date'], 
            news['meta'].get('category', '일반'),
            news.get('comic_path')
        ))
        
        result = cursor.fetchone()
        if not result: return 
        article_id = result[0]

        cursor.execute("INSERT INTO article_versions (article_id, levels) VALUES (%s, %s);", (article_id, Json(news['levels'])))
        cursor.execute("INSERT INTO article_assets (article_id, quizzes, highlights) VALUES (%s, %s, %s);", (article_id, Json(news['quizzes']), Json(news['highlights'])))

        conn.commit()
        print(f"✨ [DB] 저장 성공: {news['meta']['title'][:20]}...")
    except Exception as e:
        conn.rollback()
        print(f"❌ [DB] 저장 실패: {e}")

def run_news_now_pipeline(keyword="반도체", count=5, category="일반"):
    crawler = NaverNewsCrawler()
    analyzer = NewsAnalyzer()
    
    # 🎨 M4 Pro GPU 엔진 로드 (루프 밖에서 한 번만 실행)
    comic_gen = ComicGenerator(font_path="my_font.ttf") 
    
    conn_params = {
        "host": os.getenv("DB_HOST"), "database": os.getenv("DB_NAME"),
        "user": os.getenv("DB_USER"), "password": os.getenv("DB_PASSWORD"),
        "port": os.getenv("DB_PORT")
    }

    results_count = 0
    start_idx = 1

    try:
        with psycopg2.connect(**conn_params) as conn:
            with conn.cursor() as cur:
                while results_count < count:
                    news_list = crawler.get_news(query=keyword, display=10, start=start_idx)
                    if not news_list: break

                    for news in news_list:
                        if results_count >= count: break
                        if is_article_exists(cur, news['naver_link']): continue

                        body = crawler.extract_body(news['naver_link'])
                        if not body or len(body) < 200: continue
                        
                        print(f"\n🧠 기사 분석 중: {news['title'][:25]}...")
                        try:
                            analysis = analyzer.analyze_and_reconstruct(body[:2500])
                            if not (analysis and validate_analysis(analysis)): continue

                            # 레벨 1 텍스트 안전하게 추출하기
                            levels = analysis.get('levels', {})
                            l1_text = levels.get('level1') or levels.get('1') or levels.get('level_1')
                            
                            if not l1_text:
                                l1_text = list(levels.values())[0] if levels else news['title']

                            print(f"🎨 M4 Pro 카드뉴스 제작 중...")
                            try:
                                scenarios = generate_comic_scenarios(l1_text)
                                comic_img = comic_gen.generate_news_card(scenarios)
                                
                                os.makedirs("static/comics", exist_ok=True)
                                # 파일 이름 생성 (타임스탬프 활용)
                                img_path = f"static/comics/{int(time.time())}.png"
                                comic_img.save(img_path)
                                analysis['comic_path'] = img_path
                                print(f"✅ 카드뉴스 생성 완료: {img_path}")
                            except Exception as e:
                                print(f"⚠️ 이미지 생성 실패: {e}")
                                analysis['comic_path'] = None

                            analysis['meta'] = {
                                "title": news['title'], "url": news['naver_link'],
                                "pub_date": news['pub_date'], "category": category
                            }
                            
                            save_to_db(conn, cur, analysis)
                            results_count += 1
                        except Exception as e:
                            print(f"⚠️ 에러 발생: {e}")
                            if is_retryable_error(e): time.sleep(60)
                        
                        time.sleep(15)
                    start_idx += 10
    except Exception as e:
        print(f"❌ 파이프라인 중단: {e}")

if __name__ == "__main__":
    print("🚀 NewsNow 자동화 파이프라인 가동!")
    run_news_now_pipeline(keyword="AI 반도체", count=3, category="IT과학")
