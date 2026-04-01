from fastapi import APIRouter
from pydantic import BaseModel
from app.services.auth_service import google_login, kakao_login

router = APIRouter(prefix="/auth", tags=["auth"])

# 요청 body 형태 정의
class TokenRequest(BaseModel):
    token: str


@router.post("/google")
async def login_google(data: TokenRequest):
    return await google_login(data.token)


@router.post("/kakao")
async def login_kakao(data: TokenRequest):
    return await kakao_login(data.token)