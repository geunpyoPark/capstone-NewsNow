from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware  
from app.routes import auth

app = FastAPI()

# ✅ CORS 미들웨어 설정 추가
# 이 설정이 있어야 프론트엔드(React Native)에서 보낸 요청을 백엔드가 허락해줍니다.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 모든 도메인에서의 접속을 허용 (테스트용)
    allow_credentials=True,
    allow_methods=["*"],  # GET, POST 등 모든 방식 허용
    allow_headers=["*"],  # 모든 헤더 허용
)

@app.get("/")
def root():
    return {"message": "Hello FastAPI 성공 🎉"}

app.include_router(auth.router)