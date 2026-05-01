"""하이라이트 단어 정제 공용 유틸."""

import re


HIGHLIGHT_MIN_COUNT = 4
HIGHLIGHT_MAX_COUNT = 6
HIGHLIGHT_STOPWORDS = {
    "기사", "뉴스", "내용", "상황", "이번", "이날", "관련", "대해", "통해", "정도",
    "문제", "결과", "영향", "사람", "정부", "우리", "한국", "미국", "중국", "일본",
    "때문", "이유", "정리", "설명", "발표", "기자", "보도", "가장", "여러", "일부",
    "사용", "진행", "계속", "가운데", "가능", "기준", "정책", "사회", "경제",
}
HIGHLIGHT_PRIORITY_TERMS = (
    "금리", "물가", "환율", "관세", "수출", "수입", "무역", "경기", "예산", "복지",
    "규제", "법안", "국회", "외교", "안보", "협상", "제재", "휴전", "반도체", "배터리",
    "인공지능", "AI", "플랫폼", "알고리즘", "백신", "바이오", "기후", "탄소", "에너지",
    "전력", "발전소", "우주", "로봇", "데이터", "개인정보", "추경", "대출", "주택",
)


def _normalize_word_for_match(word):
    return re.sub(r"\s+", "", str(word or "")).lower()


def _is_valid_highlight_word(word, level_text):
    word = str(word or "").strip()
    if len(word) < 2:
        return False
    if word in HIGHLIGHT_STOPWORDS:
        return False
    if re.fullmatch(r"[0-9]+", word):
        return False
    normalized_text = _normalize_word_for_match(level_text)
    normalized_word = _normalize_word_for_match(word)
    return bool(normalized_word) and normalized_word in normalized_text


def _fallback_definition(word, level_text):
    first_sentence = re.split(r"[.!?]\s+|[。！？]\s*|\n+", str(level_text or "").strip())[0].strip()
    if first_sentence:
        return f'"{word}"는 이 글에서 중요한 내용을 이해할 때 필요한 말이에요.'
    return f'"{word}"는 이 기사에서 핵심 흐름을 이해하는 데 도움이 되는 말이에요.'


def _extract_highlight_candidates(level_text):
    words = re.findall(r"[A-Za-z][A-Za-z0-9+-]{1,}|[가-힣]{2,}", str(level_text or ""))
    seen = set()
    prioritized = []
    others = []

    for word in words:
        if word in seen or not _is_valid_highlight_word(word, level_text):
            continue
        seen.add(word)
        if any(term.lower() in word.lower() for term in HIGHLIGHT_PRIORITY_TERMS):
            prioritized.append(word)
        else:
            others.append(word)

    others.sort(key=lambda item: (-len(item), item))
    return prioritized + others


def normalize_highlights(levels, highlights):
    """AI가 만든 하이라이트를 본문 기준으로 정제하고 부족하면 후보를 보충한다."""
    normalized = {}
    levels = levels if isinstance(levels, dict) else {}
    highlights = highlights if isinstance(highlights, dict) else {}

    for level_key, level_text in levels.items():
        raw_items = highlights.get(level_key, [])
        cleaned = []
        seen_words = set()

        if isinstance(raw_items, list):
            for item in raw_items:
                if not isinstance(item, dict):
                    continue
                word = str(item.get("word", "")).strip()
                definition = str(item.get("definition", "")).strip()
                if not _is_valid_highlight_word(word, level_text):
                    continue
                normalized_word = _normalize_word_for_match(word)
                if normalized_word in seen_words:
                    continue
                seen_words.add(normalized_word)
                cleaned.append({
                    "word": word,
                    "definition": definition or _fallback_definition(word, level_text),
                })
                if len(cleaned) >= HIGHLIGHT_MAX_COUNT:
                    break

        if len(cleaned) < HIGHLIGHT_MIN_COUNT:
            for candidate in _extract_highlight_candidates(level_text):
                normalized_candidate = _normalize_word_for_match(candidate)
                if normalized_candidate in seen_words:
                    continue
                seen_words.add(normalized_candidate)
                cleaned.append({
                    "word": candidate,
                    "definition": _fallback_definition(candidate, level_text),
                })
                if len(cleaned) >= HIGHLIGHT_MIN_COUNT:
                    break

        normalized[level_key] = cleaned[:HIGHLIGHT_MAX_COUNT]

    return normalized
