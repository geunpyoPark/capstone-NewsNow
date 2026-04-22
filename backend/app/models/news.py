from sqlalchemy import Column, Integer, String, Text, DateTime
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.sql import func
from app.database import Base

class NewsArticle(Base):
    __tablename__ = "news_articles"
    id = Column(Integer, primary_key=True, autoincrement=True)
    title = Column(Text, nullable=False)
    url = Column(Text, unique=True, nullable=False)
    pub_date = Column(String)
    category = Column(String)
    comic_path = Column(String)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class ArticleVersion(Base):
    __tablename__ = "article_versions"
    id = Column(Integer, primary_key=True, autoincrement=True)
    article_id = Column(Integer)
    levels = Column(JSONB)

class ArticleAsset(Base):
    __tablename__ = "article_assets"
    id = Column(Integer, primary_key=True, autoincrement=True)
    article_id = Column(Integer)
    quizzes = Column(JSONB)
    highlights = Column(JSONB)