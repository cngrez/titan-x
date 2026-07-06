from pydantic import BaseModel, Field, field_validator
from typing import Optional

class CreateSetLogRequest(BaseModel):
    set_number: int = Field(..., gt=0, description="The set number for the exercise")
    reps: int = Field(..., gt=0, description="The number of repetitions performed in the set")
    weight: float = Field(..., ge=0, description="The weight used for the set")
    rpe: int = Field(..., ge=1, le=10, description="Rate of Perceived Exertion (RPE) for the set, on a scale of 1 to 10")
    is_warmup: Optional[bool] = Field(False, description="Indicates if the set was a warm-up set")
    notes: Optional[str] = Field(None, max_length=500, description="Additional notes about the set")
    workout_exercise_id: int = Field(..., gt=0, description="ID of the workout exercise associated with this set log")

    @field_validator("notes")
    @classmethod
    def validate_notes(cls, v):
        if v is not None and len(v) > 500:
            raise ValueError("Notes must be 500 characters or less")
        return v
    
class UpdateSetLogRequest(BaseModel):
    set_number: int = Field(..., gt=0, description="The set number for the exercise")
    reps: int = Field(..., gt=0, description="The number of repetitions performed in the set")
    weight: float = Field(..., ge=0, description="The weight used for the set")
    rpe: int = Field(..., ge=1, le=10, description="Rate of Perceived Exertion (RPE) for the set, on a scale of 1 to 10")
    is_warmup: Optional[bool] = Field(False, description="Indicates if the set was a warm-up set")
    notes: Optional[str] = Field(None, max_length=500, description="Additional notes about the set")
    workout_exercise_id: int = Field(..., gt=0, description="ID of the workout exercise associated with this set log")

    @field_validator("notes")
    @classmethod
    def validate_notes(cls, v):
        if v is not None and len(v) > 500:
            raise ValueError("Notes must be 500 characters or less")
        return v
    
class SetLogResponse(BaseModel):
    id: int
    set_number: int
    reps: int
    weight: float
    rpe: int
    is_warmup: Optional[bool]
    notes: Optional[str]
    created_at: str
    workout_exercise_id: int