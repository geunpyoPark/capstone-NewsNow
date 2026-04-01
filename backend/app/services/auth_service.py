import httpx
from fastapi import HTTPException

# ✅ 구글 로그인 로직
async def google_login(token: str):
    # 1. 테스트를 위한 가짜 토큰 처리 (프론트 연결 전까지 유용해요!)
    if token == "test_google":
        return {
            "email": "yuna_test@google.com",
            "name": "Yuna Google Test",
            "provider": "google"
        }

    # 2. 실제 구글 API 호출
    async with httpx.AsyncClient(timeout=10.0) as client:
        try:
            res = await client.get(
                "https://www.googleapis.com/oauth2/v2/userinfo",
                headers={"Authorization": f"Bearer {token}"}
            )
            
            # 응답 코드가 200(성공)이 아니면 에러 발생
            if res.status_code != 200:
                raise HTTPException(status_code=400, detail="유효하지 않은 구글 토큰입니다.")

            user_info = res.json()
            return {
                "email": user_info.get("email"),
                "name": user_info.get("name"),
                "provider": "google"
            }
        except httpx.ConnectTimeout:
            raise HTTPException(status_code=503, detail="구글 서버 연결 시간 초과 (네트워크 확인)")


# ✅ 카카오 로그인 로직
async def kakao_login(token: str):
    # 1. 테스트를 위한 가짜 토큰 처리
    if token == "test_kakao":
        return {
            "email": "yuna_test@kakao.com",
            "provider": "kakao"
        }

    # 2. 실제 카카오 API 호출
    async with httpx.AsyncClient(timeout=10.0) as client:
        try:
            res = await client.get(
                "https://kapi.kakao.com/v2/user/me",
                headers={"Authorization": f"Bearer {token}"}
            )

            if res.status_code != 200:
                raise HTTPException(status_code=400, detail="유효하지 않은 카카오 토큰입니다.")

            data = res.json()
            kakao_account = data.get("kakao_account", {})

            return {
                "email": kakao_account.get("email"),
                "provider": "kakao"
            }
        except httpx.ConnectTimeout:
            raise HTTPException(status_code=503, detail="카카오 서버 연결 시간 초과 (네트워크 확인)")