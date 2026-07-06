from fastapi import APIRouter, Depends, HTTPException
from models.workout_session import CreateWorkoutSessionRequest, UpdateWorkoutSessionRequest, WorkoutSessionResponse
from dependencies.db import get_db
from dependencies.auth import get_current_user
from database.database import WorkoutDatabase

router = APIRouter(prefix="/workout-sessions", tags=["workout_sessions"])

#GET /api/workout-sessions — anyone logged in can see all workout sessions
@router.get("/", response_model=list[WorkoutSessionResponse])
def get_all_workout_sessions(
    current_user=Depends(get_current_user),
    db: WorkoutDatabase = Depends(get_db)
):
    workout_sessions = db.fetch_all("SELECT * FROM workout_sessions WHERE user_id = ?", (current_user.id,))
    return [dict(ws) for ws in workout_sessions]

#GET /api/workout-sessions/{id} — get single workout session
@router.get("/{workout_session_id}", response_model=WorkoutSessionResponse)
def get_workout_session_by_id(
    workout_session_id: int, 
    current_user=Depends(get_current_user),
    db: WorkoutDatabase = Depends(get_db)
):
    workout_session = db.fetch_one(
        "SELECT * FROM workout_sessions WHERE id = ? AND user_id = ?",
        (workout_session_id, current_user.id)
    )
    if not workout_session:
        raise HTTPException(status_code=404, detail="Workout session not found")
    return dict(workout_session)

#POST /api/workout-sessions — user can create their own workout session
@router.post("/", response_model=WorkoutSessionResponse, status_code=201)
def create_workout_session(
    body: CreateWorkoutSessionRequest,
    current_user=Depends(get_current_user),
    db: WorkoutDatabase =Depends(get_db)
):
  cursor = db.execute(
        "INSERT INTO workout_sessions (date, notes, user_id, routine_id) VALUES (?, ?, ?, ?)",
        (body.date, body.notes, current_user.id, body.routine_id)
  )
  workout_session = db.fetch_one(
        "SELECT * FROM workout_sessions WHERE id = ?", (cursor.lastrowid,)
  )
  return dict(workout_session)

#PATCH /api/workout-sessions/{id} — user can update their own workout session
@router.patch("/{workout_session_id}", response_model=WorkoutSessionResponse)
def update_workout_session(
    workout_session_id: int,
    body: UpdateWorkoutSessionRequest,
    current_user=Depends(get_current_user),
    db: WorkoutDatabase = Depends(get_db)
):
    existing = db.fetch_one(
        "SELECT * FROM workout_sessions WHERE id = ? AND user_id = ?", (workout_session_id, current_user.id)
    )
    if not existing:
        raise HTTPException(status_code=404, detail="Workout session not found")
    
    fields = {k: v for k, v in body.model_dump().items() if v is not None}
    if not fields:
        raise HTTPException(status_code=400, detail="No fields to update")

    set_clause = ", ".join(f"{k} = ?" for k in fields)
    values = list(fields.values()) + [workout_session_id]
 
    db.execute(
        f"UPDATE workout_sessions SET {set_clause} WHERE id = ? AND user_id = ?",
        tuple(values + [current_user.id])
    )
    updated_workout_session = db.fetch_one(
        "SELECT * FROM workout_sessions WHERE id = ?", (workout_session_id,)
    )
    return dict(updated_workout_session)

#DELETE /api/workout-sessions/{id} — user can delete their own workout session
@router.delete("/{workout_session_id}", status_code=204)
def delete_workout_session(
    workout_session_id: int,
    current_user=Depends(get_current_user),
    db: WorkoutDatabase = Depends(get_db)
):
    existing = db.fetch_one(
        "SELECT * FROM workout_sessions WHERE id = ? AND user_id = ?", (workout_session_id, current_user.id)
    )
    if not existing:
        raise HTTPException(status_code=404, detail="Workout session not found")

    db.execute(
        "DELETE FROM workout_sessions WHERE id = ? AND user_id = ?", (workout_session_id, current_user.id)
    )
    return {"message": "Workout-Session deleted"}
