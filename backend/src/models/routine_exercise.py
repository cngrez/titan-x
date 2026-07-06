from pydantic import BaseModel, Field, field_validator
from typing import Optional

class CreateRoutineExerciseRequest(BaseModel):
    order_index: int = Field(..., gt=0, description="Order of the exercise in the routine")
    default_sets: int = Field(..., gt=0, description="Default number of sets for the exercise")
    default_reps: int = Field(..., gt=0, description="Default number of reps for the exercise")
    default_weight: float = Field(..., ge=0, description="Default weight for the exercise")
    notes: Optional[str] = Field(None, max_length=500, description="Additional notes about the exercise in the routine")
    exercise_id: int = Field(..., gt=0, description="ID of the exercise associated with this routine exercise")
    routine_id: int = Field(..., gt=0, description="ID of the routine associated with this routine exercise")

    @field_validator("notes")
    @classmethod
    def validate_notes(cls, v):
        if v is not None and len(v) > 500:
            raise ValueError("Notes must be 500 characters or less")
        return v
    
class UpdateRoutineExerciseRequest(BaseModel):
    order_index: int = Field(..., gt=0, description="Order of the exercise in the routine")
    default_sets: int = Field(..., gt=0, description="Default number of sets for the exercise")
    default_reps: int = Field(..., gt=0, description="Default number of reps for the exercise")
    default_weight: float = Field(..., ge=0, description="Default weight for the exercise")
    notes: Optional[str] = Field(None, max_length=500, description="Additional notes about the exercise in the routine")
    exercise_id: int = Field(..., gt=0, description="ID of the exercise associated with this routine exercise")
    routine_id: int = Field(..., gt=0, description="ID of the routine associated with this routine exercise")

    @field_validator("notes")
    @classmethod
    def validate_notes(cls, v):
        if v is not None and len(v) > 500:
            raise ValueError("Notes must be 500 characters or less")
        return v
    
class RoutineExerciseResponse(BaseModel):
    id : int
    order_index: int
    default_sets: int
    default_reps: int
    default_weight: float
    notes: Optional[str]
    exercise_id: int
    routine_id: int
