from fastapi import APIRouter, Depends, HTTPException
from models.user import UpdateUserRequest, UserResponse
from dependencies.db import get_db
from dependencies.auth import get_current_user
from database.database import WorkoutDatabase
import bcrypt

router = APIRouter(prefix="/users", tags=["users"])

# GET /api/users/me — get my profile
@router.get("/me", response_model=UserResponse)
def get_my_profile(
    current_user=Depends(get_current_user),
    db: WorkoutDatabase = Depends(get_db)
):
    user = db.fetch_one(
        "SELECT id, first_name, last_name, email, created_at FROM users WHERE id = ?",
        (current_user["id"],)
    )
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return dict(user)
