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

# 1. 환경 설정 및 모델 로드
load_dotenv()
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
# 2026년 기준 가장 응답 속도가 빠른 Flash 모델을 사용합니다.
gemini_model = genai.GenerativeModel('gemini-flash-latest') 

# [필터링] 학생용 서비스에 부적절한 가십성/광고성 키워드 목록
BLACKLIST_KEYWORDS = [
    "레이싱모델", "포토타임", "화보", "출시회", "홍보모델", 
    "포즈", "몸매", "노출", "클릭베이트", "이벤트"
]

def validate_analysis(result):
    """AI 분석 결과 필수 데이터 검증"""
    required_keys = ["levels", "quizzes", "highlights"]
    return all(k in result and result[k] for k in required_keys)

def generate_comic_scenarios(title, text):
    """[핵심 수정] 초등학교 선생님 모드로 아주 쉬운 단어만 사용하여 시나리오 생성"""
    prompt = f"""
    당신은 초등학교 저학년 아이들에게 뉴스를 설명해주는 아주 친절한 선생님입니다.
    아래 정보를 바탕으로 4컷 만화 시나리오를 만드세요.
    
    [뉴스 정보]
    제목: {title}
    내용(어려운 요약본): {text}
    
    [단어 변경 규칙 - 반드시 지키세요!]
    - '추경/예산' -> '나라의 비상금', '따로 모아둔 돈'
    - '포퓰리즘' -> '인기를 얻으려고 하는 일'
    - '금리/증시' -> '은행 이자', '주식 시장'
    - '공방/갈등' -> '말다툼', '서로 다른 생각'
    - 모든 한자어와 전문 용어를 8살 아이가 이해할 수 있는 쉬운 우리말로 바꾸세요.
    
    [제작 지침]
    1. 4개의 문장은 무조건 짧고 다정하게 작성하세요. (~해요, ~있어요 체 사용)
    2. 'scenario'는 이미지 생성 AI를 위한 영어 묘사로, 기사 내용(인물, 장소)을 구체적으로 적으세요.
    3. 화풍은 'Clean and friendly news illustration, professional, bright colors'로 고정합니다.
    
    반드시 아래 JSON 형식으로만 답변하세요:
    [
      {{"text": "초등학생 수준의 아주 쉬운 문장1", "scenario": "Detailed English description..."}},
      {{"text": "초등학생 수준의 아주 쉬운 문장2", "scenario": "..."}},
      {{"text": "초등학생 수준의 아주 쉬운 문장3", "scenario": "..."}},
      {{"text": "초등학생 수준의 아주 쉬운 문장4", "scenario": "..."}}
    ]
    """
    response = gemini_model.generate_content(prompt)
    # JSON 파싱 안정성을 위한 전처리
    json_str = response.text.replace('```json', '').replace('```', '').strip()
    return json.loads(json_str)

def save_to_db(conn, cursor, news):
    """DB 저장 (이미지 경로 및 카테고리 포함)"""
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

def run_news_now_pipeline(keyword, count, category):
    """카테고리별 뉴스 수집 및 처리 메인 루프"""
    crawler = NaverNewsCrawler()
    analyzer = NewsAnalyzer()
    comic_gen = ComicGenerator(font_path="my_font.ttf") # 근표 님의 M4 Pro 최적화 엔진
    
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

                        # [클린 필터링] 가십성 기사 제외
                        if any(black in news['title'] for black in BLACKLIST_KEYWORDS):
                            print(f"⏩ [필터링] 제외: {news['title'][:15]}...")
                            continue

                        body = crawler.extract_body(news['naver_link'])
                        if not body or len(body) < 200: continue
                        
                        print(f"\n🧠 [{category}] 뉴스 분석 중: {news['title'][:25]}...")
                        try:
                            analysis = analyzer.analyze_and_reconstruct(body[:2500])
                            if not (analysis and validate_analysis(analysis)): continue

                            levels = analysis.get('levels', {})
                            l1_text = levels.get('level1') or levels.get('1') or news['title']

                            print(f"🎨 M4 Pro 카드뉴스 제작 중 (선생님 모드 가동!)...")
                            try:
                                # 제목과 분석된 텍스트를 함께 전달하여 맥락과 어휘를 동시에 잡음
                                scenarios = generate_comic_scenarios(news['title'], l1_text)
                                comic_img = comic_gen.generate_news_card(scenarios)
                                
                                os.makedirs("static/comics", exist_ok=True)
                                # 파일 충돌 방지를 위한 타임스탬프 파일명
                                img_path = f"static/comics/{int(time.time()*100)}.png"
                                comic_img.save(img_path)
                                analysis['comic_path'] = img_path
                                print(f"✅ 카드뉴스 생성 완료: {img_path}")
                            except Exception as e:
                                print(f"⚠️ 이미지 생성 오류: {e}")
                                analysis['comic_path'] = None

                            analysis['meta'] = {
                                "title": news['title'], "url": news['naver_link'],
                                "pub_date": news['pub_date'], "category": category
                            }
                            save_to_db(conn, cur, analysis)
                            results_count += 1
                        except Exception as e:
                            print(f"⚠️ 처리 에러: {e}")
                            if is_retryable_error(e): time.sleep(60)
                        
                        time.sleep(10) # API 안전 대기
                    start_idx += 10
    except Exception as e:
        print(f"❌ 파이프라인 치명적 오류: {e}")

def is_article_exists(cursor, url):
    cursor.execute("SELECT 1 FROM news_articles WHERE url = %s", (url,))
    return cursor.fetchone() is not None

# ==========================================
# 실행부: 전 카테고리 자동 순회
# ==========================================
if __name__ == "__main__":
    tasks = [
        {"category": "정치", "keyword": "국회 정책"},
        {"category": "경제", "keyword": "어린이 경제"},
        {"category": "사회", "keyword": "우리네 이웃"},
        {"category": "IT과학", "keyword": "AI 반도체 기술"}
    ]
    
    print("🚀 NewsNow 자동화 공장 가동")
    for task in tasks:
        print(f"\n📂 [{task['category']}] 섹션 수집 시작...")
        run_news_now_pipeline(keyword=task['keyword'], count=3, category=task['category'])
        time.sleep(5)