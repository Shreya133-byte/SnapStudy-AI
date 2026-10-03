import os
import json
from pathlib import Path
from uuid import uuid4

import uvicorn
from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from services.vision import (
    StudyMaterial,
    analyze_image,
    ask_question,
)


# ============================================================
# APP CONFIGURATION
# ============================================================

PORT = int(os.getenv("PORT", "8011"))

app = FastAPI(
    title="SnapStudy AI",
    description="AI-powered visual study assistant",
    version="1.0.0",
)


# ============================================================
# CORS
# ============================================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:8000",
        "http://127.0.0.1:8000",
        "http://localhost:8001",
        "http://127.0.0.1:8001",
        "http://localhost:8011",
        "http://127.0.0.1:8011",
        "http://localhost:5174",
        "http://127.0.0.1:5174",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================================
# PERSISTENT STORAGE
# ============================================================

BASE_DIR = Path(__file__).resolve().parent
DATA_DIR = BASE_DIR / "data"
SESSIONS_DIR = DATA_DIR / "sessions"

SESSIONS_DIR.mkdir(parents=True, exist_ok=True)


# Temporary in-memory cache
study_sessions: dict[str, StudyMaterial] = {}


# ============================================================
# LOAD EXISTING SESSIONS
# ============================================================

def load_sessions():
    """Load previously saved study sessions from JSON files."""

    for session_file in SESSIONS_DIR.glob("*.json"):

        try:
            with open(
                session_file,
                "r",
                encoding="utf-8",
            ) as file:

                data = json.load(file)

            study_sessions[session_file.stem] = (
                StudyMaterial.model_validate(data)
            )

        except Exception as error:

            print(
                f"Could not load session "
                f"{session_file.name}: {error}"
            )


load_sessions()


# ============================================================
# SAVE SESSION
# ============================================================

def save_session(
    document_id: str,
    material: StudyMaterial,
):
    """Save study material as a JSON file."""

    file_path = SESSIONS_DIR / f"{document_id}.json"

    with open(
        file_path,
        "w",
        encoding="utf-8",
    ) as file:

        json.dump(
            material.model_dump(),
            file,
            indent=2,
            ensure_ascii=False,
        )


# ============================================================
# REQUEST MODELS
# ============================================================

class ChatRequest(BaseModel):
    document_id: str
    question: str


# ============================================================
# BASIC ROUTES
# ============================================================

@app.get("/")
def root():

    return {
        "message": "SnapStudy AI backend is running 🚀",
        "version": "1.0.0",
    }


@app.get("/health")
def health():

    return {
        "status": "healthy",
        "service": "SnapStudy AI",
        "sessions_loaded": len(study_sessions),
    }


# ============================================================
# IMAGE / PDF ANALYSIS
# ============================================================

@app.post("/api/analyze")
async def analyze_study_material(
    file: UploadFile = File(...)
):

    allowed_types = {
        "image/jpeg",
        "image/png",
        "image/webp",
        "application/pdf",
    }

    if file.content_type not in allowed_types:

        raise HTTPException(
            status_code=400,
            detail=(
                "Please upload a JPG, PNG, WEBP image, "
                "or PDF."
            ),
        )

    file_bytes = await file.read()

    # 10 MB maximum
    if len(file_bytes) > 10 * 1024 * 1024:

        raise HTTPException(
            status_code=400,
            detail="File must be smaller than 10 MB.",
        )

    if not file_bytes:

        raise HTTPException(
            status_code=400,
            detail="The uploaded file is empty.",
        )

    try:

        material = analyze_image(
            image_bytes=file_bytes,
            mime_type=file.content_type,
        )

        document_id = str(uuid4())

        # Store in memory
        study_sessions[document_id] = material

        # Save permanently
        save_session(
            document_id=document_id,
            material=material,
        )

        return {
            "success": True,
            "document_id": document_id,
            "filename": file.filename,
            "study_material": material.model_dump(),
        }

    except Exception as error:

        print(
            "Analysis error:",
            error,
        )

        raise HTTPException(
            status_code=500,
            detail=(
                "Unable to analyze the uploaded material. "
                "Please try again."
            ),
        )


if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=PORT, reload=False)


# ============================================================
# GET STUDY MATERIAL
# ============================================================

@app.get("/api/study/{document_id}")
async def get_study_material(
    document_id: str,
):

    material = study_sessions.get(document_id)

    if not material:

        # Try loading directly from disk
        file_path = (
            SESSIONS_DIR / f"{document_id}.json"
        )

        if file_path.exists():

            try:

                with open(
                    file_path,
                    "r",
                    encoding="utf-8",
                ) as file:

                    data = json.load(file)

                material = StudyMaterial.model_validate(
                    data
                )

                study_sessions[document_id] = material

            except Exception:

                material = None

    if not material:

        raise HTTPException(
            status_code=404,
            detail="Study material not found.",
        )

    return {
        "success": True,
        "document_id": document_id,
        "study_material": material.model_dump(),
    }


# ============================================================
# GET QUIZ
# ============================================================

@app.get("/api/quiz/{document_id}")
async def get_quiz(
    document_id: str,
):

    material = study_sessions.get(document_id)

    if not material:

        file_path = (
            SESSIONS_DIR / f"{document_id}.json"
        )

        if file_path.exists():

            try:

                with open(
                    file_path,
                    "r",
                    encoding="utf-8",
                ) as file:

                    data = json.load(file)

                material = StudyMaterial.model_validate(
                    data
                )

                study_sessions[document_id] = material

            except Exception:

                material = None

    if not material:

        raise HTTPException(
            status_code=404,
            detail="Study material not found.",
        )

    return {
        "success": True,
        "document_id": document_id,
        "quiz": [
            question.model_dump()
            for question in material.practice_questions
        ],
    }


# ============================================================
# CHAT WITH STUDY MATERIAL
# ============================================================

@app.post("/api/chat")
async def chat_with_material(
    request: ChatRequest,
):

    material = study_sessions.get(
        request.document_id
    )

    if not material:

        file_path = (
            SESSIONS_DIR
            / f"{request.document_id}.json"
        )

        if file_path.exists():

            try:

                with open(
                    file_path,
                    "r",
                    encoding="utf-8",
                ) as file:

                    data = json.load(file)

                material = StudyMaterial.model_validate(
                    data
                )

                study_sessions[
                    request.document_id
                ] = material

            except Exception:

                material = None

    if not material:

        raise HTTPException(
            status_code=404,
            detail="Study material not found.",
        )

    if not request.question.strip():

        raise HTTPException(
            status_code=400,
            detail="Question cannot be empty.",
        )

    try:

        answer = ask_question(
            material=material,
            question=request.question,
        )

        return {
            "success": True,
            "question": request.question,
            "answer": answer,
        }

    except Exception as error:

        print(
            "Chat error:",
            error,
        )

        raise HTTPException(
            status_code=500,
            detail="Unable to answer the question.",
        )