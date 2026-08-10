# NewsNow

> 어려운 뉴스를 사용자의 이해 수준에 맞게 다시 풀어 주고, 퀴즈와 용어 학습으로 뉴스 읽기를 돕는 AI 맞춤형 뉴스 이해 서비스

## 1. 프로젝트 개요

**NewsNow**는 한자어, 경제·정치 용어, 긴 문장 때문에 뉴스를 이해하기 어려운 사용자를 위해 기사를 난이도별로 다시 설명해 주는 모바일 서비스입니다.

사용자는 관심 분야를 선택하고 진단 퀴즈를 풀어 자신의 초기 난이도를 설정합니다. 이후 같은 뉴스도 1~4단계 난이도로 읽을 수 있으며, 기사 속 어려운 용어를 확인하고 퀴즈와 스크랩 기능으로 반복 학습할 수 있습니다.

- 개발 형태: 캡스톤 프로젝트
- 개발 분야: React Native 모바일 앱, FastAPI 서버, AI 뉴스 분석 파이프라인
- 주요 흐름: 관심 분야 선택 -> 진단 퀴즈 -> 난이도 설정 -> 맞춤 뉴스 읽기 -> 용어 확인·스크랩 -> 기사 퀴즈 풀이
- 주요 기술: React Native, TypeScript, FastAPI, PostgreSQL, SQLAlchemy, Gemini, Diffusers, Cloudinary, Docker Compose

## 2. 문제 정의

일반 뉴스는 전문 용어와 긴 문장이 많아 사용자가 핵심 내용을 이해하기 어렵습니다. 단순 요약만 제공하면 사용자의 읽기 수준 차이와 용어 학습 요구를 해결하기 어렵습니다.

NewsNow는 다음 문제를 해결하고자 했습니다.

- 사용자마다 뉴스 이해 수준이 다름
- 한자어와 전문 용어 때문에 기사 내용을 따라가기 어려움
- 단순 요약만으로는 뉴스 맥락과 배경 지식을 학습하기 어려움
- AI가 생성한 결과의 형식과 품질이 일정하지 않을 수 있음
- 생성된 네컷 뉴스 이미지를 배포 환경에서도 안정적으로 보여 줘야 함

## 3. 주요 기능

### 사용자 기능

- 관심 분야 및 초기 진단
  - 정치, 경제, 사회, IT/과학 관심 분야 선택
  - 진단 퀴즈 결과를 바탕으로 사용자 초기 난이도 계산

- 난이도별 뉴스 읽기
  - 같은 기사를 1~4단계 난이도로 제공
  - 쉬운 단계에서는 어려운 제목과 본문을 더 쉬운 표현으로 재작성

- 문맥형 용어 풀이
  - 기사 본문 속 핵심 단어를 선택해 쉬운 뜻 확인
  - 기사 문맥에 맞는 용어 설명 제공

- 기사 이해 퀴즈
  - 난이도별 어휘, 맥락, 요약 퀴즈 제공
  - 풀이 결과를 저장해 학습 기록으로 활용

- 스크랩
  - 기사, 용어, 퀴즈 결과를 사용자 이메일 기준으로 저장
  - 마이페이지에서 학습 활동과 스크랩 데이터 확인

### AI 및 데이터 기능

- 뉴스 수집 및 본문 정제
  - Naver News API와 BeautifulSoup4를 이용해 기사 수집
  - 기사 본문을 분석 가능한 형태로 정제

- AI 기반 뉴스 재작성
  - Gemini를 이용해 기사 4단계 재작성
  - 핵심 용어, 용어 설명, 기사 퀴즈 생성
  - AI 결과의 필수 항목과 형식을 검증

- 네컷 뉴스 생성
  - 기사 내용을 4컷 스토리보드로 변환
  - Diffusers와 Pillow 기반 이미지 생성
  - Cloudinary 업로드 후 공개 URL 저장

- 로그인 및 데이터 저장
  - Google, Kakao 소셜 로그인 처리
  - PostgreSQL에 뉴스, 사용자, 스크랩, 퀴즈 결과 저장
  - JSONB를 활용해 난이도별 AI 분석 결과 저장

## 4. 기술 구성

| 구분 | 사용 기술 | 사용 목적 |
| --- | --- | --- |
| 모바일 앱 | React Native, TypeScript, React Navigation | iOS·Android 뉴스 앱 구현 |
| 서버 | Python, FastAPI, SQLAlchemy | 뉴스·퀴즈·스크랩·로그인 API 제공 |
| 데이터베이스 | PostgreSQL, JSONB | 기사 원문과 난이도별 AI 결과 저장 |
| AI | Gemini, Python | 기사 재작성, 용어 풀이, 퀴즈, 네컷 뉴스 생성 |
| 이미지 | Diffusers, Pillow, Cloudinary | 네컷 뉴스 이미지 생성 및 공개 URL 저장 |
| 개발 환경 | Docker Compose, Redis, PostgreSQL | 로컬 데이터베이스와 캐시 서버 실행 |

## 5. 트러블 슈팅

| 문제 | 발생 부분 | 해결 방법 |
| --- | --- | --- |
| Azure PostgreSQL 생성이 정책 오류로 실패 | 클라우드 DB 배포 | 리전, 서버 사양, 고가용성, 네트워크 설정을 바꿔도 실패해 활동 로그의 `deny` 정책을 확인했고, 학생 구독 또는 학교 조직 정책 제한으로 판단해 앱 서버와 DB를 분리하는 배포 방식을 검토 |
| 만화 이미지를 로컬 경로로만 저장 | `AI/comic_generator.py`, `AI/image_storage.py` | `static/comics/...` 같은 로컬 경로 대신 Cloudinary 업로드 후 공개 URL을 DB의 `comic_path`에 저장하도록 변경 |
| Cloudinary 업로드 중 401 오류 발생 | Cloudinary 이미지 업로드 | API에서 사용하는 `cloud_name`과 대시보드 값을 다시 확인하고, 실제 읽힌 설정 값을 점검해 올바른 값으로 수정 |
| AI 응답 품질과 호출 제한 대응 필요 | `AI/news_analyzer.py` | 깨진 문자, 누락 필드, 형식 오류를 검증하고 429·503 같은 호출 제한이나 검증 실패 시 최대 5회 재시도하도록 처리 |
| AI 결과 형식이 일정하지 않음 | AI 분석 파이프라인 | 난이도별 기사, 퀴즈, 핵심 단어, 스토리보드의 필수 항목을 검증해 서버와 앱에서 사용할 수 있는 구조로 맞춤 |

## 6. 설치 및 실행

### 사전 준비

- Docker Desktop
- Python 3
- Node.js 22 이상
- Android Emulator 또는 iOS Simulator
- Google·Kakao 로그인과 AI 기능을 사용할 경우 각 서비스의 발급 키

### 데이터베이스와 캐시 실행

프로젝트 최상위 폴더에서 실행합니다.

```bash
docker compose up -d
```

PostgreSQL은 `localhost:5432`, Redis는 `localhost:6379`에서 실행됩니다.

### 백엔드 실행

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

백엔드는 기본적으로 `http://localhost:8000`에서 실행됩니다.

`backend/.env` 파일에는 최소한 아래 값을 설정합니다. 실제 비밀번호와 API 키는 저장소에 올리지 않습니다.

```env
DATABASE_URL=postgresql://newsuser:newspassword@localhost:5432/newsnow
SECRET_KEY=local-development-secret
```

### 모바일 앱 실행

```bash
cd frontend/NewsNowApp
npm install
npm start
```

새 터미널에서 플랫폼별로 실행합니다.

```bash
npm run ios
# 또는
npm run android
```

Android Emulator에서는 [`frontend/NewsNowApp/src/config/api.ts`](frontend/NewsNowApp/src/config/api.ts)의 서버 주소를 `http://10.0.2.2:8000`으로 바꾸면 로컬 백엔드에 연결할 수 있습니다.

### AI 기능 설정

`AI/.env.example`을 참고해 Gemini, Naver, Cloudinary, DB 설정을 준비합니다.

AI 파이프라인은 `google-genai`, `google-generativeai`, `tenacity`, `beautifulsoup4`, `torch`, `diffusers`, `Pillow` 등의 패키지를 사용합니다. 현재 AI 폴더에는 별도의 의존성 목록 파일이 없으므로, 재현성을 높이려면 `AI/requirements.txt`를 추가하는 작업이 필요합니다.

## 7. 프로젝트 구조

```text
capstone-NewsNow/
├── frontend/NewsNowApp/        # React Native 모바일 앱
│   ├── src/screens/            # 로그인, 진단, 뉴스, 퀴즈, 스크랩 화면
│   ├── src/components/         # 뉴스 카드, 레벨 표시 등 공통 UI
│   ├── src/context/            # 사용자·난이도·스크랩 상태 관리
│   ├── src/navigation/         # 화면 이동과 하단 탭
│   └── src/utils/              # API 호출, 날짜 처리
├── backend/                    # FastAPI 서버
│   ├── app/routes/             # 뉴스, 로그인, 퀴즈, 스크랩, AI API
│   ├── app/services/           # 조회·저장 비즈니스 로직
│   ├── app/models/             # PostgreSQL 테이블 모델
│   ├── app/schemas/            # 요청·응답 데이터 형식
│   ├── app/database.py         # 비동기 DB 연결 설정
│   └── app/main.py             # 서버 시작점
├── AI/                         # 뉴스 수집·분석·만화 생성
│   ├── main_pipeline.py        # 전체 AI 처리 흐름
│   ├── news_analyzer.py        # 난이도별 기사·용어·퀴즈 생성
│   ├── news_crawler.py         # 뉴스 수집
│   ├── comic_generator.py      # 네컷 뉴스 이미지 생성
│   ├── image_storage.py        # Cloudinary 업로드
│   ├── check_db_quality.py     # AI 결과 품질 점검
│   └── backfill_quizzes.py     # 기존 데이터 보정 스크립트
├── docker-compose.yml          # PostgreSQL·Redis 로컬 실행 설정
└── README.md                   # 프로젝트 안내 문서
```

## 8. 담당 역할

**팀장 · AI / Data Pipeline**

- 네이버 뉴스 검색 결과를 수집하고 기사 본문을 정제하는 Python 크롤링 모듈 구현
- Gemini를 활용해 수준별 뉴스, 퀴즈, 핵심 단어를 생성하는 AI 파이프라인 구현
- AI 분석 결과와 4컷 스토리보드에 필요한 필수 항목을 검증하는 로직 구현
- 생성 이미지를 Cloudinary에 업로드하고 공개 URL을 데이터베이스에 저장하는 흐름 구현
- AI 파트와 FastAPI 백엔드가 제목·본문·분석 결과를 주고받을 수 있도록 API 연동 규격 문서화

## 9. 보안 메모

외부 서비스 키, DB 접속 정보, 소셜 로그인 키는 `.env`로 분리하고 저장소에는 `.env.example`만 남깁니다. 공개 포트폴리오에 올리기 전에는 실제 키가 커밋되지 않았는지 확인해야 합니다.
