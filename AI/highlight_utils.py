"""하이라이트 단어 정제 공용 유틸."""

import re


HIGHLIGHT_MIN_COUNT = 4
HIGHLIGHT_MAX_COUNT = 6
HIGHLIGHT_STOPWORDS = {
    "기사", "뉴스", "내용", "상황", "이번", "이날", "관련", "대해", "통해", "정도",
    "문제", "결과", "영향", "사람", "정부", "우리", "한국", "미국", "중국", "일본",
    "때문", "이유", "정리", "설명", "발표", "기자", "보도", "가장", "여러", "일부",
    "사용", "진행", "계속", "가운데", "가능", "기준", "정책", "사회", "경제",
    "필요", "도움", "계획", "지역", "사람들", "정부를", "준비", "이유를", "사람들도",
    "데이터", "자료", "정보", "기술", "기업", "회사", "서비스", "솔루션", "플랫폼",
    "변환", "처리", "제공", "운영", "개발", "참여", "협력", "획득", "사용",
    "인정", "우수성", "자격", "성과",
    "경기", "서울", "부산", "대구", "인천", "광주", "대전", "울산", "세종",
    "수원", "캠퍼스", "축제", "공연", "작품", "프로그램", "행사", "관객",
    "협업", "로봇",
    "안정", "안정적", "안정적인", "쾌적", "쾌적한", "필요한", "어려운",
    "좋은", "나쁜", "많은", "작은", "큰", "새로운", "주거", "환경",
    "불가피", "불가피한",
    "주거 환경", "주거환경", "교육 환경", "교육환경", "학습 공간", "학습공간",
    "기숙사", "공부", "아이들", "아동들",
}
LEVEL_MIN_COUNTS = {
    1: 4,
    2: 4,
    3: 4,
    4: 2,
}
LEVEL_4_TOO_BASIC_TERMS = {
    "물가", "에너지", "AI", "인공지능", "전력", "데이터", "경제", "사회", "정책",
    "시장", "기업", "산업", "기술", "관리", "가격", "수요", "공급", "성장",
    "가시화", "상징적", "형평성", "프로모션", "차별화", "유휴공간", "로드맵",
    "연속성", "행정력", "거주권", "피고인", "실효성", "안정화", "가역성",
    "점유율", "신경전", "포인트", "불확실성", "패러다임", "권선징악", "근원적",
}
LEVEL_4_WEAK_TERMS = {
    "해상풍력", "기숙학교", "취약 계층", "최하위 계층",
}
HIGHLIGHT_PRIORITY_TERMS = (
    "금리", "물가", "환율", "관세", "수출", "수입", "무역", "예산", "복지",
    "규제", "법안", "국회", "외교", "안보", "협상", "제재", "휴전", "반도체", "배터리",
    "인공지능", "AI", "플랫폼", "알고리즘", "백신", "바이오", "기후", "탄소", "에너지",
    "전력", "발전소", "우주", "데이터", "개인정보", "추경", "대출", "주택",
)
ADVANCED_TERM_HINTS = (
    "재정 건전성", "물가 관리 능력", "에너지 가격 상승", "대외 여건", "경제 대응력",
    "경기 침체", "경기 회복", "경기 둔화", "경기 부양", "산업용 로봇",
    "창조적 파괴", "구조적 요인", "구조적인 요인", "잠재성장률", "복리 효과",
    "낙관적 전망", "소득 배증", "정림 반도체", "정림 반도체 수요", "시장 지배적 기업",
    "정책 강화", "스타트업 육성", "선도형 성장", "고용 변화", "산학협력",
    "인적 자원", "효율적 배분", "해상풍력", "기부 협약", "취약 계층",
    "협약식", "기숙학교", "카스트 제도", "달리트", "최하위 계층", "EPC", "IPO",
    "사단법인", "비인권적 환경", "비인권적인 환경", "교육 환경 개선 사업",
    "교육 및 주거 환경 개선 사업", "사회적 책임", "기업의 사회적 책임",
    "수익 모델", "투자 전략", "재무 구조", "상장 추진", "반도체 수요",
    "수의계약", "아키텍처", "공급망", "워크로드", "변곡점", "비확산",
)
TERM_DEFINITIONS = {
    "해상풍력": "바다에 설치한 풍력 발전기를 이용해 전기를 만드는 발전 방식이에요.",
    "협약식": "기관이나 단체가 서로 약속한 내용을 공식적으로 확인하는 자리예요.",
    "기부 협약": "돈이나 물품을 지원하기로 한 약속을 공식적으로 정한 것이에요.",
    "기숙학교": "학생들이 학교 안 숙소에서 생활하며 공부하는 학교예요.",
    "카스트 제도": "태어난 신분에 따라 사회적 지위가 나뉘는 인도의 전통적 신분 제도예요.",
    "달리트": "인도 카스트 제도에서 가장 낮은 계층으로 차별을 받아온 사람들을 가리키는 말이에요.",
    "최하위 계층": "사회 구조 안에서 가장 낮은 지위에 놓인 집단을 뜻해요.",
    "취약 계층": "경제적·사회적으로 보호와 지원이 더 필요한 사람들을 뜻해요.",
    "EPC": "설계, 조달, 시공을 한 회사가 함께 맡아 진행하는 사업 방식을 뜻해요.",
    "사단법인": "공익이나 공동 목적을 위해 사람들이 모여 법적으로 설립한 단체예요.",
    "비인권적 환경": "사람으로서 보장받아야 할 기본 권리가 충분히 지켜지지 않는 환경을 뜻해요.",
    "비인권적인 환경": "사람으로서 보장받아야 할 기본 권리가 충분히 지켜지지 않는 환경을 뜻해요.",
    "교육 환경 개선 사업": "학생들이 더 나은 조건에서 공부할 수 있도록 시설이나 학습 공간을 고치는 사업이에요.",
    "교육 및 주거 환경 개선 사업": "학생들이 공부하고 생활하는 공간을 더 나은 상태로 고치는 지원 사업이에요.",
    "사회적 책임": "기업이나 단체가 이익뿐 아니라 사회에 미치는 영향까지 고려해야 한다는 뜻이에요.",
    "기업의 사회적 책임": "기업이 이익 추구와 함께 사회 문제 해결이나 공익에도 책임을 져야 한다는 뜻이에요.",
    "IPO": "기업이 주식을 시장에 공개해 투자자들이 사고팔 수 있게 하는 절차예요.",
    "수익 모델": "기업이나 서비스가 돈을 버는 구조를 뜻해요.",
    "재무 구조": "기업이 가진 돈, 빚, 자본이 어떤 비율로 이루어져 있는지를 뜻해요.",
    "상장 추진": "기업 주식을 거래소에서 사고팔 수 있도록 준비하는 과정을 뜻해요.",
    "수의계약": "경쟁 입찰 없이 특정 상대와 직접 맺는 계약을 뜻해요.",
    "아키텍처": "시스템이나 기술이 어떤 구조로 설계되어 작동하는지를 뜻해요.",
    "공급망": "제품이나 서비스가 생산되어 소비자에게 전달되기까지 이어지는 전체 흐름을 뜻해요.",
    "워크로드": "컴퓨터 시스템이나 서버가 처리해야 하는 작업량을 뜻해요.",
    "변곡점": "상황이나 흐름이 뚜렷하게 바뀌기 시작하는 지점을 뜻해요.",
    "비확산": "핵무기 같은 위험한 무기나 기술이 더 퍼지지 않도록 막는 것을 뜻해요.",
}
KOREAN_PARTICLE_SUFFIXES = (
    "으로는", "에서는", "에게는", "까지는", "부터는", "에서는", "에게서",
    "으로", "에서", "에게", "한테", "까지", "부터", "처럼", "보다",
    "은", "는", "이", "가", "을", "를", "와", "과", "만", "에", "의", "로",
)
BAD_ENDINGS = (
    "합니다", "했습니다", "됩니다", "있습니다", "없습니다", "입니다", "였다", "했다",
    "하다", "되다", "된다", "있다", "없다", "하며", "하면", "해서", "되고", "이며",
    "았습니다", "었습니다", "습니다", "받았습니다", "받았", "받은",
    "받고", "받으며", "얻었습니다", "얻었", "획득했습니다", "획득했",
    "달성했습니다", "달성했", "시작했습니다", "추진합니다", "나섰습니다",
    "하", "되", "했", "됐", "한", "된",
)
COMPANY_NAME_HINTS = (
    "주식회사", "㈜", "(주)", "그룹", "테크", "소프트", "컴퍼니",
    "시스템즈", "랩스", "바이오", "엔터", "스튜디오", "링크알파", "몬드리안",
    "제노스", "바이브컴퍼니", "한국딥러닝", "세이지", "ZD", "SW",
)
LOCATION_NAME_HINTS = (
    "경기", "경기도", "서울", "서울시", "부산", "부산시", "대구", "대구시",
    "인천", "인천시", "광주", "광주시", "대전", "대전시", "울산", "울산시",
    "세종", "세종시", "수원", "수원시", "용인", "용인시", "성남", "성남시",
    "고양", "고양시", "화성", "화성시", "안산", "안산시", "안양", "안양시",
    "남양주", "남양주시", "평택", "평택시", "의정부", "의정부시", "파주", "파주시",
    "시흥", "시흥시", "김포", "김포시", "광명", "광명시", "군포", "군포시",
    "하남", "하남시", "오산", "오산시", "이천", "이천시", "안성", "안성시",
    "구리", "구리시", "의왕", "의왕시", "포천", "포천시", "양주", "양주시",
    "여주", "여주시", "동두천", "동두천시", "과천", "과천시",
)


def _normalize_word_for_match(word):
    return re.sub(r"\s+", "", str(word or "")).lower()


def clean_highlight_word(word):
    cleaned = re.sub(r"^[^A-Za-z가-힣0-9]+|[^A-Za-z가-힣0-9]+$", "", str(word or "").strip())
    if not cleaned:
        return ""

    changed = True
    while changed:
        changed = False
        for suffix in sorted(KOREAN_PARTICLE_SUFFIXES, key=len, reverse=True):
            if cleaned.endswith(suffix) and len(cleaned) - len(suffix) >= 2:
                cleaned = cleaned[: -len(suffix)]
                changed = True
                break

    return cleaned.strip()


def _looks_like_company_name(word, level_text):
    cleaned = clean_highlight_word(word)
    if _is_curated_term(cleaned):
        return False
    if any(hint.lower() in cleaned.lower() for hint in COMPANY_NAME_HINTS):
        return True

    escaped = re.escape(cleaned)
    company_context_patterns = [
        rf"{escaped}\s*(?:은|는|이|가)?\s*(?:회사|기업|업체|플랫폼|서비스|솔루션)",
        rf"(?:회사|기업|업체)\s*{escaped}",
        rf"{escaped}\s*(?:대표|운영|제공|개발|출시|참여|협력)",
    ]
    return any(re.search(pattern, str(level_text or "")) for pattern in company_context_patterns)


def _looks_like_location_name(word, level_text):
    cleaned = clean_highlight_word(word)
    if _is_curated_term(cleaned):
        return False
    if cleaned in LOCATION_NAME_HINTS:
        return True

    escaped = re.escape(cleaned)
    location_context_patterns = [
        rf"{escaped}\s*(?:도|시|군|구|역|캠퍼스|전역|일대|지역|행사장)",
        rf"(?:도|시|군|구|역|캠퍼스|지역)\s*{escaped}",
    ]
    return any(re.search(pattern, str(level_text or "")) for pattern in location_context_patterns)


def _looks_like_predicate_or_sentence_fragment(word):
    cleaned = str(word or "").strip()
    compact = _normalize_word_for_match(cleaned)
    if not compact:
        return True

    predicate_markers = (
        "했습니다", "합니다", "됩니다", "되었습니다", "됐습니다", "있습니다", "없습니다",
        "입니다", "였습니다", "었습니다", "았습니다", "습니다", "받았습니다", "받았",
        "받은", "받고", "받으며", "얻었습니다", "얻었", "획득했습니다", "획득했",
        "달성했습니다", "달성했", "시작했습니다", "시작했", "추진합니다", "추진했",
        "나섰습니다", "나섰", "보였습니다", "밝혔습니다", "강조했습니다", "제안했습니다",
    )
    if any(marker in compact for marker in predicate_markers):
        return True

    if re.search(r"(되|됐|했|받|얻|달성|획득|추진|시작|강조|제안)[가-힣]*$", compact):
        return True

    if " " in cleaned and not any(_normalize_word_for_match(hint) == compact for hint in ADVANCED_TERM_HINTS):
        return True

    return False


def _is_valid_highlight_word(word, level_text):
    word = clean_highlight_word(word)
    if len(word) < 2:
        return False
    if word in HIGHLIGHT_STOPWORDS:
        return False
    if _looks_like_predicate_or_sentence_fragment(word):
        return False
    if _looks_like_location_name(word, level_text):
        return False
    if _looks_like_simple_modifier(word):
        return False
    if word.endswith("하") and len(word) >= 3:
        return False
    if _looks_like_company_name(word, level_text):
        return False
    if any(word.endswith(ending) for ending in BAD_ENDINGS):
        return False
    if re.fullmatch(r"[0-9]+", word):
        return False
    normalized_text = _normalize_word_for_match(level_text)
    normalized_word = _normalize_word_for_match(word)
    return bool(normalized_word) and normalized_word in normalized_text


def _level_number(level_key):
    match = re.search(r"(\d+)", str(level_key or ""))
    if not match:
        return 1
    return max(1, min(4, int(match.group(1))))


def _contains_korean_or_alnum(text):
    return bool(re.search(r"[A-Za-z가-힣0-9]", str(text or "")))


def _is_curated_term(word):
    normalized_word = _normalize_word_for_match(word)
    return any(_normalize_word_for_match(term) == normalized_word for term in ADVANCED_TERM_HINTS) \
        or any(_normalize_word_for_match(term) == normalized_word for term in TERM_DEFINITIONS)


def _looks_like_simple_modifier(word):
    cleaned = clean_highlight_word(word)
    if " " in cleaned or _is_curated_term(cleaned):
        return False

    simple_endings = (
        "적인", "스러운", "로운", "있는", "없는", "필요한", "어려운",
        "좋은", "나쁜", "많은", "작은", "큰", "새로운", "안정적인", "쾌적한",
        "불가피", "불가피한",
    )
    return any(cleaned.endswith(ending) for ending in simple_endings)


def _is_too_basic_for_level(word, level_num):
    if level_num < 4:
        return False
    cleaned = clean_highlight_word(word)
    if cleaned in LEVEL_4_TOO_BASIC_TERMS:
        return True
    if cleaned in LEVEL_4_WEAK_TERMS:
        return True
    if not _is_curated_term(cleaned) and re.search(r"(화|성|적)$", cleaned):
        return True
    return len(cleaned) <= 2 and cleaned.upper() != "EPC"


def _highlight_score(word, level_text, level_num):
    cleaned = clean_highlight_word(word)
    score = 0

    if any(hint.lower() in cleaned.lower() for hint in ADVANCED_TERM_HINTS):
        score += 9
    if " " in cleaned:
        score += 5
    if re.search(r"[A-Za-z]", cleaned) and re.search(r"[가-힣]", cleaned):
        score += 4
    elif re.fullmatch(r"[A-Z]{2,}", cleaned):
        score += 6
    if len(cleaned) >= 5:
        score += 4
    elif len(cleaned) >= 4:
        score += 3
    elif len(cleaned) >= 3:
        score += 1
    if any(term.lower() in cleaned.lower() for term in HIGHLIGHT_PRIORITY_TERMS):
        score += 2
    if _is_too_basic_for_level(cleaned, level_num):
        score -= 8
    return score


def _fallback_definition(word, level_text):
    first_sentence = re.split(r"[.!?]\s+|[。！？]\s*|\n+", str(level_text or "").strip())[0].strip()
    if first_sentence:
        return f'"{word}"는 이 글에서 중요한 내용을 이해할 때 필요한 말이에요.'
    return f'"{word}"는 이 기사에서 핵심 흐름을 이해하는 데 도움이 되는 말이에요.'


def _definition_for_candidate(word):
    normalized_word = _normalize_word_for_match(word)
    for term, definition in TERM_DEFINITIONS.items():
        if _normalize_word_for_match(term) == normalized_word:
            return definition
    return ""


def _is_useful_definition(definition, word):
    text = str(definition or "").strip()
    cleaned = clean_highlight_word(word)
    if len(text) < 12:
        return False

    generic_patterns = (
        "중요한 내용을 이해할 때 필요한 말",
        "핵심 흐름을 이해하는 데 도움이 되는 말",
        "이 글에서 중요한 내용을 이해",
        "이 기사에서 핵심 흐름",
        "필요한 말이에요",
        "도움이 되는 말이에요",
    )
    if any(pattern in text for pattern in generic_patterns):
        return False

    bare_definition = re.sub(rf'["\']?{re.escape(cleaned)}["\']?\s*(?:은|는)?', "", text).strip(" .")
    return len(bare_definition) >= 8


def normalize_definition_word(definition, original_word, cleaned_word):
    text = str(definition or "").strip()
    original = str(original_word or "").strip()
    cleaned = str(cleaned_word or "").strip()

    if not text:
        return ""
    if not original or not cleaned or original == cleaned:
        return text

    return text.replace(f'"{original}"', f'"{cleaned}"').replace(f"'{original}'", f"'{cleaned}'").replace(original, cleaned)


def _extract_compound_candidates(level_text):
    text = str(level_text or "")
    candidates = []
    normalized_text = _normalize_word_for_match(text)
    for hint in ADVANCED_TERM_HINTS:
        if _normalize_word_for_match(hint) in normalized_text:
            candidates.append(hint)

    candidates.extend(re.findall(r"[가-힣A-Za-z0-9]+(?:·[가-힣A-Za-z0-9]+)+", text))
    return [candidate.strip() for candidate in candidates if _contains_korean_or_alnum(candidate)]


def _extract_highlight_candidates(level_text, level_num=1):
    words = (
        _extract_compound_candidates(level_text)
        + re.findall(r"[A-Za-z][A-Za-z0-9+-]{1,}|[가-힣]{2,}", str(level_text or ""))
    )
    seen = set()
    candidates = []

    for word in words:
        cleaned = clean_highlight_word(word)
        if cleaned in seen or not _is_valid_highlight_word(cleaned, level_text):
            continue
        if _is_too_basic_for_level(cleaned, level_num):
            continue
        seen.add(cleaned)
        if level_num >= 4 and len(cleaned) < 3 and cleaned.upper() != "EPC":
            continue
        if level_num >= 4 and _highlight_score(cleaned, level_text, level_num) < 3:
            continue
        candidates.append(cleaned)

    candidates.sort(key=lambda item: (-_highlight_score(item, level_text, level_num), -len(item), item))
    return candidates


def normalize_highlights(levels, highlights):
    """AI가 만든 하이라이트를 본문 기준으로 정제하고 부족하면 후보를 보충한다."""
    normalized = {}
    levels = levels if isinstance(levels, dict) else {}
    highlights = highlights if isinstance(highlights, dict) else {}

    for level_key, level_text in levels.items():
        level_num = _level_number(level_key)
        raw_items = highlights.get(level_key, [])
        cleaned = []
        seen_words = set()

        if isinstance(raw_items, list):
            for item in raw_items:
                if not isinstance(item, dict):
                    continue
                word = clean_highlight_word(item.get("word", ""))
                definition = str(item.get("definition", "")).strip()
                if not _is_valid_highlight_word(word, level_text):
                    continue
                if _is_too_basic_for_level(word, level_num):
                    continue
                if not _is_useful_definition(definition, word):
                    continue
                normalized_word = _normalize_word_for_match(word)
                if normalized_word in seen_words:
                    continue
                seen_words.add(normalized_word)
                cleaned.append({
                    "word": word,
                    "definition": normalize_definition_word(
                        definition,
                        item.get("word", ""),
                        word,
                    ),
                })

        cleaned.sort(key=lambda item: (-_highlight_score(item["word"], level_text, level_num), -len(item["word"]), item["word"]))

        if len(cleaned) < HIGHLIGHT_MAX_COUNT:
            compound_candidates = sorted(
                _extract_compound_candidates(level_text),
                key=lambda item: (-_highlight_score(item, level_text, level_num), -len(item), item),
            )
            for candidate in compound_candidates:
                word = clean_highlight_word(candidate)
                definition = _definition_for_candidate(word)
                normalized_word = _normalize_word_for_match(word)
                if not definition or normalized_word in seen_words:
                    continue
                if any(normalized_word in seen_word or seen_word in normalized_word for seen_word in seen_words):
                    continue
                if not _is_valid_highlight_word(word, level_text):
                    continue
                if _is_too_basic_for_level(word, level_num):
                    continue
                seen_words.add(normalized_word)
                cleaned.append({
                    "word": word,
                    "definition": definition,
                })

        cleaned.sort(key=lambda item: (-_highlight_score(item["word"], level_text, level_num), -len(item["word"]), item["word"]))

        normalized[level_key] = cleaned[:HIGHLIGHT_MAX_COUNT]

    return normalized
