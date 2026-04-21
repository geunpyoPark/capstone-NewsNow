# NewsNow AI API Spec

유나 백엔드와 근표 AI 파트 연동용 최소 계약 문서.

이 문서는 "백엔드가 AI를 어떤 입력으로 호출하고, 어떤 구조의 결과를 받는지"를 빠르게 맞추기 위한 참조 문서다.

## 호출 대상

`main_pipeline.generate_news_comic_result`

## 입력

백엔드가 AI에 넘겨야 하는 최소 입력은 기사 제목과 본문이다.

```json
{
  "article_id": 123,
  "title": "기사 제목",
  "body": "정제된 기사 본문",
  "category": "IT과학"
}
```

## 필요 환경변수

- `GEMINI_API_KEY`
- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`
- 선택: `CLOUDINARY_FOLDER`

## Python 호출 예시

```python
from main_pipeline import generate_news_comic_result

result = generate_news_comic_result(
    title=payload["title"],
    body=payload["body"],
    article_id=payload.get("article_id"),
    category=payload.get("category"),
)
```

## 성공 응답

```json
{
  "article_id": 123,
  "story_type": "discovery",
  "analysis": {
    "levels": {
      "level_1": "...",
      "level_2": "...",
      "level_3": "...",
      "level_4": "..."
    },
    "quizzes": [],
    "highlights": []
  },
  "dialogues": {
    "panel_1": "...",
    "panel_2": "...",
    "panel_3": "...",
    "panel_4": "..."
  },
  "storyboard": {
    "character_profile": {},
    "style_profile": {},
    "panels": []
  },
  "bubble_layouts": [],
  "comic_image_path": "https://res.cloudinary.com/...",
  "status": "success",
  "category": "IT과학"
}
```

## 필드 설명

- `story_type`: `problem`, `policy_domestic`, `policy_diplomacy`, `discovery`, `positive` 중 하나
- `analysis.levels`: 난이도별 기사 재구성 결과
- `analysis.quizzes`: 3종 퀴즈 배열
- `analysis.highlights`: 핵심 용어 설명 배열
- `dialogues`: 4컷 말풍선 초안
- `storyboard`: 이미지 생성용 스토리보드 JSON
- `bubble_layouts`: 후처리 말풍선 좌표 정보
- `comic_image_path`: Cloudinary에 업로드된 공개 이미지 URL

## 저장 방식

- 이미지 파일은 로컬 디스크가 아니라 Cloudinary에 업로드된다.
- DB의 `comic_path` 컬럼에는 로컬 경로 대신 Cloudinary 공개 URL이 저장된다.
- 기존 예전 데이터에는 `static/comics/...` 형태 경로가 남아 있을 수 있지만, 새로 생성되는 데이터는 URL 기준이다.

## 에러 처리 권장

현재 함수는 실패 시 예외를 던진다. 백엔드에서는 다음처럼 감싸는 것을 권장한다.

```python
try:
    result = generate_news_comic_result(...)
except Exception as exc:
    result = {
        "status": "error",
        "error_message": str(exc),
    }
```

## 역할 분리 원칙

- 크롤링: 백엔드 또는 수집 파트
- AI 분석/대사/스토리보드/이미지 생성: AI 파트
- DB 저장: 백엔드 또는 별도 저장 모듈
- 운영 이미지 저장소: 추후 Azure Blob Storage 권장
