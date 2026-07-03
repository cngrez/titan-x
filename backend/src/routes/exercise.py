from fastapi import APIRouter, Depends, HTTPException
from models.exercise import CreateExerciseRequest, UpdateExerciseRequest, ExerciseResponse
from dependencies.db import get_db
from dependencies.auth import get_current_user, get_admin_user
from database.database import WorkoutDatabase

router = APIRouter(prefix="/exercises", tags=["exercises"])

# GET /api/exercises — anyone logged in can see all exercises
@router.get("/", response_model=list[ExerciseResponse])
def get_all_exercises(
    current_user=Depends(get_current_user),
    db: WorkoutDatabase = Depends(get_db)
):
    exercises = db.fetch_all("SELECT * FROM exercise")
    return [dict(e) for e in exercises]

# GET /api/exercises/{id} — get single exercise
@router.get("/{exercise_id}", response_model=ExerciseResponse)
def get_exercise(
    exercise_id: int,
    current_user=Depends(get_current_user),
    db: WorkoutDatabase = Depends(get_db)
):
    exercise = db.fetch_one(
        "SELECT * FROM exercise WHERE id = ?", (exercise_id,)
    )
    if not exercise:
        raise HTTPException(status_code=404, detail="Exercise not found")
    return dict(exercise)
