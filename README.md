# NewsNow

> AI를 활용해 뉴스를 사용자 수준에 맞게 다시 설명하고, 퀴즈와 4컷 뉴스로 이해를 돕는 모바일 서비스

## 프로젝트 소개

뉴스에는 어려운 한자어와 전문 용어가 많아 읽기는 가능해도 내용을 이해하기 어려운 경우가 있습니다.  
NewsNow는 사용자의 학습 수준에 맞춰 기사 내용을 4단계로 재구성하고, 핵심 단어·이해도 퀴즈·4컷 뉴스를 제공하는 서비스입니다.

## 문제를 해결한 방식

| 문제 | 구현 방식 |
| --- | --- |
| 뉴스 난이도가 사용자마다 다름 | Gemini 분석 결과로 기사를 4단계 수준으로 재구성 |
| 기사 핵심을 빠르게 이해하기 어려움 | 핵심 단어 풀이와 수준별 퀴즈 제공 |
| 텍스트 뉴스만으로 흥미를 유지하기 어려움 | 기사 내용을 바탕으로 4컷 뉴스 스토리보드와 이미지를 생성 |
| AI 결과 형식이 일정하지 않음 | 단계별 기사·퀴즈·핵심 단어·스토리보드의 필수 항목을 검증 |

## 핵심 기능

- 네이버 뉴스 검색 API와 BeautifulSoup4를 이용한 기사 수집 및 본문 정제
- Gemini 기반 4단계 뉴스 재구성
- 수준별 핵심 단어 풀이 및 이해도 퀴즈
- 4컷 뉴스 스토리보드 생성과 이미지 업로드
- Google·Kakao 로그인, 학습 결과 및 기사·단어 스크랩

## 나의 역할

**팀장 · AI / Data Pipeline**

- 네이버 뉴스 검색 결과를 수집하고 기사 본문을 정제하는 Python 크롤링 모듈 구현
- Gemini를 활용해 수준별 뉴스, 퀴즈, 핵심 단어를 생성하는 AI 파이프라인 구현
- AI 분석 결과와 4컷 스토리보드에 필요한 필수 항목을 검증하는 로직 구현
- 생성 이미지를 Cloudinary에 업로드하고 공개 URL을 데이터베이스에 저장하는 흐름 구현
- AI 파트와 FastAPI 백엔드가 제목·본문·분석 결과를 주고받을 수 있도록 API 연동 규격 문서화

## 시스템 구성

    React Native App
           │
           ▼
    Python FastAPI Backend
       ├── 로그인 · 뉴스 · 퀴즈 · 스크랩 API
       ├── PostgreSQL
       │
       └── AI Pipeline
           ├── Naver News API · BeautifulSoup4
           ├── Gemini
           └── Cloudinary

## 기술 스택

| 구분 | 기술 |
| --- | --- |
| App | React Native, TypeScript |
| Backend | Python, FastAPI, Uvicorn |
| Data | PostgreSQL, SQLAlchemy, asyncpg |
| AI / Data | Gemini, BeautifulSoup4, Requests |
| Image Storage | Cloudinary |
| Environment | Docker Compose, Redis |

## 프로젝트 구조

| 경로 | 내용 |
| --- | --- |
| frontend/ | React Native 기반 모바일 앱 |
| backend/ | FastAPI 기반 로그인·뉴스·퀴즈·스크랩 API |
| AI/ | 뉴스 수집, Gemini 분석, 4컷 뉴스 생성 및 데이터 저장 파이프라인 |

## 팀 구성

| 역할 | 담당 |
| --- | --- |
| 팀장 · AI / Data Pipeline | 박근표 |
| Backend / Frontend | 팀원 |
| Backend / Data | 팀원 |

## License

MIT License
