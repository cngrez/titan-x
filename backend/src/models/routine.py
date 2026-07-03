from pydantic import BaseModel, Field
from typing import Optional

class CreateRoutineRequest(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    description: Optional[str] = Field(None, max_length=500)
    is_template: Optional[bool] = True
    
class UpdateRoutineRequest(BaseModel):
    name : Optional[str] = Field(None, min_length=1, max_length=100)
    description: Optional[str] = Field(None, max_length=500)

class RoutineResponse(BaseModel):
    id: int
    name: str
    description: Optional[str]
    is_template: bool
    created_at: str
    