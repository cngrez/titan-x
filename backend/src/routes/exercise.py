from fastapi import APIRouter, Depends, HTTPException
from models.exercise import CreateExerciseRequest, UpdateExerciseRequest, ExerciseResponse
from dependencies.db import get_db
from dependencies.auth import get_current_user, get_current_admin_user
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

# POST /api/exercises — admin only
@router.post("/", response_model=ExerciseResponse, status_code=201)
def create_exercise(
    body: CreateExerciseRequest,
    current_user=Depends(get_current_admin_user),
    db: WorkoutDatabase = Depends(get_db)
):
    existing = db.fetch_one(
        "SELECT id FROM exercise WHERE name = ?", (body.name,)
    )
    if existing:
        raise HTTPException(status_code=400, detail="Exercise already exists")

    cursor = db.execute(
        "INSERT INTO exercise (name, category, muscle_group) VALUES (?, ?, ?)",
        (body.name, body.category, body.muscle_group)
    )
    exercise = db.fetch_one(
        "SELECT * FROM exercise WHERE id = ?", (cursor.lastrowid,)
    )
    return dict(exercise)

# PATCH /api/exercises/{id} — admin only
@router.patch("/{exercise_id}", response_model=ExerciseResponse)
def update_exercise(
    exercise_id: int,
    body: UpdateExerciseRequest,
    current_user=Depends(get_current_admin_user),
    db: WorkoutDatabase = Depends(get_db)
):
    existing = db.fetch_one(
        "SELECT id FROM exercise WHERE id = ?", (exercise_id,)
    )
    if not existing:
        raise HTTPException(status_code=404, detail="Exercise not found")

    fields = {k: v for k, v in body.model_dump().items() if v is not None}
    if not fields:
        raise HTTPException(status_code=400, detail="No fields to update")

    set_clause = ", ".join(f"{k} = ?" for k in fields)
    values = list(fields.values()) + [exercise_id]

    db.execute(f"UPDATE exercise SET {set_clause} WHERE id = ?", tuple(values))

    updated = db.fetch_one("SELECT * FROM exercise WHERE id = ?", (exercise_id,))
    return dict(updated)

# DELETE /api/exercises/{id} — admin only
@router.delete("/{exercise_id}")
def delete_exercise(
    exercise_id: int,
    current_user=Depends(get_current_admin_user),
    db: WorkoutDatabase = Depends(get_db)
):
    existing = db.fetch_one(
        "SELECT id FROM exercise WHERE id = ?", (exercise_id,)
    )
    if not existing:
        raise HTTPException(status_code=404, detail="Exercise not found")

    db.execute("DELETE FROM exercise WHERE id = ?", (exercise_id,))
    return {"message": "Exercise deleted"}