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
    fields = {k: v for k, v in body.model_dump().items() if v is not None}

    # Handle password separately — hash it and store under column name
    if "password" in fields:
        hashed = bcrypt.hashpw(fields.pop("password").encode('utf-8'), bcrypt.gensalt())
        fields["password_hash"] = hashed.decode('utf-8')

    if not fields:
        raise HTTPException(status_code=400, detail="No fields to update")

    set_clause = ", ".join(f"{k} = ?" for k in fields)
    values = list(fields.values()) + [current_user["id"]]

    db.execute(
        f"UPDATE users SET {set_clause} WHERE id = ?",
        tuple(values)
    )

    updated = db.fetch_one(
        "SELECT id, first_name, last_name, email, created_at FROM users WHERE id = ?",
        (current_user["id"],)
    )
    return dict(updated)

# DELETE /api/users/me — delete my account
@router.delete("/me")
def delete_my_account(
    current_user=Depends(get_current_user),
    db: WorkoutDatabase = Depends(get_db)
):
    db.execute("DELETE FROM users WHERE id = ?", (current_user["id"],))
    return {"message": "Account deleted"}