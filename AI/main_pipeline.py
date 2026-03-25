import time
import json
from news_crawler import NaverNewsCrawler
from news_analyzer import NewsAnalyzer

def run_news_now_pipeline(keyword="반도체", count=3):
    """
    네이버에서 뉴스를 수집하여 AI로 분석하고 최종 JSON으로 저장하는 통합 프로세스입니다.
    """
    # 1. 객체 초기화
    crawler = NaverNewsCrawler()
    analyzer = NewsAnalyzer()
    
    print(f"🚀 [NewsNow] '{keyword}' 키워드로 자동 수집 및 분석을 시작합니다. (대상: {count}건)")
    
    # 2. 뉴스 검색 및 메타데이터 가져오기
    news_list = crawler.get_news(query=keyword, display=count)
    
    if not news_list:
        print("❌ 검색 결과가 없습니다. API 설정을 확인하세요.")
        return

    final_results = []

    # 3. 각 뉴스별로 본문 추출 및 AI 분석 진행
    for i, news in enumerate(news_list):
        print(f"\n--- 🔄 [{i+1}/{len(news_list)}] 처리 중 ---")
        print(f"제목: {news['title']}")
        
        # [2단계] 본문 추출
        body_text = crawler.extract_body(news['naver_link'])
        
        if not body_text or len(body_text) < 200:
            print(f"⚠️ 본문이 너무 짧거나 추출에 실패했습니다. (건너뜀)")
            continue
            
        print(f"✅ 본문 추출 완료 ({len(body_text)}자). AI 분석 엔진 가동...")
        
        # [3단계] AI 분석 (우리가 만든 V5.5 엔진)
        # 429 할당량 방지를 위해 분석 전에 약간의 대기를 가질 수 있습니다.
        analysis_result = analyzer.analyze_and_reconstruct(body_text)
        
        if analysis_result:
            # 원본 메타데이터(제목, 링크 등)를 결과에 합쳐주면 유나님이 DB 넣기 더 좋습니다.
            analysis_result['meta'] = {
                "title": news['title'],
                "url": news['naver_link'],
                "pub_date": news['pub_date']
            }
            final_results.append(analysis_result)
            print(f"✨ 분석 성공! 하이라이트 {len(analysis_result['highlights'])}개 추출됨.")
        else:
            print(f"❌ AI 분석 중 에러가 발생했습니다.")

        # 4. 할당량 보호 (Free Tier 권장: 10초 대기)
        if i < len(news_list) - 1:
            print(f"⏳ API 보호를 위해 10초간 대기합니다...")
            time.sleep(10)

    # 4. 최종 결과 저장
    output_filename = f"final_learning_materials_{int(time.time())}.json"
    with open(output_filename, "w", encoding="utf-8") as f:
        json.dump(final_results, f, indent=4, ensure_ascii=False)
        
    print(f"\n✅ 모든 작업 완료! 총 {len(final_results)}개의 학습 데이터가 '{output_filename}'에 저장되었습니다.")

if __name__ == "__main__":
    # 팀장님이 원하는 키워드로 바로 테스트해보세요!
    run_news_now_pipeline(keyword="삼성전자 HBM", count=2)