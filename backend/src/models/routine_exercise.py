from pydantic import BaseModel, Field, field_validator
from typing import Optional

# CREATE TABLE IF NOT EXISTS routine_exercise(
#     id INTEGER PRIMARY KEY AUTOINCREMENT,
#     order_index INTEGER NOT NULL,
#     default_sets INTEGER NOT NULL,  
#     default_reps INTEGER NOT NULL,
#     default_weight DECIMAL(5,2) NOT NULL,
#     notes TEXT, 
#     exercise_id INTEGER NOT NULL,
#     routine_id INTEGER NOT NULL,
#     FOREIGN KEY(exercise_id) REFERENCES exercise(id) ON DELETE CASCADE,
#     FOREIGN KEY(routine_id) REFERENCES routine(id) ON DELETE CASCADE
# );

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
