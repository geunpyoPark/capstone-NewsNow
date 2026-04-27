"""뉴스 수집부터 분석, 스토리보드 생성, 만화 렌더링까지 묶는 AI 메인 파이프라인."""

import os
import time
import json
from pathlib import Path
from dotenv import load_dotenv
import google.generativeai as genai
from news_crawler import NaverNewsCrawler
from news_analyzer import NewsAnalyzer, is_retryable_error
from comic_generator import ComicGenerator
from image_storage import is_cloudinary_configured, upload_image_to_cloudinary
from ai_db import (
    ensure_comic_storyboards_table,
    get_db_connection,
    is_article_exists,
    save_news_result,
)

# 공통 환경변수와 Gemini 텍스트 모델을 초기화한다.
load_dotenv()
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
# 2026년 기준 가장 응답 속도가 빠른 Flash 모델을 사용합니다.
gemini_model = genai.GenerativeModel('gemini-flash-latest') 
BASE_DIR = Path(__file__).resolve().parent

# [필터링] 학생용 서비스에 부적절한 가십성/광고성 키워드 목록
BLACKLIST_KEYWORDS = [
    "레이싱모델", "포토타임", "화보", "출시회", "홍보모델", 
    "포즈", "몸매", "노출", "클릭베이트", "이벤트"
]

def validate_analysis(result):
    """분석 결과에 백엔드가 기대하는 최소 필드가 있는지 확인한다."""
    required_keys = ["levels", "quizzes", "highlights"]
    return all(k in result and result[k] for k in required_keys)

def validate_storyboard(storyboard):
    """이미지 생성 전에 4컷 스토리보드 JSON 구조를 검증한다."""
    required_root_keys = ["character_profile", "style_profile", "panels"]
    if not all(key in storyboard for key in required_root_keys):
        return False

    panels = storyboard.get("panels")
    if not isinstance(panels, list) or len(panels) != 4:
        return False

    required_panel_keys = ["scene", "emotion", "dialogues", "must_show", "avoid"]
    for panel in panels:
        if not all(key in panel and panel[key] for key in required_panel_keys):
            return False
        dialogues = panel.get("dialogues")
        if not isinstance(dialogues, list) or not (1 <= len(dialogues) <= 2):
            return False
        for dialogue in dialogues:
            if not isinstance(dialogue, dict):
                return False
            if not dialogue.get("speaker") or not dialogue.get("text"):
                return False
    return True

def resolve_level_1_text(levels, fallback_title):
    if not isinstance(levels, dict):
        return fallback_title
    return (
        levels.get("level_1")
        or levels.get("level1")
        or levels.get("1")
        or fallback_title
    )

def story_type_guide(story_type):
    guides = {
        "problem": {
            "panel_flow": "1컷: 핵심 사건 2컷: 원인 3컷: 문제점/영향 4컷: 대응/이해",
            "tone": "긴장감과 이해를 함께 주는 뉴스 설명 만화",
            "interaction_hint": "가능하면 3컷에서 아이와 설명해주는 인물 1명이 함께 나오거나, 아이의 질문과 짧은 답이 오가는 구도를 고려하세요.",
        },
        "policy_domestic": {
            "panel_flow": "1컷: 무엇이 바뀌었는지 2컷: 왜 바뀌었는지 3컷: 내 생활 영향 4컷: 기억할 핵심",
            "tone": "생활 변화가 쉽게 보이는 정책 설명 만화",
            "interaction_hint": "가능하면 3컷에서 아이와 생활 속 어른 또는 전문가 1명이 함께 나오고, 짧은 질문-응답 말풍선 2개를 우선 고려하세요.",
        },
        "policy_diplomacy": {
            "panel_flow": "1컷: 국제 상황에서 무슨 논의가 나왔는지 2컷: 왜 그런 논의가 필요한지 3컷: 우리나라와 안전에 어떤 의미가 있는지 4컷: 여러 나라가 어떻게 협의하는지",
            "tone": "외교와 안보를 차분하지만 또렷하게 설명하는 국제 뉴스 만화",
            "interaction_hint": "가능하면 2컷 또는 4컷에서 아이와 관계자/전문가/상징 인물 1명이 함께 나오고, 짧은 설명-반응 말풍선 2개를 우선 고려하세요.",
        },
        "discovery": {
            "panel_flow": "1컷: 신기한 포인트 2컷: 원리/배경 3컷: 왜 중요한지 4컷: 생활 연결",
            "tone": "호기심을 자극하는 과학/기술 설명 만화",
            "interaction_hint": "가능하면 2컷에서 아이와 설명해주는 인물 또는 장치 담당자 1명이 함께 나오고, 짧은 질문-응답 말풍선 2개를 고려하세요.",
        },
        "positive": {
            "panel_flow": "1컷: 흥미로운 시작 2컷: 배경 설명 3컷: 좋은 변화/감동 포인트 4컷: 따뜻한 정리",
            "tone": "희망적이고 따뜻한 변화가 느껴지는 뉴스 만화",
            "interaction_hint": "가능하면 3컷에서 아이와 도움을 주는 인물 1명이 함께 나오고, 짧은 반응 중심 말풍선 2개를 고려하세요.",
        },
    }
    return guides.get(story_type, guides["problem"])

def normalize_story_type(story_type):
    allowed_types = {"problem", "policy_domestic", "policy_diplomacy", "discovery", "positive"}
    normalized = str(story_type or "").strip().lower()
    return normalized if normalized in allowed_types else "problem"

def detect_story_type(title, text):
    """추가 API 호출 없이 제목/요약문 키워드만으로 뉴스 유형을 추정한다."""
    source = f"{title} {text}".lower()

    diplomacy_keywords = [
        "외교", "안보", "파병", "정상회담", "협의", "국방", "군사", "해협",
        "미국", "중국", "일본", "북한", "이란", "이스라엘", "나토", "유엔",
    ]
    discovery_keywords = [
        "연구", "기술", "ai", "인공지능", "과학", "실험", "발견", "개발", "반도체",
        "로봇", "우주", "배터리", "신기술",
    ]
    positive_keywords = [
        "회복", "성공", "성과", "지원 확대", "협력", "기부", "구조", "봉사", "훈훈",
        "개선", "복구", "완공", "확대",
    ]
    domestic_policy_keywords = [
        "정책", "지원", "예산", "세금", "복지", "대출", "규제", "법안", "국회",
        "지자체", "시장", "도지사", "교육청", "한국은행", "금리", "추경",
    ]
    problem_keywords = [
        "사고", "폭우", "산불", "갈등", "부족", "위기", "우려", "오염", "감소",
        "중단", "피해", "급등", "급락", "불안",
    ]

    def contains_any(keywords):
        return any(keyword in source for keyword in keywords)

    if contains_any(diplomacy_keywords):
        return "policy_diplomacy"
    if contains_any(discovery_keywords):
        return "discovery"
    if contains_any(problem_keywords):
        return "problem"
    if contains_any(domestic_policy_keywords):
        return "policy_domestic"
    if contains_any(positive_keywords):
        return "positive"
    return "problem"

def validate_panel_dialogues(dialogues):
    required_keys = ["panel_1", "panel_2", "panel_3", "panel_4"]
    if not isinstance(dialogues, dict):
        return False
    for key in required_keys:
        text = str(dialogues.get(key, "")).strip()
        if not text or len(text) > 65:
            return False
    return True

def build_fallback_dialogues(title, text, story_type):
    """대사 추출 실패 시 사용하는 안전한 기본 대사."""
    title = title.strip()
    guides = {
        "problem": {
            "panel_1": f"어? {title} 뉴스가 나왔어요!",
            "panel_2": "왜 이런 일이 생겼는지 더 찾아봐야겠어요.",
            "panel_3": "이 일이 계속되면 사람들이 불편하거나 걱정할 수 있겠어요.",
            "panel_4": "무슨 문제인지 알고 나니 뉴스를 더 잘 이해하겠어요!",
        },
        "policy_domestic": {
            "panel_1": f"어? {title} 때문에 달라지는 게 있대요!",
            "panel_2": "왜 이렇게 바꾸는지 이유를 알아봐야겠어요.",
            "panel_3": "우리 생활에도 어떤 영향이 있는지 살펴봐야겠어요.",
            "panel_4": "바뀌는 내용을 기억하면 뉴스를 더 쉽게 볼 수 있겠어요!",
        },
        "policy_diplomacy": {
            "panel_1": f"어? {title}처럼 나라들이 함께 의논하는 일이 있대요!",
            "panel_2": "왜 이런 국제 논의가 필요한지 먼저 알아봐야겠어요.",
            "panel_3": "우리 배와 사람들의 안전에도 중요한 뜻이 있겠어요.",
            "panel_4": "여러 나라가 어떻게 힘을 모을지 차분히 지켜봐야겠어요.",
        },
        "discovery": {
            "panel_1": f"우와, {title} 소식이 정말 신기해요!",
            "panel_2": "어떻게 이런 일이 가능한지 원리가 궁금해요.",
            "panel_3": "왜 중요한 발견인지 알면 더 재미있을 것 같아요.",
            "panel_4": "생활과 어떻게 이어지는지 알고 나니 뉴스가 더 가까워졌어요!",
        },
        "positive": {
            "panel_1": f"와, {title}처럼 반가운 소식이 있었어요!",
            "panel_2": "어떤 일이 있었는지 차근차근 알아볼래요.",
            "panel_3": "사람들에게 좋은 변화가 생긴 점이 참 인상적이에요.",
            "panel_4": "이런 소식을 보니 뉴스가 더 따뜻하게 느껴져요!",
        },
    }
    return guides.get(story_type, guides["problem"])

def extract_panel_dialogues(title, text, story_type):
    """뉴스 핵심 사실을 4컷 말풍선 초안으로 먼저 뽑아낸다."""
    story_guide = story_type_guide(story_type)
    prompt = f"""
너는 초등학생에게 뉴스를 만화로 설명하는 작가야.
아래 뉴스를 읽고, 4컷 만화의 말풍선 대사 4개를 만들어줘.

뉴스 제목: {title}
뉴스 내용: {text}
    만화 유형: {story_type}
    컷 흐름: {story_guide['panel_flow']}
    톤: {story_guide['tone']}
    상호작용 힌트: {story_guide['interaction_hint']}

[규칙]
- 대사 4개는 반드시 위 컷 흐름을 따라야 해.
- 각 대사에 뉴스의 구체적 사실이 반드시 들어가야 해. "이런 일이 있었어요" 같은 추상적 표현 금지.
- 초등학생이 이해할 수 있는 쉬운 말을 써야 해.
- 반드시 만화 캐릭터가 직접 보고 반응하는 말투로 써야 해 (최대 2문장).
- 한 대사는 가능한 한 1문장으로 끝내고, 65자를 넘기지 마.
- "~해요", "~했어요", "~네요!", "~래요!", "~대요!" 같은 부드러운 말투 사용.
- 뉴스 앵커나 기자처럼 전달하는 말투 금지. 반드시 아이가 직접 반응하는 말투여야 해.
- 뉴스 유형에 맞지 않게 억지로 위기감이나 교훈을 만들지 마.
- problem이 아니면 3컷을 무조건 "걱정"으로 쓰지 말고, 핵심 영향이나 중요한 포인트를 자연스럽게 설명해.
- policy_diplomacy라면 활짝 웃거나 지나치게 신나는 말투보다, 진지하지만 어렵지 않은 말투를 써.

반드시 아래 JSON 형식으로만 답해:
{{
  "panel_1": "1컷 대사",
  "panel_2": "2컷 대사",
  "panel_3": "3컷 대사",
  "panel_4": "4컷 대사"
}}
"""
    response = gemini_model.generate_content(prompt)
    json_str = response.text.replace('```json', '').replace('```', '').strip()
    return json.loads(json_str)


def generate_comic_storyboard(title, text, dialogues=None, story_type="problem"):
    """쉬운 요약문과 대사를 바탕으로 이미지 생성용 4컷 스토리보드를 만든다."""
    story_guide = story_type_guide(story_type)
    dialogue_section = ""
    if dialogues:
        dialogue_section = f"""
    [대사 초안 - 사실 관계는 유지하되, 장면과 감정에 맞게 짧게 다듬어도 됩니다]
    1컷 대사 초안: "{dialogues['panel_1']}"
    2컷 대사 초안: "{dialogues['panel_2']}"
    3컷 대사 초안: "{dialogues['panel_3']}"
    4컷 대사 초안: "{dialogues['panel_4']}"
    위 대사의 핵심 사실은 유지하되, 더 자연스럽고 만화답게 다듬을 수 있습니다.
"""

    prompt = f"""
    당신은 초등학교 저학년 아이들에게 뉴스를 재미있게 설명해주는 어린이 뉴스 만화 작가입니다.
    아래 정보를 바탕으로, 원문 뉴스의 핵심을 유지하면서도 초등학생이 이해하기 쉬운 스토리형 4컷 뉴스 만화 스토리보드를 만드세요.

    [뉴스 정보]
    제목: {title}
    내용(level_1 쉬운 요약본): {text}
    만화 유형: {story_type}
    컷 흐름: {story_guide['panel_flow']}
    상호작용 힌트: {story_guide['interaction_hint']}
    {dialogue_section}
    [핵심 목표]
    - 뉴스 내용을 바탕으로 "같은 캐릭터가 이어지는 4컷 만화"를 만드세요.
    - 표현과 대사는 반드시 초등학생이 이해할 수 있는 쉬운 말만 사용하세요.
    - 무조건 재미있되, 기사 핵심 사실은 과장하거나 바꾸지 마세요.
    - 4컷은 반드시 위 컷 흐름을 따라야 하며, 뉴스 유형에 맞지 않는 억지 위기감이나 교훈을 만들지 마세요.
    - 가족 일상 만화처럼 흐르지 말고, 뉴스 사건을 쉽게 설명하는 교육용 만화여야 합니다.
    - 각 컷은 "뉴스 속 핵심 사실"을 보여줘야 하며, 단순한 감상이나 추상적인 반응만 나오면 안 됩니다.
    - 결과물은 "귀여운 일반 생활 만화"가 아니라 "뉴스 만평/뉴스 설명 만화"처럼 보여야 합니다.
    - 기사에 없는 상징, 엉뚱한 동물, 랜덤 TV 장면, 일반 가족 위로 장면을 만들지 마세요.
    - 마지막 컷도 "엄마가 달래준다", "선생님이 안심시킨다" 같은 익숙한 클리셰로 끝내지 말고, 뉴스 내용을 이해한 결론으로 끝내세요.
    - 위 상호작용 힌트에 맞는 컷에서는 2인 장면과 짧은 2개 말풍선을 우선 고려하세요.

    [어휘 규칙]
    - 어려운 경제/시사 용어는 쉬운 우리말로 바꾸세요.
    - 대사는 짧고 또렷하게 만드세요.
    - 모든 문장은 "~해요", "~했어요", "~있어요"처럼 부드러운 말투를 쓰세요.
    - 하단 설명 없이 4컷의 말풍선만 읽어도 뉴스 흐름을 이해할 수 있어야 합니다.
    - 말풍선은 설명문이 아니라 실제 만화 대사처럼 써야 합니다.
    - "집이 줄어들고 있어요." 보다 "어? 새 집 짓는 곳이 별로 없네요!"처럼 장면 속 인물이 실제로 할 법한 말로 쓰세요.
    - 하지만 뉴스 핵심 사실은 빠지면 안 됩니다. 각 컷 말풍선에는 기사 핵심 정보가 조금씩 들어가야 합니다.
    - 딱딱한 보고체, 발표체, 요약문체는 금지합니다.
    - 각 컷에는 말풍선 1개 또는 2개만 넣으세요.
    - 모든 컷에 억지로 2개를 넣지 말고, 대화가 자연스러운 컷에서만 2개를 쓰세요.
    - 말풍선이 너무 길어지지 않게, 한 말풍선은 가능하면 1문장, 최대 2문장 이내로 쓰세요.
    - 한 말풍선 text는 65자를 넘기지 마세요.
    - 두 개의 말풍선을 쓰는 컷에서는 각 text를 가능하면 35자 안팎으로 더 짧게 쓰세요.
    - "speaker"는 짧게 적으세요. 예: "아이", "어른", "기자"

    [캐릭터 규칙]
    - 4컷 내내 같은 주인공 1명은 유지되어야 합니다.
    - 주인공은 어린이 1명을 기본으로 하세요.
    - 보조 인물은 정말 필요할 때만 0~1명 넣을 수 있습니다.
    - 한 컷에 등장인물은 최대 2명까지만 허용합니다.
    - 보조 인물은 주인공보다 덜 눈에 띄게 쓰세요.
    - 군중, 가족 단체, 여러 아이가 함께 나오는 구도는 피하세요.
    - 보호자, 부모, 선생님, 전문가, 뉴스 속 상징 인물은 꼭 필요한 컷에서만 1명 이내로 제한하세요.
    - 모든 컷을 "아이 + 어른 설명" 구조로 만들지 마세요.
    - character_profile에는 주인공의 외형, 복장, 성격, 말투를 구체적으로 적어 이미지 생성 AI가 같은 인물을 반복해서 그릴 수 있게 하세요.

    [패널 규칙]
    - panels는 정확히 4개여야 합니다.
    - 각 패널에는 scene, emotion, dialogues, must_show, avoid가 반드시 있어야 합니다.
    - scene과 must_show는 영어로 작성하고, 나머지는 한국어로 작성하세요.
    - scene은 이미지 생성 AI가 그릴 수 있도록 장소, 행동, 구도를 구체적으로 설명하세요.
    - scene은 한 컷에 한 장면만 담아야 하며, 등장인물 수는 최소화하세요.
    - scene에는 말풍선을 넣을 자연스러운 빈 공간도 포함해 설명하세요. 예: open upper center space for speech bubble, free space near speaking character
    - 말풍선은 꼭 좌측 상단에 둘 필요가 없습니다. 화자 주변 상단, 상단 중앙, 상단 우측 등 장면에 맞는 자연스러운 여백을 남기세요.
    - 인물이 2명일 때는 서로 바라보거나 대화하는 구도를 허용하세요.
    - 클로즈업 또는 미디엄샷 위주로, 주인공 표정이 잘 보이게 하세요.
    - 각 컷에는 뉴스 핵심 사물이나 상징이 보이게 하세요. 예: 공사장, 비어 있는 집터, 돈 상자, 집 모형, 지도, 반도체 칩, 항구 등
    - 단순히 아이가 서 있거나 놀라는 장면만 만들지 말고, "왜 이런 뉴스가 나왔는지" 눈으로 보이게 하세요.
    - 각 컷은 반드시 기사 핵심 요소 중 하나를 직접 보여줘야 합니다. 예: 공사장 중단, 돈 조달 어려움, 집 부족 우려, 정책 발표 장면
    - 컷마다 서로 다른 핵심 정보를 보여주세요. 같은 거실/같은 스마트폰/같은 놀람 표정만 반복하지 마세요.
    - 기사와 무관한 배경 장식이나 상징을 넣지 마세요. 예: 북극곰, 꽃 그림, 랜덤 자연 풍경, 일반 학교 생활 장면 금지
    - avoid에는 해당 컷에서 나오면 안 되는 요소를 영어로 짧게 적으세요.
    - dialogues는 말풍선 목록입니다. 각 요소는 {{"speaker": "...", "text": "..."}} 형식이어야 합니다.
    - 컷마다 dialogues는 1개 또는 2개만 만드세요.
    - 두 개를 쓸 때는 짧은 질문-응답, 설명-반응, 놀람-짧은 답변 정도로만 쓰세요.
    - 상호작용 힌트에 해당하는 컷에서는 dialogues 2개를 우선적으로 고려하세요.
    - 2개 말풍선을 쓸 때는 speaker가 서로 달라야 합니다. 예: "아이"와 "전문가", "아이"와 "어른"
    - 1컷부터 4컷까지 dialogues만 읽어도 "무슨 뉴스인지, 왜 중요한지, 마지막에 무엇을 배웠는지" 이해할 수 있어야 합니다.
    - dialogues는 반드시 위 컷 흐름을 따르세요.
    - story_type이 positive나 discovery일 때는 3컷을 억지로 "걱정"으로 만들지 말고, 핵심 의미나 중요한 변화가 보이게 하세요.
    - story_type이 policy_domestic일 때는 생활 변화와 기억할 점이 잘 드러나야 합니다.
    - story_type이 policy_diplomacy일 때는 외교, 안보, 국제 협의의 의미가 차분하게 드러나야 하며, 밝은 생활 만화 톤으로 흐르지 않게 하세요.
    - 각 text는 아래처럼 "만화 대화체 + 뉴스 정보"를 함께 가지세요.
      예시1: "어? 우리 동네에 새 집 짓는 곳이 별로 없네요!"
      예시2: "공사 돈을 빌리기 어려워서 그렇대요!"
      예시3: "이러면 나중에 살 집이 모자랄 수도 있겠어요!"
      예시4: "왜 그런지 알고 나니 뉴스가 더 잘 보여요!"
    - "caption", "narration", "context" 같은 하단 설명용 문장은 만들지 마세요.
    - 뉴스 만평처럼 대사만으로 흐름이 보이게 하세요.
    - 주인공이 뉴스 사건을 직접 보고, 생각하고, 이해하는 흐름으로 대사를 구성하세요.
    - 막연한 대사 대신 기사의 사실이 드러나는 대사를 쓰세요.
      나쁜 예: "어려운 말을 쉽게 바꾸면 보여요."
      좋은 예: "공사 돈을 빌리기 어려워서 새 집 짓는 일이 줄었대요!"

    [스타일 규칙]
    - style_profile에는 high quality Korean editorial cartoon panel, warm children's comic, dynamic pose, expressive face, dramatic reaction, cinematic angle, clean line art, polished shading, no text in image 와 같이 만화 스타일을 요약하세요.
    - 배경은 뉴스 이해에 필요한 만큼만 넣고, 주인공은 화면 중심에서 잘 보이게 하세요.
    - 시각적으로 귀엽더라도, "가족 소개 그림"처럼 보이지 않게 하세요.
    - 이미지 안에는 절대 글자, 숫자, 간판, 라벨, 화면 문구를 넣지 마세요. 말풍선 텍스트는 후처리로 따로 넣습니다.
    - 각 컷은 정면으로 가만히 서 있는 그림이 아니라, 감정과 동작이 느껴지는 한 장면이어야 합니다.
    - 놀람, 걱정, 설명, 안심 같은 감정이 몸짓과 표정으로 분명히 드러나야 합니다.
    - 두 인물이 나오는 컷은 시사만화처럼 관계와 상황이 읽히게 하되, 복잡한 군중 장면은 피하세요.
    - 컷마다 카메라 구도를 조금씩 다르게 하세요. 예: close-up, medium shot, over-shoulder, dramatic angle
    - 4컷 전체를 봤을 때 기사 내용이 시각적으로 요약되어 보여야 합니다. 일반 생활 일러스트처럼 보이면 안 됩니다.
    - story_type이 policy_diplomacy일 때는 거실 일상 분위기보다 지도, 항로, 바다, 회의, 경비, 국제 협의 장면을 우선하세요.
    - story_type이 policy_diplomacy일 때는 엄지를 치켜세우는 포즈, 축하 포스터 같은 밝은 홍보 장면을 피하세요.

    반드시 아래 JSON 형식으로만 답변하세요:
    {{
      "character_profile": {{
        "name": "주인공 이름",
        "role": "주인공의 역할",
        "appearance": "영어로 외형 설명",
        "outfit": "영어로 복장 설명",
        "personality": "한국어로 성격 설명",
        "speaking_style": "한국어로 말투 설명"
      }},
      "style_profile": {{
        "visual_style": "영어로 만화 화풍 설명",
        "color_palette": "영어로 색감 설명",
        "mood": "영어로 전체 분위기 설명"
      }},
      "panels": [
        {{
          "scene": "영어로 장면 설명",
          "emotion": "한국어 감정 설명",
          "dialogues": [
            {{
              "speaker": "아이",
              "text": "말풍선에 들어갈 짧은 대사"
            }}
          ],
          "must_show": "영어로 꼭 보여야 할 사물/행동",
          "avoid": "영어로 피해야 할 요소"
        }}
      ]
    }}
    """
    response = gemini_model.generate_content(prompt)
    json_str = response.text.replace('```json', '').replace('```', '').strip()
    storyboard = json.loads(json_str)
    storyboard["story_type"] = normalize_story_type(story_type)
    return storyboard


def get_default_font_path():
    """배포 환경에서도 안전하게 찾을 수 있는 기본 폰트 경로."""
    return str(BASE_DIR / "my_font.ttf")


def build_article_meta(news, category):
    return {
        "title": news["title"],
        "url": news["naver_link"],
        "pub_date": news["pub_date"],
        "category": category,
    }


def save_comic_image(image, output_dir=None, file_stem=None):
    """생성된 만화 이미지를 Cloudinary에 업로드하고 공개 URL을 반환한다."""
    if not is_cloudinary_configured():
        raise ValueError("Cloudinary 환경변수가 없어 이미지 업로드를 진행할 수 없습니다.")
    stem = file_stem or str(int(time.time() * 100))
    return upload_image_to_cloudinary(image, public_id=stem)


def generate_news_comic_result(
    title,
    body,
    article_id=None,
    category=None,
    comic_gen=None,
    output_dir=None,
    save_image=True,
):
    """
    백엔드에서 바로 호출할 수 있는 AI 파이프라인 진입점.
    입력은 기사 제목/본문 중심으로 단순화하고, 결과는 JSON 직렬화 가능한 dict로 반환합니다.
    """
    analyzer = NewsAnalyzer()
    comic_gen = comic_gen or ComicGenerator(font_path=get_default_font_path())

    analysis = analyzer.analyze_and_reconstruct(body[:4000], title=title)
    if not (analysis and validate_analysis(analysis)):
        raise ValueError("뉴스 분석 결과가 비어 있거나 형식이 올바르지 않습니다.")

    levels = analysis.get("levels", {})
    level_1_text = resolve_level_1_text(levels, title)
    story_type = detect_story_type(title, level_1_text)

    try:
        dialogues = extract_panel_dialogues(title, level_1_text, story_type)
    except Exception as dialogue_error:
        print(f"⚠️ 대사 추출 실패, fallback 사용: {dialogue_error}")
        dialogues = build_fallback_dialogues(title, level_1_text, story_type)

    if not validate_panel_dialogues(dialogues):
        print("⚠️ 대사 형식 검증 실패, fallback 사용")
        dialogues = build_fallback_dialogues(title, level_1_text, story_type)

    storyboard = generate_comic_storyboard(
        title,
        level_1_text,
        dialogues=dialogues,
        story_type=story_type,
    )
    if not validate_storyboard(storyboard):
        raise ValueError("스토리보드 JSON 구조가 올바르지 않습니다.")

    render_result = comic_gen.generate_story_comic(storyboard)
    comic_path = None
    if save_image:
        comic_path = save_comic_image(render_result["image"], output_dir=output_dir)

    return {
        "article_id": article_id,
        "story_type": story_type,
        "analysis": {
            "levels": analysis["levels"],
            "quizzes": analysis["quizzes"],
            "highlights": analysis["highlights"],
        },
        "dialogues": dialogues,
        "storyboard": storyboard,
        "bubble_layouts": render_result.get("bubble_layouts", []),
        "comic_image_path": comic_path,
        "status": "success",
        "category": category,
    }


def process_news_item(news, category, comic_gen=None, output_dir=None):
    """기존 배치 파이프라인에서 쓰기 쉬운 저장용 dict 형태로 변환한다."""
    result = generate_news_comic_result(
        title=news["title"],
        body=news["body"],
        category=category,
        comic_gen=comic_gen,
        output_dir=output_dir,
    )
    result["meta"] = build_article_meta(news, category)
    return {
        "levels": result["analysis"]["levels"],
        "quizzes": result["analysis"]["quizzes"],
        "highlights": result["analysis"]["highlights"],
        "storyboard": result["storyboard"],
        "bubble_layouts": result["bubble_layouts"],
        "comic_path": result["comic_image_path"],
        "meta": result["meta"],
    }

def run_news_now_pipeline(keyword, count, category):
    """배치 실행용 루프. 기사 수집, AI 처리, DB 저장을 한 번에 수행한다."""
    crawler = NaverNewsCrawler()
    comic_gen = ComicGenerator(font_path=get_default_font_path()) # 근표 님의 M4 Pro 최적화 엔진

    results_count = 0
    start_idx = 1

    try:
        with get_db_connection() as conn:
            with conn.cursor() as cur:
                ensure_comic_storyboards_table(cur)
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
                        enriched_title = crawler.extract_best_title(
                            news["original_link"] or news["naver_link"],
                            news["title"],
                        )
                        news_with_body = {**news, "title": enriched_title, "body": body}
                        
                        print(f"\n🧠 [{category}] 뉴스 분석 중: {news_with_body['title'][:25]}...")
                        try:
                            print(f"🎨 스토리형 4컷 뉴스 만화 제작 중...")
                            try:
                                analysis = process_news_item(
                                    news_with_body,
                                    category=category,
                                    comic_gen=comic_gen,
                                )
                                print(f"✅ 스토리형 만화 생성 완료: {analysis['comic_path']}")
                            except Exception as e:
                                print(f"⚠️ 이미지 생성 오류: {e}")
                                fallback = generate_news_comic_result(
                                    title=news_with_body["title"],
                                    body=body,
                                    category=category,
                                    comic_gen=comic_gen,
                                    save_image=False,
                                )
                                analysis = {
                                    "levels": fallback["analysis"]["levels"],
                                    "quizzes": fallback["analysis"]["quizzes"],
                                    "highlights": fallback["analysis"]["highlights"],
                                    "storyboard": None,
                                    "bubble_layouts": [],
                                    "comic_path": None,
                                    "meta": build_article_meta(news_with_body, category),
                                }

                            save_news_result(conn, cur, analysis)
                            results_count += 1
                        except Exception as e:
                            print(f"⚠️ 처리 에러: {e}")
                            if is_retryable_error(e): time.sleep(60)
                        
                        time.sleep(10) # API 안전 대기
                    start_idx += 10
    except Exception as e:
        print(f"❌ 파이프라인 치명적 오류: {e}")

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
