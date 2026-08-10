# NewsNow | AI 맞춤형 뉴스 이해 서비스

> 어려운 뉴스를 사용자의 이해 수준에 맞게 다시 풀어 주고, 퀴즈와 용어 학습으로 뉴스 읽기를 돕는 모바일 서비스입니다.

## 1. 프로젝트 개요

- **목적**: 어려운 한자어와 전문 용어 때문에 뉴스를 읽기 어려운 사용자의 정보 접근성을 높입니다.
- **대상**: 뉴스 읽기가 익숙하지 않거나 자신의 이해 수준에 맞는 설명이 필요한 전 연령 사용자입니다.
- **형태**: React Native 모바일 앱, FastAPI 서버, AI 분석 파이프라인으로 구성했습니다.
- **핵심 흐름**: 관심 분야 선택 → 진단 퀴즈 → 난이도 설정 → 맞춤 뉴스 읽기 → 용어 확인·스크랩 → 기사 퀴즈 풀이입니다.

### 기술 구성

| 구분 | 사용 기술 | 사용 목적 |
| --- | --- | --- |
| 모바일 앱 | React Native, TypeScript, React Navigation | iOS·Android에서 동작하는 뉴스 앱 구현 |
| 서버 | Python, FastAPI, SQLAlchemy(비동기) | 뉴스·퀴즈·스크랩·로그인 API 제공 |
| 데이터베이스 | PostgreSQL, JSONB | 기사 원문 정보와 난이도별 AI 결과 저장 |
| AI | Gemini, Python | 기사 4단계 재작성, 용어 풀이, 퀴즈, 네컷 뉴스 생성 |
| 이미지 | Diffusers, Pillow, Cloudinary | 네컷 뉴스 이미지 생성 및 공개 URL 저장 |
| 개발 환경 | Docker Compose, PostgreSQL | 로컬 데이터베이스 실행 |

## 2. 구현 화면

### 전체 UI

홈 화면, 레벨별 뉴스 목록, 네컷 뉴스, 마이페이지로 이어지는 주요 사용자 화면입니다.

![NewsNow 전체 UI](docs/images/newsnow-overall-ui.png)

### 시스템 설계 구조

모바일 앱, FastAPI 서버, PostgreSQL, Cloudinary, Gemini 기반 AI 파이프라인의 데이터 흐름입니다.

![NewsNow 시스템 설계 구조](docs/images/newsnow-system-architecture.png)

### 레벨별 뉴스 재해석

동일한 기사를 사용자 이해 수준에 맞춰 1~4단계 난이도로 재작성하고, 핵심 단어와 퀴즈를 함께 제공하는 화면입니다.

![NewsNow 레벨별 뉴스 재해석](docs/images/newsnow-level-news.png)

### 단어 및 뉴스 스크랩

기사 속 하이라이트 단어를 확인하고, 관심 기사와 단어를 마이페이지에서 다시 볼 수 있는 학습 흐름입니다.

![NewsNow 단어 및 뉴스 스크랩](docs/images/newsnow-scrap-learning.png)

## 3. 문제 정의

일반 뉴스는 한자어, 경제·정치 용어, 긴 문장으로 구성되는 경우가 많아 사용자가 핵심 내용을 이해하기 어렵습니다. 단순 요약만 제공하면 사용자의 읽기 수준 차이와 용어 학습 요구를 해결하기 어렵습니다.

NewsNow는 이 문제를 다음 방식으로 해결합니다.

1. 관심 분야별 진단 퀴즈로 사용자의 초기 난이도를 정합니다.
2. 같은 기사를 1~4단계 난이도로 다시 작성해 사용자 수준에 맞춰 보여 줍니다.
3. 어려운 단어를 누르면 기사 문맥에 맞는 쉬운 뜻을 보여 줍니다.
4. 읽은 뒤 퀴즈를 제공하고, 단어·기사를 스크랩해 반복 학습을 지원합니다.

## 4. 주요 기능

| 기능 | 설명 | 구현 근거 |
| --- | --- | --- |
| 관심 분야·초기 진단 | 정치·경제·사회·IT/과학 퀴즈 결과로 난이도를 계산합니다. | `QuizScreen.tsx`, `quiz_service.py` |
| 난이도별 뉴스 | 서버가 `level_1`~`level_4` 본문 중 요청한 단계의 내용을 돌려줍니다. 쉬운 단계에서는 일부 한자 제목도 읽기 쉽게 바꿉니다. | `news_service.py`, `news.py` |
| 문맥형 용어 풀이 | AI가 레벨별 핵심 용어와 쉬운 정의를 만들고, 앱에서 본문 속 단어를 눌러 확인합니다. | `news_analyzer.py`, `NewsDetailScreen.tsx` |
| 기사 이해 퀴즈 | 난이도별 어휘·맥락·요약 퀴즈를 생성하고, 풀이 결과를 저장합니다. | `news_analyzer.py`, `quiz_service.py` |
| 스크랩 | 기사, 용어, 기사별 퀴즈 결과를 사용자 이메일 기준으로 저장·조회합니다. | `scrap.py`, `scrap_service.py` |
| 네컷 뉴스 | 기사 내용을 4컷 스토리보드와 만화로 만들고 이미지 URL을 저장해 제공합니다. | `main_pipeline.py`, `comic_generator.py`, `image_storage.py` |
| 소셜 로그인 | Google·Kakao 토큰을 받아 로그인 처리를 제공합니다. | `auth.py`, `auth_service.py` |

## 5. 트러블 슈팅

### 1) Azure PostgreSQL 생성이 정책 오류로 실패

- **문제**: Azure PostgreSQL Flexible Server 생성 시 정책 위반 오류가 발생했습니다.
- **확인 과정**: 리전, 서버 사양, 고가용성, 네트워크 설정을 바꿔도 실패했고 활동 로그에서 `deny` 정책 동작을 확인했습니다.
- **결론 및 대응**: 설정 오류가 아니라 학생 구독 또는 학교 조직 정책의 제한으로 판단했습니다. Azure DB 직접 생성 대신 앱 서버와 DB를 분리하는 배포 방식을 검토했습니다.
- **배운 점**: 클라우드 배포 오류는 코드뿐 아니라 권한과 구독 정책부터 확인해야 합니다.

### 2) 만화 이미지를 로컬 경로로만 저장

- **문제**: DB에 `static/comics/...` 같은 로컬 경로만 저장돼 다른 서버나 팀원이 이미지를 볼 수 없었습니다.
- **원인**: 이미지 생성 함수가 로컬 파일을 저장한 뒤 그 경로 문자열만 반환했습니다.
- **해결**: Cloudinary 업로드 후 공개 URL을 DB의 `comic_path`에 저장하도록 구조를 바꿨습니다.
- **배운 점**: 이미지 파일은 DB와 별도로, 배포 환경에서도 접근 가능한 저장소 전략이 필요합니다.

### 3) Cloudinary 업로드 중 401 오류

- **문제**: 이미지 생성 뒤 Cloudinary 업로드 단계에서 `401 Unauthorized`가 발생했습니다.
- **원인**: API에서 사용하는 `cloud_name`과 대시보드에서 확인한 값을 혼동했습니다.
- **해결**: 응답 본문과 최소한의 설정 확인 로그로 실제 읽힌 값을 점검한 뒤 올바른 `cloud_name`으로 수정했습니다. 업로드된 이미지와 DB URL 저장까지 확인했습니다.
- **배운 점**: 인증 오류는 키만의 문제가 아닐 수 있으므로 외부 서비스의 응답 내용을 확인해 원인을 좁혀야 합니다.

### 4) AI 응답 품질과 호출 제한 대응

- **문제**: AI 응답에 깨진 문자나 근거 없는 해석이 포함되거나 호출 제한(429·503)이 발생할 수 있었습니다.
- **해결**: 결과 검증 규칙을 두고, 호출 제한과 검증에 실패한 일부 응답은 최대 5회 재시도하도록 구현했습니다. 대기 시간은 호출이 반복될수록 늘어나게 했습니다.
- **배운 점**: 생성형 AI 기능은 요청만 보내는 것으로 끝나지 않으며, 결과 검증과 재시도 정책이 함께 필요합니다.

## 6. 설치 및 실행

### 사전 준비

- Docker Desktop, Python 3, Node.js 22 이상, npm
- Android Emulator 또는 iOS Simulator
- Google·Kakao 로그인과 AI 기능을 사용할 경우 각 서비스의 발급 키

### 1) 데이터베이스 실행

프로젝트 최상위 폴더에서 실행합니다.

```bash
docker compose up -d
```

PostgreSQL은 `localhost:5432`에서 실행됩니다.

> 참고: Docker Compose에는 Redis 컨테이너 설정도 남아 있지만, 현재 서버와 앱 코드에서는 Redis에 연결하거나 데이터를 저장하지 않습니다. 뉴스 목록과 사용자 난이도는 앱이 실행 중인 동안만 `Map` 기반 메모리 캐시에 2분간 보관합니다.

### 2) 백엔드 실행

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

`backend/.env` 파일을 만들고 최소한 아래 값을 설정합니다. 실제 비밀번호·키는 저장소에 올리지 않습니다.

```env
DATABASE_URL=postgresql://newsuser:newspassword@localhost:5432/newsnow
SECRET_KEY=local-development-secret
```

그다음 서버를 실행합니다.

```bash
uvicorn app.main:app --reload
```

서버는 기본적으로 `http://localhost:8000`에서 실행됩니다. 시작 시 필요한 테이블을 자동으로 만듭니다.

### 3) 모바일 앱 실행

별도 터미널에서 실행합니다.

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

Android Emulator에서는 [`src/config/api.ts`](frontend/NewsNowApp/src/config/api.ts)의 서버 주소를 `http://10.0.2.2:8000`으로 바꿔야 로컬 백엔드에 연결됩니다.

### 4) AI·네컷 뉴스 기능 설정

`AI/.env.example`을 참고해 Gemini, Naver, Cloudinary, DB 설정을 준비합니다. AI 파이프라인은 `google-genai`, `google-generativeai`, `tenacity`, `beautifulsoup4`, `torch`, `diffusers`, `Pillow` 등의 별도 패키지를 사용합니다.

> 주의: AI 폴더에는 별도의 의존성 목록 파일이 없어, 현재 상태만으로는 AI 기능을 한 번에 설치하는 명령을 보장할 수 없습니다. 재현성을 높이려면 `AI/requirements.txt`를 추가하는 작업이 필요합니다.

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
│   ├── check_db_quality.py     # 기존 AI 결과 품질 점검
│   ├── backfill_quizzes.py     # 누락된 퀴즈 데이터 보정
│   └── backfill_highlights.py  # 누락된 핵심 단어 데이터 보정
├── docker-compose.yml          # PostgreSQL 및 현재 미사용 Redis 컨테이너 설정
└── README.md                   # 프로젝트 소개 문서
```

## 8. 담당 역할

**팀장 · AI / Data Pipeline**

- 네이버 뉴스 검색 결과를 수집하고 기사 본문을 정제하는 Python 크롤링 모듈 구현
- Gemini를 활용해 수준별 뉴스, 퀴즈, 핵심 단어를 생성하는 AI 파이프라인 구현
- AI 분석 결과와 4컷 스토리보드에 필요한 필수 항목을 검증하는 로직 구현
- 생성 이미지를 Cloudinary에 업로드하고 공개 URL을 데이터베이스에 저장하는 흐름 구현
- AI 파트와 FastAPI 백엔드가 제목·본문·분석 결과를 주고받을 수 있도록 API 연동 규격 문서화

## 9. 보안 점검 메모

현재 작업 폴더의 환경설정 파일에 외부 서비스 키와 DB 접속 정보가 실제 값으로 들어가 있습니다. 이미 노출됐을 가능성을 고려해 해당 키와 비밀번호를 교체하고, 추적 대상이 아닌지 `git status --ignored`로 다시 확인해야 합니다. 포트폴리오 공개 전에는 `.env.example`만 남겨야 합니다.
