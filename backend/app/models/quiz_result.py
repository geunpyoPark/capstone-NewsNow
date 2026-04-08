from sqlalchemy import Column, String, Integer, DateTime, ForeignKey
from sqlalchemy.sql import func
from app.database import Base

class QuizResult(Base):
    __tablename__ = "quiz_results"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_email = Column(String, ForeignKey("users.email"), nullable=False)
    category1 = Column(String, nullable=False)
    category1_score = Column(Integer, nullable=False)
    category1_level = Column(Integer, nullable=False)
    category2 = Column(String, nullable=False)
    category2_score = Column(Integer, nullable=False)
    category2_level = Column(Integer, nullable=False)
    overall_level = Column(Integer, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())