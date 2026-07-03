from pydantic import BaseModel, EmailStr, Field

class RegisterRequest(BaseModel):
    """Request model for user registration."""
    email: EmailStr
    password: str = Field(..., min_length=6)
    first_name: str = Field(..., min_length=1)
    last_name: str = Field(..., min_length=1)

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