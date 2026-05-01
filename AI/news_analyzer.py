"""기사 본문을 쉬운 레벨 텍스트, 퀴즈, 하이라이트로 재구성하는 AI 분석 모듈."""

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
    """Gemini를 이용해 기사 분석 결과를 JSON 구조로 반환하는 래퍼."""

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
    def analyze_and_reconstruct(self, news_text, title=""):
        """
        뉴스 본문을 받아 4단계 난이도로 재구성하고,
        퀴즈/하이라이트까지 한 번에 생성합니다.
        """
        article_type = self._detect_article_type(title, news_text)
        article_type_guide = self._build_article_type_guide(article_type)
        prompt = f"""
        너는 독해 교육 서비스 'NewsNow'의 시니어 에디터야. 
        제공된 [기사 본문]을 바탕으로 응답하되, 아래 [🚨 최종 운영 규칙]을 엄격히 준수해줘.

        [기사 제목]
        {title}

        [기사 본문]
        {news_text}

        [기사 유형]
        {article_type_guide}

        [🚨 최종 운영 규칙]
        1. **사실 강도 및 용어 통일**: 원문의 '갈등'은 모든 레벨에서 '갈등' 혹은 '어려움'으로 표현하고, 절대 '전쟁/폭탄/긴장'으로 격상하지 마. 
        2. **상위 레벨(Lv.3~4) 한자어 다이어트**: 전문성은 유지하되 '현저히', '무용지물', '실효성', '시계 제로' 같은 딱딱한 한자어나 원문 전용 비유를 지양하고 풀어서 설명해.
        3. **퀴즈 4지선다 고정**: 모든 퀴즈는 반드시 **4개의 선택지**로만 구성해.
        4. **선택지 길이 균형**: 특히 'summary' 퀴즈에서 정답만 길어지지 않도록 모든 선택지의 글자 수를 비슷하게 맞춰.
        5. **메타 데이터 삭제**: 기자명, 매체명 등 출처 정보는 1%도 남기지 마.
        6. **핵심 단어 추출 (Highlights)**: 각 레벨 본문에 실제로 등장하는 단어 중 사용자가 어려워할 만한 경제/시사 용어 4~6개를 레벨별로 따로 추출해. 사전적 정의가 아닌, 그 레벨 본문 [맥락]에 맞춘 아주 쉬운 풀이(툴팁용)를 제공해줘.

        [📊 레벨별 가이드]
        - level_1 (입문): 5~6문장. 초등학생이 핵심 사건과 결과를 이해할 수 있게 쉬운 단어로 설명해.
        - level_2 (초급): 6~8문장. 사건의 배경, 이유, 결과를 빠뜨리지 말고 순서대로 설명해.
        - level_3 (중급): 8~10문장. 핵심 주장과 근거, 맥락을 균형 있게 담아라. 기사체 문장을 유지하되 추상적 한자어 나열은 피하고 풀어서 설명해.
        - level_4 (전문): 10~12문장. 원문의 핵심 논지와 근거, 의미를 충분히 전달하는 '심화 재구성본'으로 써라. '확인되었다' 같은 단정 대신 '분석된다', '해석된다'를 사용하고, 원문 표현을 복사하지 말고 너의 문장으로 새로 써.
        - 모든 레벨은 "핵심 사건/주장 → 왜 그런지 → 어떤 영향이 있는지 → 무엇을 기억하면 되는지" 흐름이 보이게 작성해.
        - 특히 칼럼/사설/기고문은 원문의 문제의식, 근거 사례, 결론 또는 제언이 빠지지 않게 작성해. 단순 주장 한 줄 요약으로 끝내면 안 된다.
        - 칼럼/사설/기고문일 때는 level_1도 단순 감상문처럼 쓰지 말고, 아래 3요소를 반드시 포함해:
          1) 필자가 가장 중요하게 말하는 주장 1개
          2) 그 주장을 뒷받침하는 근거 또는 사례 2개 이상
          3) 마지막에 독자에게 남기는 결론 또는 제안 1개
        - 칼럼/사설/기고문일 때는 level_1에서조차 "누가 무엇을 비판하거나 요구하는지"가 분명히 드러나야 하며, "좋아요/필요해요" 수준의 뭉뚱그린 설명으로 끝내면 안 된다.
        - 칼럼/사설/기고문일 때는 원문에 있는 핵심 정책명, 노선명, 제도명, 지역명 같은 구체 명사를 가능하면 1~2개는 남겨서 맥락이 흐려지지 않게 해.

        [📝 퀴즈 구성 (어휘/맥락/요약)]
        - 퀴즈는 각 레벨 본문을 읽은 학생이 바로 풀 수 있어야 한다.
        - 현재 레벨 본문에 실제로 등장하지 않는 단어, 표현, 고유명사로 문제를 내면 안 된다.
        - 특히 vocabulary 퀴즈는 반드시 그 레벨 본문에 실제 등장한 단어만 사용해야 한다.
        - vocabulary 퀴즈의 정답 단어는 문제 문장(question) 안에 작은따옴표(' ')로 반드시 직접 써라. 예: "글에 나온 '자립'의 뜻은?"
        - vocabulary 퀴즈에서 정답 단어가 보기의 뜻풀이로만 숨어 있고, question 문장에는 안 나오면 실패로 간주한다.
        - 각 레벨마다 아래 3문항을 따로 만들어라.
        1. vocabulary: 그 레벨 본문에 실제 등장한 핵심 단어 1개를 묻기. (4지선다)
        2. context: 그 레벨 본문에 드러난 인과관계를 묻기. (4지선다)
        3. summary: 그 레벨 본문의 전체 주제를 묻기. (4지선다, 보기 길이 균등화)

        [JSON 출력 규격]
        {{
            "levels": {{ "level_1": "...", "level_2": "...", "level_3": "...", "level_4": "..." }},
            "quizzes": {{
                "level_1": [
                    {{ "type": "vocabulary", "question": "...", "options": ["1", "2", "3", "4"], "answer": 0, "explanation": "..." }},
                    {{ "type": "context", "question": "...", "options": ["1", "2", "3", "4"], "answer": 0, "explanation": "..." }},
                    {{ "type": "summary", "question": "...", "options": ["1", "2", "3", "4"], "answer": 0, "explanation": "..." }}
                ],
                "level_2": [
                    {{ "type": "vocabulary", "question": "...", "options": ["1", "2", "3", "4"], "answer": 0, "explanation": "..." }},
                    {{ "type": "context", "question": "...", "options": ["1", "2", "3", "4"], "answer": 0, "explanation": "..." }},
                    {{ "type": "summary", "question": "...", "options": ["1", "2", "3", "4"], "answer": 0, "explanation": "..." }}
                ],
                "level_3": [
                    {{ "type": "vocabulary", "question": "...", "options": ["1", "2", "3", "4"], "answer": 0, "explanation": "..." }},
                    {{ "type": "context", "question": "...", "options": ["1", "2", "3", "4"], "answer": 0, "explanation": "..." }},
                    {{ "type": "summary", "question": "...", "options": ["1", "2", "3", "4"], "answer": 0, "explanation": "..." }}
                ],
                "level_4": [
                    {{ "type": "vocabulary", "question": "...", "options": ["1", "2", "3", "4"], "answer": 0, "explanation": "..." }},
                    {{ "type": "context", "question": "...", "options": ["1", "2", "3", "4"], "answer": 0, "explanation": "..." }},
                    {{ "type": "summary", "question": "...", "options": ["1", "2", "3", "4"], "answer": 0, "explanation": "..." }}
                ]
            }},
            "highlights": {{
                "level_1": [
                    {{ "word": "단어", "definition": "level_1 본문 맥락에 맞춘 쉬운 풀이" }}
                ],
                "level_2": [
                    {{ "word": "단어", "definition": "level_2 본문 맥락에 맞춘 쉬운 풀이" }}
                ],
                "level_3": [
                    {{ "word": "단어", "definition": "level_3 본문 맥락에 맞춘 쉬운 풀이" }}
                ],
                "level_4": [
                    {{ "word": "단어", "definition": "level_4 본문 맥락에 맞춘 쉬운 풀이" }}
                ]
            }}
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

    @retry(
        retry=retry_if_exception(is_retryable_error),
        wait=wait_random_exponential(multiplier=1, max=120),
        stop=stop_after_attempt(5),
        reraise=True,
        before_sleep=lambda retry_state: print(f"⏳ [API 할당량 초과] {retry_state.next_action.sleep:.1f}초 후 재시도합니다... (시도 {retry_state.attempt_number}/5)")
    )
    def regenerate_vocabulary_quiz(self, level_text, highlights, title=""):
        """문제가 어색하거나 규칙을 어긴 vocabulary 퀴즈 1개만 다시 생성한다."""
        highlight_lines = []
        if isinstance(highlights, list):
            for item in highlights:
                if not isinstance(item, dict):
                    continue
                word = str(item.get("word", "")).strip()
                definition = str(item.get("definition", "")).strip()
                if word and definition:
                    highlight_lines.append(f"- {word}: {definition}")

        highlight_block = "\n".join(highlight_lines) if highlight_lines else "- 사용 가능한 하이라이트 없음"
        prompt = f"""
        너는 독해 교육 서비스 'NewsNow'의 시니어 에디터야.
        아래 [레벨 본문]과 [하이라이트 후보]를 보고 vocabulary 퀴즈 1개만 다시 만들어라.

        [기사 제목]
        {title}

        [레벨 본문]
        {level_text}

        [하이라이트 후보]
        {highlight_block}

        [규칙]
        - 반드시 레벨 본문에 실제로 등장하는 단어 1개만 정답어로 사용해.
        - 가능하면 [하이라이트 후보]에 있는 단어를 우선 사용해.
        - 문제 문장(question) 안에 정답 단어를 작은따옴표(' ')로 직접 넣어.
        - 선택지는 반드시 4개.
        - 정답 위치를 고정하지 마. 자연스럽게 섞어.
        - 오답 3개는 너무 뻔한 장난 답이 아니라, 초등학생이 헷갈릴 수 있는 짧고 그럴듯한 뜻풀이로 만들어.
        - 각 선택지는 한 문장 길이로 짧게 써.
        - explanation은 왜 그 뜻이 맞는지 한두 문장으로 설명해.

        [JSON 출력]
        {{
          "type": "vocabulary",
          "question": "...",
          "options": ["...", "...", "...", "..."],
          "answer": 0,
          "explanation": "..."
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
                raise e
            print(f"vocabulary 퀴즈 재생성 실패: {e}")
            return None

    def _detect_article_type(self, title, news_text):
        source = f"{title} {news_text[:400]}".lower()
        opinion_markers = [
            "[칼럼]", "칼럼", "사설", "기고", "오피니언", "시론", "논단", "기자수첩",
        ]
        if any(marker in source for marker in opinion_markers):
            return "opinion"
        return "straight"

    def _build_article_type_guide(self, article_type):
        if article_type == "opinion":
            return (
                "이 글은 칼럼/사설/기고 성격일 가능성이 높다. "
                "따라서 level_2~4에서는 필자의 핵심 주장, 그 주장을 뒷받침하는 근거나 사례, "
                "마지막 결론 또는 제언을 빠뜨리지 말고 설명해야 한다."
            )
        return (
            "이 글은 일반 기사 성격일 가능성이 높다. "
            "따라서 사건의 발생, 배경, 주요 쟁점, 결과와 영향이 균형 있게 드러나야 한다."
        )

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
