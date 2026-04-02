import os
import requests
from bs4 import BeautifulSoup
from dotenv import load_dotenv

# .env 파일에서 환경 변수 로드
load_dotenv()

class NaverNewsCrawler:
    def __init__(self):
        self.client_id = os.getenv("NAVER_CLIENT_ID")
        self.client_secret = os.getenv("NAVER_CLIENT_SECRET")
        self.search_url = "https://openapi.naver.com/v1/search/news.json"
        
        # API 키가 제대로 설정되었는지 확인
        if not self.client_id or not self.client_secret:
            raise ValueError("네이버 API 키가 .env 파일에 설정되지 않았습니다! 확인해주세요.")

    def get_news(self, query, display=5, start=1):
        """
        [1단계] 네이버 검색 API를 통해 뉴스의 메타데이터(제목, 링크 등)를 가져옵니다.
        """
        headers = {
            "X-Naver-Client-Id": self.client_id,
            "X-Naver-Client-Secret": self.client_secret
        }
        params = {
            "query": query,      # 검색어
            "display": display,  # 가져올 기사 수
            "start": start,      # 검색 시작 위치 (페이징)
            "sort": "date"       # 최신순 정렬
        }

        try:
            response = requests.get(self.search_url, headers=headers, params=params)
            response.raise_for_status() # HTTP 에러 발생 시 예외 던짐
            
            data = response.json()
            news_list = []
            
            for item in data.get('items', []):
                # 네이버 API는 검색어 강조를 위해 <b> 태그를 포함하므로 제거
                title = item['title'].replace('<b>', '').replace('</b>', '').replace('&quot;', '"')
                
                news_list.append({
                    "title": title,
                    "original_link": item['originallink'], # 언론사 원문 링크
                    "naver_link": item['link'],           # 네이버 뉴스 자체 링크 (크롤링에 유리)
                    "pub_date": item['pubDate']
                })
          
            return news_list
            
        except requests.exceptions.RequestException as e:
            print(f"네이버 API 요청 중 에러 발생: {e}")
            return []

    def extract_body(self, url):
        """
        [2단계] 링크에 접속하여 기사 본문 텍스트만 추출합니다. (찌꺼기 제거 최적화)
        """
        try:
            # 봇 차단을 막기 위한 User-Agent 헤더 설정
            headers = {
                "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
            }
            response = requests.get(url, headers=headers, timeout=10)
            response.raise_for_status() 

            soup = BeautifulSoup(response.text, 'html.parser')
            
            # --- 본문 영역 탐색 (순서가 매우 중요합니다!) ---
            # 1순위: 네이버 뉴스 모바일/PC 순수 본문 ID (UI 버튼 찌꺼기 방지)
            content = soup.find('div', id='dic_area') 
            
            # 2순위: 그 외 일반 언론사 사이트를 위한 예비 로직
            if not content:
                content = soup.find('article')
            if not content:
                content = soup.find('div', id='articleBodyContents') 
            if not content:
                content = soup.find('div', class_='article_body')
            if not content:
                content = soup.find('div', itemprop='articleBody')

            # --- 텍스트 정제 ---
            if content:
                # 본문 내에 삽입된 스크립트나 스타일 태그는 제거
                for script in content(["script", "style"]):
                    script.extract()
                
                # HTML 태그를 벗겨내고 순수 텍스트만 추출 (공백 정리 포함)
                clean_text = content.get_text(separator=' ', strip=True)
                return clean_text
            else:
                return None 

        except Exception as e:
            print(f"[{url}] 본문 추출 중 에러 발생: {e}")
            return None


# ==========================================
# 실행 테스트
# ==========================================
if __name__ == "__main__":
    crawler = NaverNewsCrawler()
    
    print("🚀 뉴스 수집 및 본문 추출 테스트 시작...\n")
    
    # 1. 뉴스 검색
    search_keyword = "금리"
    results = crawler.get_news(query=search_keyword, display=1)
    
    if results:
        target_news = results[0]
        print(f"--- 📌 [1단계] 메타데이터 수집 완료 ---")
        print(f"제목: {target_news['title']}")
        print(f"네이버 링크: {target_news['naver_link']}\n")
        
        # 2. 본문 추출 시도 (크롤링 성공률이 높은 naver_link 사용)
        print(f"--- 🔍 [2단계] 본문 추출 시도 중... ---")
        extracted_text = crawler.extract_body(target_news['naver_link'])
        
        if extracted_text:
            print(f"✅ 추출 성공! (총 글자 수: {len(extracted_text)}자)")
            print(f"📝 본문 미리보기 (앞 300자):\n{extracted_text[:300]}...")
            print(f"\n💡 시니어 체크: '구독하기', '기사 스크랩' 같은 버튼 글씨가 사라졌는지 확인해 보세요!")
        else:
            print("❌ 본문을 추출하지 못했습니다.")
    else:
        print("뉴스를 가져오지 못했습니다. API 키 설정 등을 확인해 주세요.")