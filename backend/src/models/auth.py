from pydantic import BaseModel, EmailStr, Field, field_validator    
import re

class RegisterRequest(BaseModel):
    """Request model for user registration."""
    email: EmailStr
    password: str = Field(..., min_length=6, max_length=72)
    first_name: str = Field(..., min_length=1, max_length=50)
    last_name: str = Field(..., min_length=1, max_length=50)

    @field_validator("password")
    @classmethod
    def password_strength(cls, v):
        if not re.search(r"[A-Z]", v):
            raise ValueError("Password must contain at least one uppercase letter")
        if not re.search(r"[0-9]", v):
            raise ValueError("Password must contain at least one number")
        return v

    @field_validator("first_name", "last_name")
    @classmethod
    def no_special_characters(cls, v):
        if not re.match(r"^[a-zA-Z\s\-']+$", v):
            raise ValueError("Name can only contain letters, spaces, hyphens, and apostrophes")
        return v.strip()
    

class LoginRequest(BaseModel):
    """Request model for user login."""
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    """Response model for user data."""
    id: int
    email: str
    first_name: str
    last_name: str
    role: str

class TokenResponse(BaseModel):
    """Response model for authentication."""
    access_token: str
    token_type: str = "bearer"
    user: UserResponse