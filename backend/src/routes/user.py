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

# PATCH /api/users/me — update my profile
@router.patch("/me", response_model=UserResponse)
def update_my_profile(
    body: UpdateUserRequest,
    current_user=Depends(get_current_user),
    db: WorkoutDatabase = Depends(get_db)
):
    # Only update fields that were actually sent
    fields = {k: v for k, v in body.model_dump().items() if v is not None}
    
     # Handle password separately if provided
    if "password" in fields:
        # Hash the new password
        hashed_password = bcrypt.hashpw(fields["password"].encode('utf-8'), bcrypt.gensalt())
        # Store the hashed password (as bytes). If your database expects string, decode it
        fields["hashed_password"] = hashed_password.decode('utf-8')
        # Remove plain password from fields
        del fields["password"]
        
    if not fields:
        raise HTTPException(status_code=400, detail="No fields to update")

    # Build the SQL dynamically based on what was sent
    set_clause = ", ".join(f"{k} = ?" for k in fields)
    values = list(fields.values()) + [current_user["id"]]

    db.execute(
        f"UPDATE users SET {set_clause} WHERE id = ?",
        tuple(values)
    )

    # Return updated user
    updated = db.fetch_one(
        "SELECT id, first_name, last_name, email, created_at FROM users WHERE id = ?",
        (current_user["id"],)
    )
    return dict(updated)
