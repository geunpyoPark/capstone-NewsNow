# AI Troubleshooting Log

AI 파트 작업 중 실제로 겪은 문제와 해결 과정을 기록한 문서.
포트폴리오나 회고 자료로 재사용할 수 있도록 문제, 원인, 해결을 분리해서 남긴다.

---

## 2026-04-17

### 1. Azure PostgreSQL Flexible Server 생성 실패

**문제**
- Azure Portal에서 `Azure Database for PostgreSQL Flexible Server` 생성 시
  `The template deployment failed because of policy violation` 오류가 발생했다.

**증상**
- `Korea South`에서 시작했을 때도 실패
- 리소스 그룹을 `Japan East`로 새로 만들어 다시 시도해도 실패
- 활동 로그에서 `Validate Deployment`, `'deny' Policy action.`이 확인됐다.

**원인 추정**
- 단순 리전 미지원 문제가 아니라, `Azure for Students` + 학교 조직 정책에서
  PostgreSQL Flexible Server 생성이 차단된 것으로 판단했다.

**대응**
- 리전 문제인지 정책 문제인지 구분하기 위해:
  - 리소스 그룹 리전 변경
  - PostgreSQL 설정 축소 (`B1ms`, `32GiB`, 고가용성 끔)
  - 네트워킹 공개 접근 최소화
  를 모두 시도했다.

**해결/결론**
- 설정 문제가 아니라 구독/정책 차단 가능성이 높다고 결론 내렸다.
- Azure 내 PostgreSQL 직접 생성은 포기하고,
  앱 서버와 DB를 분리하는 방향을 검토하게 됐다.

**배운 점**
- 클라우드 배포 문제는 코드 문제가 아니라
  `구독 정책`, `조직 정책`, `권한` 문제일 수 있다.
- `policy violation`이 뜨면 리소스 설정만 바꿔보기보다
  활동 로그의 `deny policy action`부터 확인해야 한다.

---

## 2026-04-18

### 2. 이미지가 로컬에만 저장되는 구조 문제 확인

**문제**
- 생성된 만화 이미지가 로컬 디스크에만 저장되고,
  DB에는 로컬 파일 경로만 저장되는 구조였다.

**증상**
- DB `comic_path`에 `static/comics/...` 형태 경로가 저장됨
- 다른 서버나 팀원이 접근할 수 없는 경로였음

**원인**
- 기존 코드가 `save_comic_image(...)`에서
  로컬 파일 저장 후 경로 문자열만 반환하도록 작성되어 있었다.

**대응**
- 현재 저장 구조를 점검하고
  백엔드 배포 기준으로는 로컬 경로 저장이 적절하지 않다고 판단했다.
- 해결 방향을 `로컬 저장 -> 클라우드 업로드 후 URL 저장`으로 정리했다.

**해결/결론**
- Cloudinary를 도입해 이미지 파일을 외부에 저장하고,
  DB에는 접근 가능한 공개 URL을 저장하는 구조로 방향을 확정했다.

**배운 점**
- 개발 단계에서 편한 저장 방식이 배포 단계에서는 바로 병목이 된다.
- 텍스트 데이터가 DB에 들어간다고 해서 저장 구조가 완성된 것은 아니다.
- 이미지/파일은 별도 저장 전략이 필요하다.

---

## 2026-04-21

### 3. Cloudinary 업로드 도입 중 401 Unauthorized 발생

**문제**
- Cloudinary 업로드 코드를 붙인 뒤 이미지 생성은 되지만,
  업로드 단계에서 `401 Unauthorized`가 발생했다.

**증상**
- 로그:
  - `401 Client Error: Unauthorized`
  - `Invalid cloud_name ...`

**원인**
- `.env`에 입력한 `CLOUDINARY_CLOUD_NAME`이 실제 업로드용 cloud name과 달랐다.
- 대시보드에서 보이는 식별자와 실제 API용 cloud name을 혼동했다.

**대응**
- 업로드 함수에 최소한의 디버그 로그를 추가해
  어떤 설정값이 실제로 읽히는지 확인했다.
- Cloudinary 응답 본문을 출력해
  인증 자체가 아니라 `cloud_name` 문제임을 정확히 확인했다.
- 올바른 cloud name으로 `.env`를 수정했다.

**해결**
- Cloudinary `Assets`에 업로드된 이미지를 확인했다.
- 이후 DB 최신 레코드의 `comic_path`가
  `https://res.cloudinary.com/...` 형태 URL로 저장되는 것을 확인했다.

**배운 점**
- 인증 오류라고 해서 항상 API key/secret 문제가 아니다.
- 외부 서비스 연동 시에는 응답 본문을 정확히 확인해야
  원인을 빠르게 좁힐 수 있다.
- 민감 정보는 노출하지 않으면서도,
  어떤 값이 읽혔는지 확인 가능한 최소 디버그가 유용하다.

---

### 4. DB 확인 과정에서 SQL 실행 환경 혼동

**문제**
- 터미널에서 바로 SQL을 실행하려고 하다가
  `zsh: command not found: SELECT` 오류가 발생했다.

**원인**
- SQL은 셸에서 직접 실행하는 게 아니라
  `psql`이나 DBeaver 같은 DB 클라이언트 내부에서 실행해야 한다.
- 또한 로컬 환경에 `psql`이 설치되어 있지 않았다.

**대응**
- DBeaver에서 `newsnow` DB에 접속한 뒤
  SQL Editor에서 직접 쿼리를 실행해 확인했다.

**해결**
- 다음 쿼리로 최신 데이터의 `comic_path` 값을 검증했다.

```sql
SELECT id, title, comic_path
FROM news_articles
ORDER BY id DESC
LIMIT 5;
```

**배운 점**
- 운영/디버깅 과정에서는 “도구 선택”도 중요하다.
- 로컬에 `psql`이 없어도 GUI 클라이언트 하나면 충분히 검증 가능하다.

---

## 현재 정리

- 예전 데이터: `comic_path = static/comics/...`
- 현재 새 데이터: `comic_path = Cloudinary URL`
- AI 파트의 남은 핵심은 유나와 백엔드 연동을 맞추는 것

## 기록 원칙

앞으로도 커밋 직전까지 겪은 이슈를 아래 형식으로 추가한다.

```md
## YYYY-MM-DD

### 문제 제목
**문제**
...

**원인**
...

**해결**
...

**배운 점**
...
```
