import os
import httpx
from fastapi import HTTPException
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests
from dotenv import load_dotenv
from sqlalchemy import select
from app.database import AsyncSessionLocal
from app.models.user import User
from app.core.security import create_access_token

load_dotenv()

DEBUG = os.getenv("DEBUG", "false").lower() == "true"
GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")


# ✅ 유저 저장 or 조회
async def get_or_create_user(email: str, name: str, provider: str):
    async with AsyncSessionLocal() as session:
        result = await session.execute(select(User).where(User.email == email))
        user = result.scalar_one_or_none()

        if not user:
            user = User(email=email, name=name, provider=provider)
            session.add(user)
            await session.commit()
            await session.refresh(user)

        access_token = create_access_token({"sub": user.email})

        return {
            "access_token": access_token,
            "token_type": "bearer",
            "email": user.email,
            "name": user.name,
            "provider": user.provider
        }


# ✅ 구글 로그인
async def google_login(token: str):
    if DEBUG and token == "test_google":
        return await get_or_create_user("yuna_test@google.com", "Yuna Google Test", "google")

    try:
        idinfo = id_token.verify_oauth2_token(
            token, google_requests.Request(), GOOGLE_CLIENT_ID
        )
        email = idinfo.get("email")
        if not email:
            raise HTTPException(status_code=400, detail="이메일을 가져올 수 없습니다.")

        return await get_or_create_user(email, idinfo.get("name"), "google")

    except ValueError as e:
        print(f"토큰 검증 실패: {e}")  # 에러 내용 확인용
        raise HTTPException(status_code=400, detail=f"유효하지 않은 구글 토큰: {str(e)}")


# ✅ 카카오 로그인
async def kakao_login(token: str):
    if DEBUG and token == "test_kakao":
        return await get_or_create_user("yuna_test@kakao.com", "Yuna Kakao Test", "kakao")

    async with httpx.AsyncClient(timeout=10.0) as client:
        try:
            res = await client.get(
                "https://kapi.kakao.com/v2/user/me",
                headers={"Authorization": f"Bearer {token}"}
            )
            if res.status_code != 200:
                raise HTTPException(status_code=400, detail="유효하지 않은 카카오 토큰입니다.")

            data = res.json()
            kakao_id = str(data.get("id"))
            nickname = data.get("properties", {}).get("nickname")
            kakao_account = data.get("kakao_account", {})
            email = kakao_account.get("email") or f"{kakao_id}@kakao.com"

            return await get_or_create_user(email, nickname, "kakao")

        except httpx.TimeoutException:
            raise HTTPException(status_code=503, detail="카카오 서버 연결 시간 초과")
        except httpx.RequestError:
            raise HTTPException(status_code=503, detail="카카오 서버에 연결할 수 없습니다.")