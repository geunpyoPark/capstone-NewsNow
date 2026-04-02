import os
import json
import time
import logging
from dotenv import load_dotenv
from google import genai
from google.genai import types
from tenacity import retry, wait_random_exponential, stop_after_attempt, retry_if_exception

# 로깅 설정 (시스템 로그 최소화)
logging.basicConfig(level=logging.WARNING)
logger = logging.getLogger(__name__)

# .env 파일 로드
load_dotenv()

def is_retryable_error(exception):
    """429(할당량 초과) 및 503(서버 과부하) 에러인 경우에 재시도합니다."""
    error_msg = str(exception).lower()
    retryable_keywords = ["429", "resource_exhausted", "quota", "503", "unavailable", "high demand"]
    return any(keyword in error_msg for keyword in retryable_keywords)

class NewsAnalyzer:
    def __init__(self):
        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key:
            raise ValueError("GEMINI_API_KEY가 .env 파일에 없습니다! 확인해주세요.")
        
        self.client = genai.Client(api_key=api_key)
        
        # 이전 실행 시 '200 OK'를 받았던 가장 안정적인 모델명으로 복구
        self.model_name = 'gemini-flash-latest'

    @retry(
        retry=retry_if_exception(is_retryable_error),
        # 지수 백오프에 랜덤성을 추가하여 서버 몰림 방지 (최대 120초까지 대기)
        wait=wait_random_exponential(multiplier=1, max=120), 
        stop=stop_after_attempt(5), 
        reraise=True, # 최종 실패 시 RetryError 대신 실제 예외를 던짐
        before_sleep=lambda retry_state: print(f"⏳ [API 할당량 초과] {retry_state.next_action.sleep:.1f}초 후 재시도합니다... (시도 {retry_state.attempt_number}/5)")
    )
    def analyze_and_reconstruct(self, news_text):
        """
        뉴스 본문을 받아 4단계 난이도로 재구성, 퀴즈 생성 및 핵심 단어 하이라이트를 추출합니다.
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
            response = self.client.models.generate_content(
                model=self.model_name,
                contents=prompt,
                config=types.GenerateContentConfig(
                    response_mime_type="application/json",
                )
            )
            return json.loads(response.text)
            
        except Exception as e:
            if is_retryable_error(e):
                raise e # retry가 잡을 수 있게 다시 던짐
            print(f"AI 분석 중 치명적 에러 발생: {e}")
            return None

# ==========================================
# 실행 테스트
# ==========================================
if __name__ == "__main__":
    analyzer = NewsAnalyzer()
    
    # 근표 님이 가져오신 생생한 뉴스 텍스트
    sample_text = """
    도널드 트럼프 미국 대통령이 향후 2~3주 동안 이란에 대한 강한 군사 타격을 이어가겠다고 밝혔습니다.
    트럼프 대통령은 현지시간 1일 백악관 대국민 연설에서 "앞으로 2~3주 동안 극도로 강력한 타격을 가할 것"이라고 말했습니다.
    트럼프 대통령은 "지금까지 이룬 진전 덕분에 군사적 목표를 매우 빠르게 달성할 수 있다"고 밝혔습니다.
    또 "핵심 전략적 목표들이 완수 단계에 가까워지고 있다"고 평가했습니다.
    트럼프 대통령은 이란 정권 교체를 언급하면서도 "그사이에 논의는 계속되고 있다"고 말해 협상이 진행 중이라고 밝혔습니다.
    다만 "이 기간 합의가 이뤄지지 않으면 주요 목표물을 주시하고 있다"며 "발전소 등을 매우 강력하게 동시에 타격할 것"이라고 경고했습니다.
    호르무즈 해협과 관련해서는 "미국에서 석유를 사거나 스스로 해협을 지켜라"고 말했습니다.
    이어 "뒤늦은 용기를 내라. 해협으로 가서 스스로 가져가고 지키고 활용하라"며 "이란은 사실상 초토화됐다"고 주장했습니다.
    트럼프 대통령의 이번 연설은 약 18분간 이어졌습니다.
    미국과 이스라엘이 이란에 대한 군사작전을 시작한 이후 트럼프 대통령이 생방송으로 대국민 연설을 한 것은 이번이 처음입니다.
    """
    
    print("🚀 뉴스 분석 시작...")
    result = analyzer.analyze_and_reconstruct(sample_text)
    
    import pprint
    pprint.pprint(result)
