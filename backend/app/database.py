from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker, DeclarativeBase
import os
from dotenv import load_dotenv

load_dotenv()

raw_database_url = os.getenv("DATABASE_URL")
if not raw_database_url:
    raise RuntimeError(
        "DATABASE_URL is not set. Add it to your backend .env before starting the server."
    )

DATABASE_URL = raw_database_url.replace("postgresql://", "postgresql+asyncpg://")
SQL_ECHO = os.getenv("SQL_ECHO", "false").lower() == "true"

engine = create_async_engine(DATABASE_URL, echo=SQL_ECHO)

AsyncSessionLocal = sessionmaker(
    engine, class_=AsyncSession, expire_on_commit=False
)

class Base(DeclarativeBase):
    pass

async def get_db():
    async with AsyncSessionLocal() as session:
        yield session
