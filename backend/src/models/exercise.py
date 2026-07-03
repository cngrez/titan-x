from pydantic import BaseModel, Field, field_validator
from typing import Optional

VALID_CATEGORIES = ["pull", "push", "legs", "balance"]
VALID_MUSCLE_GROUPS = ["chest", "back", "shoulders", "arms", "legs", "core", "full_body"]

class CreateExerciseRequest(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    category: str
    muscle_group: str

    @field_validator("category")
    @classmethod
    def valid_category(cls, v):
        if v.lower() not in VALID_CATEGORIES:
            raise ValueError(f"Category must be one of: {', '.join(VALID_CATEGORIES)}")
        return v.lower()

    @field_validator("muscle_group")
    @classmethod
    def valid_muscle_group(cls, v):
        if v.lower() not in VALID_MUSCLE_GROUPS:
            raise ValueError(f"Muscle group must be one of: {', '.join(VALID_MUSCLE_GROUPS)}")
        return v.lower()

class UpdateExerciseRequest(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    category: Optional[str] = None
    muscle_group: Optional[str] = None

    @field_validator("category")
    @classmethod
    def valid_category(cls, v):
        if v is None:
            return v
        if v.lower() not in VALID_CATEGORIES:
            raise ValueError(f"Category must be one of: {', '.join(VALID_CATEGORIES)}")
        return v.lower()

    @field_validator("muscle_group")
    @classmethod
    def valid_muscle_group(cls, v):
        if v is None:
            return v
        if v.lower() not in VALID_MUSCLE_GROUPS:
            raise ValueError(f"Muscle group must be one of: {', '.join(VALID_MUSCLE_GROUPS)}")
        return v.lower()

class ExerciseResponse(BaseModel):
    id: int
    name: str
    category: str
    muscle_group: str
    created_at: str