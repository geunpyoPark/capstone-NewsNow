"""퀴즈 정제 공용 유틸."""

import re
import random
from highlight_utils import clean_highlight_word


def _normalize_word_for_match(word):
    return re.sub(r"\s+", "", str(word or "")).lower()


def _word_in_text(word, text):
    normalized_word = _normalize_word_for_match(word)
    normalized_text = _normalize_word_for_match(text)
    return bool(normalized_word) and normalized_word in normalized_text


def _extract_quoted_terms(question):
    matches = re.findall(r"'([^']+)'|\"([^\"]+)\"|‘([^’]+)’|“([^”]+)”", str(question or ""))
    terms = []
    for group in matches:
        for item in group:
            if item:
                terms.append(item.strip())
    return terms


def _looks_like_fallback_definition(text, word):
    normalized = str(text or "").strip()
    target = str(word or "").strip()
    if not normalized:
        return True
    fallback_markers = [
        "이 글에서 중요한 내용을 이해할 때 필요한 말",
        "이 글을 이해할 때 중요한 말",
        "이 기사에서 핵심 흐름을 이해하는 데 도움이 되는 말",
    ]
    if any(marker in normalized for marker in fallback_markers):
        return True
    if target and target in normalized:
        return True
    return False


def _shuffle_quiz_options(item):
    if not isinstance(item, dict):
        return item

    options = item.get("options", [])
    answer = item.get("answer")
    if not isinstance(options, list) or len(options) != 4:
        return item
    if not isinstance(answer, int) or not (0 <= answer < len(options)):
        return item

    indexed_options = list(enumerate(options))
    seed = sum(ord(ch) for ch in f"{item.get('question', '')}|{options}|{answer}")
    rng = random.Random(seed)
    rng.shuffle(indexed_options)

    shuffled_options = [option for _, option in indexed_options]
    shuffled_answer = next(
        index for index, (original_index, _) in enumerate(indexed_options) if original_index == answer
    )

    shuffled_item = dict(item)
    shuffled_item["options"] = shuffled_options
    shuffled_item["answer"] = shuffled_answer
    return shuffled_item


def _collect_context_terms(level_text, target_word):
    words = re.findall(r"[A-Za-z][A-Za-z0-9+-]{1,}|[가-힣]{2,}", str(level_text or ""))
    terms = []
    seen = set()
    for word in words:
        cleaned = clean_highlight_word(word)
        if not cleaned or cleaned == target_word or len(cleaned) < 2:
            continue
        normalized = _normalize_word_for_match(cleaned)
        if normalized in seen:
            continue
        seen.add(normalized)
        terms.append(cleaned)
        if len(terms) >= 8:
            break
    return terms


def _build_contextual_distractors(word, definition, level_text, highlights):
    distractors = []
    seen = {definition.strip()}

    if isinstance(highlights, list):
        for item in highlights:
            if not isinstance(item, dict):
                continue
            candidate_word = clean_highlight_word(item.get("word", ""))
            candidate_definition = str(item.get("definition", "")).strip()
            if not candidate_word or candidate_word == word or not candidate_definition:
                continue
            if candidate_definition in seen:
                continue
            distractors.append(candidate_definition)
            seen.add(candidate_definition)
            if len(distractors) >= 3:
                return distractors

    context_terms = _collect_context_terms(level_text, word)
    contextual_pool = []
    if context_terms:
        term1 = context_terms[0]
        contextual_pool.append(f"글에서 {term1}이 왜 중요한지 설명하는 말이에요.")
    if len(context_terms) >= 2:
        term2 = context_terms[1]
        contextual_pool.append(f"글에서 {term2}이(가) 일어나는 장소나 범위를 뜻해요.")
    if len(context_terms) >= 3:
        term3 = context_terms[2]
        contextual_pool.append(f"글에서 {term3}을(를) 해결하는 순서를 뜻해요.")
    if len(context_terms) >= 4:
        term4 = context_terms[3]
        contextual_pool.append(f"글에서 {term4}과(와) 비슷한 감정을 나타내는 말이에요.")

    generic_pool = [
        "글에 나온 상황이 벌어진 까닭만 가리키는 말이에요.",
        "사람들이 모여 의견을 나누는 자리를 뜻하는 말이에요.",
        "앞으로 생길 일을 미리 짐작해 보는 뜻이에요.",
        "어떤 일을 할 때 지켜야 하는 규칙을 가리키는 말이에요.",
        "여러 사람이 함께 움직이는 방법이나 차례를 뜻해요.",
        "장소를 옮기거나 길을 찾을 때 쓰는 말이에요.",
        "돈이나 값이 달라지는 흐름을 설명하는 말이에요.",
        "서로 힘을 합쳐 일을 돕는 모습을 뜻해요.",
    ]

    for candidate in contextual_pool + generic_pool:
        if candidate in seen or candidate == definition:
            continue
        distractors.append(candidate)
        seen.add(candidate)
        if len(distractors) >= 3:
            break

    return distractors


def is_valid_vocabulary_quiz(item, level_text, highlights):
    if not isinstance(item, dict):
        return False
    options = item.get("options", [])
    answer = item.get("answer")
    if not isinstance(options, list) or len(options) != 4:
        return False
    if not isinstance(answer, int) or not (0 <= answer < len(options)):
        return False
    if len({str(option).strip() for option in options}) != 4:
        return False

    quoted_terms = _extract_quoted_terms(item.get("question", ""))
    valid_terms = [term for term in quoted_terms if _is_clean_vocabulary_term(term, level_text, highlights)]
    if not valid_terms:
        return False

    answer_text = str(options[answer]).strip()
    for term in valid_terms:
        cleaned = clean_highlight_word(term)
        if _looks_like_fallback_definition(answer_text, cleaned):
            return False
    return True


def _is_clean_vocabulary_term(term, level_text, highlights):
    cleaned = clean_highlight_word(term)
    if not cleaned:
        return False
    if cleaned != str(term).strip():
        return False
    if not _word_in_text(cleaned, level_text):
        return False

    for item in highlights:
        if not isinstance(item, dict):
            continue
        highlight_word = clean_highlight_word(item.get("word", ""))
        if highlight_word == cleaned:
            return True
    return False


def _fallback_definition(word, highlights):
    for item in highlights:
        if not isinstance(item, dict):
            continue
        candidate_word = clean_highlight_word(item.get("word", ""))
        definition = str(item.get("definition", "")).strip()
        if candidate_word == word and definition:
            return definition
    return ""


def _build_vocabulary_quiz(word, definition, level_text="", highlights=None):
    distractors = _build_contextual_distractors(word, definition, level_text, highlights or [])
    seed = sum(ord(ch) for ch in f"{word}|{definition}")
    rng = random.Random(seed)
    quiz = {
        "type": "vocabulary",
        "question": f"다음 중 글에 나온 '{word}'의 뜻으로 가장 알맞은 것은 무엇인가요?",
        "options": [definition, *distractors],
        "answer": 0,
        "explanation": f"'{word}'는 이 글에서 {definition}",
    }
    return _shuffle_quiz_options(quiz)


def _pick_vocabulary_word(level_text, highlights):
    for item in highlights:
        if not isinstance(item, dict):
            continue
        word = clean_highlight_word(item.get("word", ""))
        definition = _fallback_definition(word, highlights)
        if _word_in_text(word, level_text) and definition:
            return word, definition

    return None, None


def _normalize_level_quizzes(level_text, level_quizzes, level_highlights, vocabulary_quiz_builder=None):
    normalized = []
    source_items = level_quizzes if isinstance(level_quizzes, list) else []

    if not source_items:
        if callable(vocabulary_quiz_builder):
            regenerated = vocabulary_quiz_builder(level_text, level_highlights)
            if is_valid_vocabulary_quiz(regenerated, level_text, level_highlights):
                return [_shuffle_quiz_options(regenerated)]
        word, definition = _pick_vocabulary_word(level_text, level_highlights)
        return [_build_vocabulary_quiz(word, definition, level_text, level_highlights)] if word and definition else []

    for item in source_items:
        if not isinstance(item, dict):
            continue
        quiz_type = str(item.get("type", "")).strip()
        if quiz_type != "vocabulary":
            normalized.append(_shuffle_quiz_options(item))
            continue

        options = item.get("options", [])
        answer = item.get("answer")
        quoted_terms = _extract_quoted_terms(item.get("question", ""))
        valid_term = any(_is_clean_vocabulary_term(term, level_text, level_highlights) for term in quoted_terms)
        valid_answer = isinstance(answer, int) and isinstance(options, list) and 0 <= answer < len(options)
        valid_options = isinstance(options, list) and len(options) == 4 and len({str(option).strip() for option in options}) == 4

        if valid_term and valid_answer and valid_options:
            normalized.append(_shuffle_quiz_options(item))
            continue

        if callable(vocabulary_quiz_builder):
            regenerated = vocabulary_quiz_builder(level_text, level_highlights)
            if is_valid_vocabulary_quiz(regenerated, level_text, level_highlights):
                normalized.append(_shuffle_quiz_options(regenerated))
                continue

        word, definition = _pick_vocabulary_word(level_text, level_highlights)
        if word and definition:
            normalized.append(_build_vocabulary_quiz(word, definition, level_text, level_highlights))
        else:
            normalized.append(item)

    return normalized[:3]


def normalize_quizzes(levels, quizzes, highlights, vocabulary_quiz_builder=None):
    """본문에 없는 vocabulary 퀴즈를 자동 교체한다."""
    normalized = {}
    levels = levels if isinstance(levels, dict) else {}
    highlight_map = highlights if isinstance(highlights, dict) else {}
    fallback_quiz_list = quizzes if isinstance(quizzes, list) else []
    quiz_map = quizzes if isinstance(quizzes, dict) else {}

    for level_key, level_text in levels.items():
        level_quizzes = quiz_map.get(level_key, [])
        if not isinstance(level_quizzes, list):
            level_quizzes = []
        if not level_quizzes and isinstance(quiz_map.get("level_1"), list):
            level_quizzes = quiz_map.get("level_1", [])
        if not level_quizzes:
            level_quizzes = fallback_quiz_list

        level_highlights = highlight_map.get(level_key, [])
        if not isinstance(level_highlights, list):
            level_highlights = []
        if not level_highlights and isinstance(highlight_map.get("level_1"), list):
            level_highlights = highlight_map.get("level_1", [])

        normalized[level_key] = _normalize_level_quizzes(
            level_text,
            level_quizzes,
            level_highlights,
            vocabulary_quiz_builder=vocabulary_quiz_builder,
        )

    return normalized
