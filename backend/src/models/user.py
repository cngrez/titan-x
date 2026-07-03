from pydantic import BaseModel, EmailStr, Field
from typing import Optional

class UpdateUserRequest(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    email: Optional[EmailStr] = None
    password: Optional[str] = Field(None, min_length=6) 

class UserResponse(BaseModel):
    id: int
    first_name: str
    last_name: str
    email: str
    created_at: str