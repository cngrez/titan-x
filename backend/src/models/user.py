from pydantic import BaseModel, EmailStr, Field, field_validator
from typing import Optional
import re

class UpdateUserRequest(BaseModel):
    """ Request model for updating user profile. All fields are optional, but if provided, they must meet validation criteria."""
    
    first_name: Optional[str] = Field(None, min_length=1, max_length=50)
    last_name: Optional[str] = Field(None, min_length=1, max_length=50)
    email: Optional[EmailStr] = None
    password: Optional[str] = Field(None, min_length=6, max_length=72)

    @field_validator("password")
    @classmethod
    def password_strength(cls, v):
        if v is None:
            return v
        if not re.search(r"[A-Z]", v):
            raise ValueError("Password must contain at least one uppercase letter")
        if not re.search(r"[0-9]", v):
            raise ValueError("Password must contain at least one number")
        return v

    @field_validator("first_name", "last_name")
    @classmethod
    def no_special_characters(cls, v):
        if v is None:
            return v
        if not re.match(r"^[a-zA-Z\s\-']+$", v):
            raise ValueError("Name can only contain letters, spaces, hyphens, and apostrophes")
        return v.strip()

class UserResponse(BaseModel):
    id: int
    first_name: str
    last_name: str
    email: str
    created_at: str