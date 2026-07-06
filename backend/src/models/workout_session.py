from pydantic import BaseModel, Field, field_validator
from typing import Optional

#     CREATE TABLE IF NOT EXISTS workout_session(
#     id INTEGER PRIMARY KEY AUTOINCREMENT,
#     date DATETIME NOT NULL,
#     notes TEXT,
#     created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
#     user_id INTEGER NOT NULL,
#     routine_id INTEGER,
#     FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
#     FOREIGN KEY(routine_id) REFERENCES routine(id) ON DELETE SET NULL
# );

class CreateWorkoutSessionRequest(BaseModel):
    date: str = Field(..., description="Date of the workout session in YYYY-MM-DD format")
    notes: Optional[str] = Field(None, max_length=500, description="Additional notes about the workout session")
    user_id: int = Field(..., gt=0, description="ID of the user associated with the workout session")
    routine_id: Optional[int] = Field(None, gt=0, description="ID of the routine associated with the workout session")

    @field_validator("notes")
    @classmethod
    def validate_notes(cls, v):
        if v is not None and len(v) > 500:
            raise ValueError("Notes must be 500 characters or less")
        return v
    
class UpdateWorkoutSessionRequest(BaseModel):
    date: str = Field(..., description="Date of the workout session in YYYY-MM-DD format")
    notes: Optional[str] = Field(None, max_length=500, description="Additional notes about the workout session")
    user_id: int = Field(..., gt=0, description="ID of the user associated with the workout session")
    routine_id: Optional[int] = Field(None, gt=0, description="ID of the routine associated with the workout session")

    @field_validator("notes")
    @classmethod
    def validate_notes(cls, v):
        if v is not None and len(v) > 500:
            raise ValueError("Notes must be 500 characters or less")
        return v
    
    class WorkoutSessionResponse(BaseModel):
        id: int
        date: str
        notes: Optional[str]
        created_at: str
        user_id: int
        routine_id: Optional[int]
        