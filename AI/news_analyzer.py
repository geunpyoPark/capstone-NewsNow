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

class InvalidAIOutputError(ValueError):
    """재시도하면 개선될 수 있는 AI 출력 품질 오류."""

def is_retryable_error(exception):
    """429(할당량 초과) 및 503(서버 과부하) 에러인 경우에 재시도합니다."""
    if isinstance(exception, InvalidAIOutputError):
        return True
    error_msg = str(exception).lower()
    retryable_keywords = ["429", "resource_exhausted", "quota", "503", "unavailable", "high demand"]
    return any(keyword in error_msg for keyword in retryable_keywords)

def contains_invalid_replacement_char(value):
    """AI 응답에 깨진 문자(�)가 섞였는지 재귀적으로 확인한다."""
    if isinstance(value, str):
        return "\ufffd" in value
    if isinstance(value, dict):
        return any(contains_invalid_replacement_char(item) for item in value.values())
    if isinstance(value, list):
        return any(contains_invalid_replacement_char(item) for item in value)
    return False

def contains_disallowed_editorial_phrase(value):
    """뉴스 재구성에 부적절한 홍보성/추론성 표현을 확인한다."""
    disallowed_phrases = [
        "나눔의 의미를 다졌",
        "의지를 보였",
        "사회적 책임을 다하기 위해",
        "세상을 아름답게",
        "관측이 지배적",
        "힘을 얻고 있",
        "논쟁을 불러일으",
    ]
    if isinstance(value, str):
        return any(phrase in value for phrase in disallowed_phrases)
    if isinstance(value, dict):
        return any(contains_disallowed_editorial_phrase(item) for item in value.values())
    if isinstance(value, list):
        return any(contains_disallowed_editorial_phrase(item) for item in value)
    return False

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
        6. **핵심 단어 추출 (Highlights)**: 각 레벨 본문에 실제로 등장하는 단어 중 사용자가 어려워할 만한 경제/시사/사회 제도/전문 용어 4~6개를 레벨별로 따로 추출해. 사전적 정의가 아닌, 그 레벨 본문 [맥락]에 맞춘 아주 쉬운 풀이(툴팁용)를 제공해줘. "안정적인", "필요한", "어려운", "주거 환경", "교육 기회"처럼 평범한 형용사·생활 표현은 절대 하이라이트하지 마.
        7. **원문 사실 보존**: 원문에 직접 나오지 않은 원인, 평가, 전망, 수치, 시장 반응, 산업 해석을 새로 만들지 마. 모든 문장은 [기사 본문]에 근거해야 한다.
        8. **AI 사견 금지**: "해석됩니다", "분석됩니다", "관측됩니다", "지배적입니다", "힘을 얻고 있습니다", "논쟁을 불러일으켰습니다" 같은 해설형 표현은 원문에 같은 취지의 근거가 있을 때만 써라. 근거가 없으면 단정하거나 추론하지 마.
        9. **홍보성 문장 금지**: "나눔의 의미를 다졌다", "의지를 보였다", "사회적 책임을 다하기 위해", "세상을 아름답게"처럼 원문보다 좋게 포장하는 표현은 원문 인용이 아니면 쓰지 마.
        10. **문자 품질**: 깨진 문자, 대체 문자(�), 의미 없는 기호를 절대 포함하지 마.
        11. **레벨별 하이라이트 난이도**: level_1~2는 쉬운 핵심어도 허용하지만, level_3~4에서는 '안정적인', '주거 환경', '경기', '협업'처럼 배경지식 없이 알 수 있는 일반어를 피하고 '해상풍력', '협약식', '카스트 제도', '달리트', '재정 건전성', '창조적 파괴', '산학협력', '시장 지배적 기업'처럼 본문 이해에 필요한 제도·산업·시사 용어를 우선 추출해.

        [📊 레벨별 가이드]
        - level_1 (입문): 4~5문장. 한 문장은 짧게 쓰고, 어려운 개념은 한 번에 하나만 소개해. 핵심은 "누가 무엇을 했는지", "누구에게 도움이 되는지", "무엇이 좋아지는지"만 남겨라. 감정 표현은 1문장 이내로 제한하고, 설명이 길어지면 과감히 줄여라.
        - level_2 (초급): 6~7문장. level_1보다 배경과 이유를 조금 더 설명해. 어려운 용어를 쓰면 바로 쉬운 풀이를 붙여라. 예: "카스트 제도는 사람을 태어난 집안에 따라 나누는 제도다." 단체명, 금액, 사용처는 원문에 있으면 포함해도 된다.
        - level_3 (중급): 8~10문장. level_2와 차이가 분명해야 한다. 기사체 흐름으로 "시점/주체/행동/금액 또는 규모/지원 대상/사용처/관련 발언 또는 배경"을 순서대로 정리해라. 날짜, 기관명, 인물명, 구체 수치는 원문에 있으면 유지하되, 원문에 없는 평가나 감상으로 문단을 마무리하지 마.
        - level_4 (전문): 10~12문장. 원문의 핵심 사실, 배경, 이해관계, 수치, 원문에 제시된 전망을 가장 많이 보존하는 '원문 충실형 심화 재작성'으로 써라. 더 똑똑한 해설을 덧붙이는 단계가 아니라, 원문을 훼손하지 않으면서 문장 구조와 어려운 표현을 읽기 좋게 정리하는 단계다. 전문 용어, 직함, 기관명, 사업명은 원문에 있으면 유지하되, 원문에 없는 새로운 인과관계, 기업 의도, 산업 전망, 홍보성 평가를 추가하지 마.
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
        - 단, level_1 또는 level_2에서 학생이 어려워할 만한 핵심 단어가 충분하지 않으면 억지로 vocabulary 문제를 만들지 말고, 본문 내용을 이해했는지 확인하는 context형 문제로 대체해도 된다.
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
            result = json.loads(response.text)
            if contains_invalid_replacement_char(result):
                raise InvalidAIOutputError("AI 응답에 깨진 문자(�)가 포함되어 있습니다.")
            if contains_disallowed_editorial_phrase(result):
                raise InvalidAIOutputError("AI 응답에 홍보성 또는 추론성 표현이 포함되어 있습니다.")
            return result
            
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

    @retry(
        retry=retry_if_exception(is_retryable_error),
        wait=wait_random_exponential(multiplier=1, max=120),
        stop=stop_after_attempt(5),
        reraise=True,
        before_sleep=lambda retry_state: print(f"⏳ [API 할당량 초과] {retry_state.next_action.sleep:.1f}초 후 재시도합니다... (시도 {retry_state.attempt_number}/5)")
    )
    def regenerate_context_quiz(self, level_text, title=""):
        """쉬운 레벨에서 vocabulary 대신 사용할 핵심 내용 파악형 퀴즈 1개를 다시 생성한다."""
        prompt = f"""
        너는 독해 교육 서비스 'NewsNow'의 시니어 에디터야.
        아래 [레벨 본문]을 보고 학생이 글의 핵심 내용을 제대로 이해했는지 확인하는 context 퀴즈 1개만 만들어라.

        [기사 제목]
        {title}

        [레벨 본문]
        {level_text}

        [규칙]
        - vocabulary 문제가 아니라, 글의 맥락과 핵심 내용을 이해했는지 묻는 문제여야 한다.
        - 문제 문장은 가능하면 "이 글의 핵심 내용은 무엇인가요?" 또는 이와 매우 비슷한 형태로 만들어.
        - 단순 세부 사실 1개를 묻지 말고, 글 전체를 읽었는지 판단할 수 있는 문제여야 한다.
        - 선택지는 반드시 4개.
        - 정답 위치를 고정하지 마.
        - 오답은 본문과 일부 비슷해 보여도 핵심 주제, 원인, 결과, 의미 중 하나를 틀리게 만들어.
        - 초등학생도 읽을 수 있도록 짧고 쉬운 문장으로 써.
        - explanation은 왜 정답이 맞는지 한두 문장으로 설명해.

        [JSON 출력]
        {{
          "type": "context",
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
            print(f"context 퀴즈 재생성 실패: {e}")
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
