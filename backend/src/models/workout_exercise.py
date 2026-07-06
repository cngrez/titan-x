from pydantic import BaseModel, Field
from typing import Optional

class CreateWorkoutExerciseRequest(BaseModel):
    order_index: int = Field(..., gt=0, description="Order of the exercise in the workout session")
    notes: Optional[str] = Field(None, max_length=500, description="Additional notes about the exercise in the workout session")
    workout_id: int = Field(..., gt=0, description="ID of the workout session associated with this workout exercise")
    exercise_id: int = Field(..., gt=0, description="ID of the exercise associated with this workout exercise")
    
class UpdateWorkoutExerciseRequest(BaseModel):
    order_index: int = Field(..., gt=0, description="Order of the exercise in the workout session")
    notes: Optional[str] = Field(None, max_length=500, description="Additional notes about the exercise in the workout session")
    workout_id: int = Field(..., gt=0, description="ID of the workout session associated with this workout exercise")
    exercise_id: int = Field(..., gt=0, description="ID of the exercise associated with this workout exercise")
    
class WorkoutExerciseResponse(BaseModel):
    id: int
    order_index: int
    notes: Optional[str]
    workout_id: int
    exercise_id: int