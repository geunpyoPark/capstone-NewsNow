# NewsNow

> AI를 활용해 뉴스의 난이도를 조절하고, 이해를 돕는 학습 요소를 제공하는 뉴스 리팩토링 서비스

## 프로젝트 소개

뉴스에는 어려운 한자어와 전문 용어가 많아 읽기는 가능해도 의미를 이해하기 어려운 경우가 있습니다.  
NewsNow는 사용자의 어휘 수준에 맞춰 뉴스 원문을 4단계 난이도로 재구성하고, 핵심 단어와 퀴즈를 제공해 뉴스 이해를 돕는 모바일 서비스입니다.

## 문제를 해결한 방식

| 문제 | 해결 방식 |
| --- | --- |
| 뉴스의 난이도가 사용자마다 다름 | Gemini를 활용해 기사 내용을 4단계 난이도로 재구성 |
| AI 응답 형식이 달라 화면에 바로 표시하기 어려움 | 응답의 형식과 품질을 검사하고, 기준에 맞지 않으면 재시도 처리 |
| AI 분석 결과가 서비스 데이터와 분리됨 | 분석 결과를 저장하고 사용자 난이도에 맞춰 조회하는 흐름 구성 |
| 읽기만으로 이해도를 확인하기 어려움 | 핵심 단어 풀이와 이해도 퀴즈 제공 |

## 핵심 기능

- 뉴스 원문을 4단계 난이도로 재구성
- 맥락 기반 핵심 단어 풀이
- 이해도 퀴즈와 정답률 확인
- 개인 용어 스크랩 및 학습 리포트
- Google·Kakao 소셜 로그인

## 나의 역할

**팀장 · AI & Data Engine**

- 기사 제목과 본문을 수집하는 BeautifulSoup4 기반 뉴스 크롤링 흐름 구현
- FastAPI 기반 AI API에서 Gemini를 활용한 뉴스 재구성 및 퀴즈 생성 흐름 구현
- AI 응답의 형식과 품질을 점검하고 재시도 처리 추가
- AI 분석 결과를 데이터베이스에 저장하고, 앱에서 사용자 난이도별 콘텐츠를 조회하는 흐름 연동
- Docker Compose 기반의 팀 실행 환경을 점검하고 작업 흐름 조율

## 시스템 구성

    React Native App
       │
       ├── Spring Boot
       │   └── 사용자 데이터 · 인증 · 권한 관리
       │
       └── FastAPI
           ├── 뉴스 수집 · AI 분석 · 퀴즈 생성
           ├── Gemini
           └── PostgreSQL (JSONB)

## 기술 스택

| 구분 | 기술 |
| --- | --- |
| App | React Native, TypeScript |
| Main Backend | Java, Spring Boot, Spring Security |
| AI API | Python, FastAPI, Gemini, BeautifulSoup4 |
| Data | PostgreSQL, JSONB |
| Auth | Google OAuth 2.0, Kakao OAuth 2.0 |
| Environment | Docker Compose |

## 프로젝트 구조

| 경로 | 내용 |
| --- | --- |
| frontend/ | React Native 기반 모바일 앱 |
| backend/ | Spring Boot 기반 사용자·인증 서버 |
| AI/ | FastAPI 기반 뉴스 수집 및 AI 분석 서비스 |

## 팀 구성

| 역할 | 담당 |
| --- | --- |
| 팀장 · AI & Data Engine | 박근표 |
| Backend / Frontend | 팀원 |
| Backend / Data | 팀원 |

## License

MIT License
