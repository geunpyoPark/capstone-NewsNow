import os
import json
from dotenv import load_dotenv
from google import genai
from google.genai import types

# .env 파일 로드
load_dotenv()

class NewsAnalyzer:
    def __init__(self):
        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key:
            raise ValueError("GEMINI_API_KEY가 .env 파일에 없습니다! 확인해주세요.")
        
        # [신형 SDK 적용] Client 객체 생성
        self.client = genai.Client(api_key=api_key)
        
        # 최신 2.5 Flash 모델 사용
        self.model_name = 'gemini-2.5-flash'

    def analyze_and_reconstruct(self, news_text):
        """
        뉴스 본문을 받아 4단계 난이도로 재구성, 퀴즈 생성 및 핵심 단어 하이라이트를 추출합니다.
        (V5.5: 상위 레벨 순화, 4지선다 고정, 사실 강도 통일 + 하이라이트 보조 반영)
        """
        prompt = f"""
        너는 독해 교육 서비스 'NewsNow'의 시니어 에디터야. 
        제공된 [기사 본문]을 바탕으로 응답하되, 아래 [🚨 최종 운영 규칙]을 엄격히 준수해줘.

        [기사 본문]
        {news_text}

        [🚨 최종 운영 규칙]
        1. **사실 강도 및 용어 통일**: 원문의 '갈등'은 모든 레벨에서 '갈등' 혹은 '어려움'으로 표현하고, 절대 '전쟁/폭탄/긴장'으로 격상하지 마. 
        2. **상위 레벨(Lv.3~4) 한자어 다이어트**: 전문성은 유지하되 '현저히', '무용지물', '실효성', '시계 제로' 같은 딱딱한 한자어나 원문 전용 비유를 지양하고 풀어서 설명해.
        3. **퀴즈 4지선다 고정**: 모든 퀴즈는 반드시 **4개의 선택지**로만 구성해.
        4. **선택지 길이 균형**: 특히 'summary' 퀴즈에서 정답만 길어지지 않도록 모든 선택지의 글자 수를 비슷하게 맞춰.
        5. **메타 데이터 삭제**: 기자명, 매체명 등 출처 정보는 1%도 남기지 마.
        6. **핵심 단어 추출 (Highlights)**: 본문에 등장하는 단어 중 사용자가 어려워할 만한 경제/시사 용어 5~7개를 추출해. 사전적 정의가 아닌, 이 기사의 [맥락]에 맞춘 아주 쉬운 풀이(툴팁용)를 제공해줘.

        [📊 레벨별 가이드]
        - level_1 (입문): 4~5문장 압축. "외국 돈 값", "이자" 등 가장 쉬운 단어 사용. (가치(X) -> 값(O))
        - level_2 (초급): 상황 설명 중심. 어려운 경제 용어는 1개 이하로 제한.
        - level_3 (중급): 기사체 문장을 유지하되, 추상적인 한자어 나열을 피하고 '예측이 더 어려워졌다', '반복되는 위험 요인' 등으로 순화해서 서술해.
        - level_4 (전문): '심화 재구성본'의 성격. '확인되었다' 같은 단정 대신 '분석된다', '해석된다'를 사용하고, 원문 표현을 복사하지 말고 너의 문장으로 새로 써.

        [📝 퀴즈 구성 (어휘/맥락/요약)]
        1. vocabulary: '뉴노멀', '3고 현상' 등 대중적 핵심 키워드. (4지선다)
        2. context: 사건의 인과관계를 묻는 질문(예: 주된 이유는?). (4지선다)
        3. summary: 전체 주제 찾기. (4지선다, 보기 길이 균등화)

        [JSON 출력 규격]
        {{
            "levels": {{ "level_1": "...", "level_2": "...", "level_3": "...", "level_4": "..." }},
            "quizzes": [
                {{ "type": "vocabulary", "question": "...", "options": ["1", "2", "3", "4"], "answer": 0, "explanation": "..." }},
                {{ "type": "context", "question": "...", "options": ["1", "2", "3", "4"], "answer": 0, "explanation": "..." }},
                {{ "type": "summary", "question": "...", "options": ["1", "2", "3", "4"], "answer": 0, "explanation": "..." }}
            ],
            "highlights": [
                {{ "word": "단어", "definition": "이 기사의 맥락에 맞춘 쉬운 풀이" }}
            ]
        }}
        """

        try:
            print(f"🧠 {self.model_name} V5.5 최종 밸런스 패치 + 하이라이트 추출 중...")
            response = self.client.models.generate_content(
                model=self.model_name,
                contents=prompt,
                config=types.GenerateContentConfig(
                    response_mime_type="application/json",
                )
            )
            return json.loads(response.text)
            
        except Exception as e:
            print(f"AI 분석 중 에러 발생: {e}")
            return None

# ==========================================
# 실행 테스트
# ==========================================
if __name__ == "__main__":
    analyzer = NewsAnalyzer()
    
    sample_text = """
    장창민 산업부장 “원자재값이 폭등하고 환율과 금리까지 뛰어 경영 여건은 ‘시계 제로’인 상황입니다. 여기에다 미국·이란 전쟁과 미국의 관세 폭탄, 미·중 갈등 등 툭하면 터져 나오는 대외 변수는 이제 상수가 된 느낌이에요. 작년 말 세워놓은 올해 사업 계획은 일찌감치 책상 서랍에 넣어놨습니다.” 얼마 전 만난 대기업 최고경영자(CEO)는 이렇게 토로했다. 고물가·고금리·고환율 등 이른바 ‘3고(高)’는 ‘뉴노멀’이 됐고 생각하지도 못한 지정학적 변수가 잇따르면서 공들여 짜놓은 사업 계획이 쓸모없어졌다는 것이다.
    """
    
    result_json = analyzer.analyze_and_reconstruct(sample_text)
    
    if result_json:
        print("\n✅ AI 분석 및 JSON 생성 완료!\n")
        print(json.dumps(result_json, indent=4, ensure_ascii=False))