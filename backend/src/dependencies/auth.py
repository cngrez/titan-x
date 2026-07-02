# backend/src/dependencies/auth.py
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from utils.jwt import decode_token
from database.database import WorkoutDatabase
from dependencies.db import get_db

bearer_scheme = HTTPBearer()

def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
    db: WorkoutDatabase = Depends(get_db)
):
    """Validate JWT token and return current user."""
    token = credentials.credentials
    
    # 1. Decode token
    payload = decode_token(token)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token"
        )
    
    # 2. Extract user_id
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token payload"
        )
    
    # 3. Get user from database (direct query, no repository)
    user = db.fetch_one(
        "SELECT id, email, first_name, last_name FROM users WHERE id = ?",
        (int(user_id),)
    )
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found"
        )
    
    return user