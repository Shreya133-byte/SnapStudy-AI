import os
import json
import time

from dotenv import load_dotenv
from google import genai
from google.genai import types
from pydantic import BaseModel, Field


# Load environment variables
load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")


# Gemini client initialized lazily so the app can boot
# even before a deployment secret is configured.
client = None
if GEMINI_API_KEY:
    client = genai.Client(api_key=GEMINI_API_KEY)

MODEL_NAME = "gemini-2.0-flash"


def get_client():
    if client is None:
        raise RuntimeError(
            "GEMINI_API_KEY is not configured. "
            "Add it to the environment or a .env file before using AI features."
        )
    return client


# ============================================================
# STRUCTURED OUTPUT MODELS
# ============================================================

class Definition(BaseModel):
    term: str
    meaning: str


class PracticeQuestion(BaseModel):
    question: str
    answer: str
    difficulty: str = Field(
        description="Easy, Medium, or Hard"
    )


class StudyMaterial(BaseModel):
    title: str
    summary: str
    key_concepts: list[str]
    definitions: list[Definition]
    formulas: list[str]
    important_points: list[str]
    practice_questions: list[PracticeQuestion]


# ============================================================
# IMAGE / PDF ANALYSIS
# ============================================================

def analyze_image(
    image_bytes: bytes,
    mime_type: str
) -> StudyMaterial:

    prompt = """
You are SnapStudy AI, an intelligent visual study assistant.

Analyze the uploaded educational material carefully.

The material may contain:

- handwritten notes
- textbook pages
- diagrams
- mathematical formulas
- definitions
- questions
- tables
- educational illustrations
- PDF pages

Create useful study material using ONLY information supported
by the uploaded material.

Requirements:

1. Identify the main topic and create a suitable title.
2. Write a clear student-friendly summary.
3. Extract the most important concepts.
4. Extract important definitions.
5. Extract formulas when they are visible.
6. List important points students should remember.
7. Create 5 practice questions based ONLY on the material.
8. Provide answers for every practice question.
9. Assign each question Easy, Medium, or Hard.
10. Do not invent information.
11. If something is unclear or unreadable, do not guess.

Make the result concise but useful for exam preparation.
"""

    response = None
    model_client = get_client()

    # Retry temporary Gemini service errors
    for attempt in range(3):

        try:

            response = model_client.models.generate_content(
                model=MODEL_NAME,
                contents=[
                    types.Part.from_bytes(
                        data=image_bytes,
                        mime_type=mime_type,
                    ),
                    prompt,
                ],
                config=types.GenerateContentConfig(
                    response_mime_type="application/json",
                    response_schema=StudyMaterial,
                ),
            )

            break

        except Exception as error:

            print(
                f"Gemini request failed "
                f"(attempt {attempt + 1}/3): {error}"
            )

            if attempt == 2:
                raise

            time.sleep(5)

    if response is None:
        raise RuntimeError("Gemini returned no response.")

    if response.parsed:

        if isinstance(response.parsed, StudyMaterial):
            return response.parsed

        return StudyMaterial.model_validate(
            response.parsed
        )

    return StudyMaterial.model_validate_json(
        response.text
    )


# ============================================================
# CHAT WITH STUDY MATERIAL
# ============================================================

def ask_question(
    material: StudyMaterial,
    question: str
) -> str:

    material_json = json.dumps(
        material.model_dump(),
        indent=2,
        ensure_ascii=False,
    )

    prompt = f"""
You are the study chatbot inside SnapStudy AI.

Answer the student's question using ONLY the uploaded study
material provided below.

STUDY MATERIAL:

{material_json}

STUDENT QUESTION:

{question}

Rules:

- Stay grounded in the provided study material.
- Explain concepts clearly and simply.
- If the answer is present in the material, answer directly.
- If the answer cannot be found in the material, say:

"I couldn't find that information in your uploaded study material."

- Do not invent facts.
- You may reorganize or explain information from the material
  to make it easier to understand.
"""

    model_client = get_client()
    response = model_client.models.generate_content(
        model=MODEL_NAME,
        contents=prompt,
    )

    return response.text.strip()