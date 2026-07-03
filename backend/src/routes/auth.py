from fastapi import APIRouter, Depends, HTTPException
from models.auth import RegisterRequest, LoginRequest, TokenResponse, UserResponse
from dependencies.db import get_db
from dependencies.auth import get_current_user
from utils.security import hash_password, verify_password
from utils.jwt import create_access_token
from database.database import WorkoutDatabase

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/register", response_model=TokenResponse)
def register(
    body: RegisterRequest,
    db: WorkoutDatabase = Depends(get_db)
):
    # 1. Check if user exists
    existing = db.fetch_one("SELECT id FROM users WHERE email = ?", (body.email,))
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # 2. Hash password
    hashed_password = hash_password(body.password)
    
    # 3. Insert user
    cursor = db.execute(
        "INSERT INTO users (email, password_hash, first_name, last_name) VALUES (?, ?, ?, ?)",
        (body.email, hashed_password, body.first_name, body.last_name)
    )
    user_id = cursor.lastrowid
    
    # 4. Generate token
    token = create_access_token(user_id, role="user")
    
    return {
        "access_token": token,
        "user": {
            "id": user_id,
            "email": body.email,
            "first_name": body.first_name,
            "last_name": body.last_name,
            "role": "user"  # Default role
        }
    }

@router.post("/login", response_model=TokenResponse)
def login(
    body: LoginRequest,
    db: WorkoutDatabase = Depends(get_db)
):
    # 1. Find user
    user = db.fetch_one("SELECT * FROM users WHERE email = ?", (body.email,))
    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    # 2. Verify password
    if not verify_password(body.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    # 3. Generate token
    token = create_access_token(user["id"], role=user["role"])
    
    return {
        "access_token": token,
        "user": {
            "id": user["id"],
            "email": user["email"],
            "first_name": user["first_name"],
            "last_name": user["last_name"],
            "role": user["role"]
        }
    }

@router.get("/me", response_model=UserResponse)
def get_me(current_user=Depends(get_current_user)):
    return {
        "id": current_user["id"],
        "email": current_user["email"],
        "first_name": current_user["first_name"],
        "last_name": current_user["last_name"]
    }

@router.post("/logout")
def logout():
    return {"message": "Logged out successfully"}