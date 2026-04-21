# AI Handoff Note

유나에게 전달할 핵심만 짧게 정리한 메모.

## 현재 상태

- AI 파이프라인 호출 진입점: `main_pipeline.generate_news_comic_result(...)`
- 재해석 뉴스, 퀴즈, 하이라이트, 스토리보드는 DB에 저장됨
- 생성된 만화 이미지는 로컬 디스크가 아니라 Cloudinary에 업로드됨
- DB `news_articles.comic_path`에는 로컬 경로가 아니라 Cloudinary 공개 URL이 저장됨

## 유나가 알면 되는 것

- 백엔드는 `title`, `body`를 AI에 넘기면 됨
- AI 응답의 `comic_image_path`는 바로 프론트에 내려줄 수 있는 URL임
- 예전 데이터에는 `static/comics/...` 경로가 남아 있을 수 있지만, 새 데이터는 URL 기준임

## 필요한 환경변수

- `GEMINI_API_KEY`
- `NAVER_CLIENT_ID`
- `NAVER_CLIENT_SECRET`
- `DB_HOST`
- `DB_NAME`
- `DB_USER`
- `DB_PASSWORD`
- `DB_PORT`
- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`
- 선택: `CLOUDINARY_FOLDER`

## 참고 문서

- API 스펙: `AI_API_SPEC.md`
- DB 저장 모듈: `ai_db.py`
- 이미지 업로드 모듈: `image_storage.py`
