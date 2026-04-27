from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.sql import func
from app.database import Base

class NewsQuizResult(Base):
    __tablename__ = "news_quiz_results"
    id = Column(Integer, primary_key=True, autoincrement=True)
    user_email = Column(String, ForeignKey("users.email"))
    article_id = Column(Integer, ForeignKey("news_articles.id"))
    score = Column(Integer)
    total = Column(Integer)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class ScrapWord(Base):
    __tablename__ = "scrap_words"
    id = Column(Integer, primary_key=True, autoincrement=True)
    user_email = Column(String, ForeignKey("users.email"))
    word = Column(String, nullable=False)
    definition = Column(Text)
    article_id = Column(Integer, ForeignKey("news_articles.id"))
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class ScrapArticle(Base):
    __tablename__ = "scrap_articles"
    id = Column(Integer, primary_key=True, autoincrement=True)
    user_email = Column(String, ForeignKey("users.email"))
    article_id = Column(Integer, ForeignKey("news_articles.id"))
    created_at = Column(DateTime(timezone=True), server_default=func.now())