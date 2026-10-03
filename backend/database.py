import os
from datetime import datetime

from sqlalchemy import create_engine, Column, String, DateTime, JSON
from sqlalchemy.orm import declarative_base, sessionmaker


# --------------------------------------------------
# DATABASE URL
# --------------------------------------------------

DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "sqlite:///./data/snapstudy.db"
)


# --------------------------------------------------
# SQLITE / POSTGRES COMPATIBILITY
# --------------------------------------------------

connect_args = {}

if DATABASE_URL.startswith("sqlite"):
    connect_args = {"check_same_thread": False}


# --------------------------------------------------
# ENGINE
# --------------------------------------------------

engine = create_engine(
    DATABASE_URL,
    connect_args=connect_args,
    pool_pre_ping=True
)


# --------------------------------------------------
# BASE
# --------------------------------------------------

Base = declarative_base()


# --------------------------------------------------
# SESSION
# --------------------------------------------------

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)


# --------------------------------------------------
# DATABASE MODEL
# --------------------------------------------------

class StudySession(Base):

    __tablename__ = "study_sessions"

    id = Column(
        String,
        primary_key=True,
        index=True
    )

    filename = Column(
        String,
        nullable=False
    )

    material = Column(
        JSON,
        nullable=False
    )

    created_at = Column(
        DateTime,
        default=datetime.utcnow
    )


# --------------------------------------------------
# CREATE TABLES
# --------------------------------------------------

def init_db():

    Base.metadata.create_all(
        bind=engine
    )


# --------------------------------------------------
# SAVE STUDY SESSION
# --------------------------------------------------

def save_study_session(
    document_id: str,
    filename: str,
    material: dict
):

    db = SessionLocal()

    try:

        existing = db.query(
            StudySession
        ).filter(
            StudySession.id == document_id
        ).first()

        if existing:

            existing.filename = filename
            existing.material = material

        else:

            new_session = StudySession(
                id=document_id,
                filename=filename,
                material=material
            )

            db.add(new_session)

        db.commit()

    finally:

        db.close()


# --------------------------------------------------
# GET STUDY SESSION
# --------------------------------------------------

def get_study_session(
    document_id: str
):

    db = SessionLocal()

    try:

        session = db.query(
            StudySession
        ).filter(
            StudySession.id == document_id
        ).first()

        if not session:
            return None

        return {
            "id": session.id,
            "filename": session.filename,
            "material": session.material,
            "created_at": session.created_at
        }

    finally:

        db.close()