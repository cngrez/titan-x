from fastapi import APIRouter, Depends, HTTPException
from models.routine_exercise import CreateRoutineExerciseRequest, UpdateRoutineExerciseRequest, RoutineExerciseResponse
from dependencies.db import get_db
from dependencies.auth import get_current_user
from database.database import WorkoutDatabase

router = APIRouter(prefix="/routines", tags=["routine exercises"])

# GET /api/routines/{routine_id}/exercises
@router.get("/{routine_id}/exercises", response_model=list[RoutineExerciseResponse])
def get_routine_exercises(
    routine_id: int,
    current_user=Depends(get_current_user),
    db: WorkoutDatabase = Depends(get_db)
):
    routine = db.fetch_one(
        "SELECT * FROM routine WHERE id = ? AND (user_id = ? OR is_template = TRUE)",
        (routine_id, current_user["id"])
    )
    if not routine:
        raise HTTPException(status_code=404, detail="Routine not found")

    exercises = db.fetch_all(
        """SELECT re.*, e.name, e.category, e.muscle_group
           FROM routine_exercise re
           JOIN exercise e ON re.exercise_id = e.id
           WHERE re.routine_id = ?
           ORDER BY re.order_index ASC""",  # 👈 e["id"] → e.id (SQL not Python)
        (routine_id,)
    )
    return [dict(ex) for ex in exercises]

# POST /api/routines/{routine_id}/exercises
@router.post("/{routine_id}/exercises", response_model=RoutineExerciseResponse, status_code=201)
def add_exercise_to_routine(
    routine_id: int,
    body: CreateRoutineExerciseRequest,
    current_user=Depends(get_current_user),
    db: WorkoutDatabase = Depends(get_db)
):
    routine = db.fetch_one(
        "SELECT * FROM routine WHERE id = ? AND user_id = ?",
        (routine_id, current_user["id"])
    )
    if not routine:
        raise HTTPException(status_code=404, detail="Routine not found or not yours")

    exercise = db.fetch_one(
        "SELECT id FROM exercise WHERE id = ?", (body.exercise_id,)
    )
    if not exercise:
        raise HTTPException(status_code=404, detail="Exercise not found")

    # prevent duplicate exercise in same routine
    duplicate = db.fetch_one(
        "SELECT id FROM routine_exercise WHERE routine_id = ? AND exercise_id = ?",
        (routine_id, body.exercise_id)
    )
    if duplicate:
        raise HTTPException(status_code=400, detail="Exercise already in this routine")

    cursor = db.execute(
        """INSERT INTO routine_exercise
           (order_index, default_sets, default_reps, default_weight, notes, exercise_id, routine_id)
           VALUES (?, ?, ?, ?, ?, ?, ?)""",
        (body.order_index, body.default_sets, body.default_reps,
         body.default_weight, body.notes, body.exercise_id, routine_id)
    )
    routine_exercise = db.fetch_one(
        "SELECT * FROM routine_exercise WHERE id = ?", (cursor.lastrowid,)
    )
    return dict(routine_exercise)

# PATCH /api/routines/exercises/{routine_exercise_id}
@router.patch("/exercises/{routine_exercise_id}", response_model=RoutineExerciseResponse)
def update_routine_exercise(
    routine_exercise_id: int,
    body: UpdateRoutineExerciseRequest,
    current_user=Depends(get_current_user),
    db: WorkoutDatabase = Depends(get_db)
):
    existing = db.fetch_one(
        """SELECT re.* FROM routine_exercise re
           JOIN routine r ON re.routine_id = r.id
           WHERE re.id = ? AND r.user_id = ?""", 
        (routine_exercise_id, current_user["id"])
    )
    if not existing:
        raise HTTPException(status_code=404, detail="Routine exercise not found") 

    fields = {k: v for k, v in body.model_dump().items() if v is not None}
    if not fields:
        raise HTTPException(status_code=400, detail="No fields to update")

    set_clause = ", ".join(f"{k} = ?" for k in fields)  
    values = list(fields.values()) + [routine_exercise_id]

    db.execute(
        f"UPDATE routine_exercise SET {set_clause} WHERE id = ?",
        tuple(values)
    )
    updated = db.fetch_one(
        "SELECT * FROM routine_exercise WHERE id = ?", (routine_exercise_id,)
    )
    return dict(updated)

# DELETE /api/routines/exercises/{routine_exercise_id}
@router.delete("/exercises/{routine_exercise_id}", status_code=204)
def remove_exercise_from_routine(
    routine_exercise_id: int,
    current_user=Depends(get_current_user),
    db: WorkoutDatabase = Depends(get_db)
):
    existing = db.fetch_one(
        """SELECT re.id FROM routine_exercise re
           JOIN routine r ON re.routine_id = r.id
           WHERE re.id = ? AND r.user_id = ?""",  
        (routine_exercise_id, current_user["id"])
    )
    if not existing:
        raise HTTPException(status_code=404, detail="Routine exercise not found")

    db.execute(
        "DELETE FROM routine_exercise WHERE id = ?", (routine_exercise_id,)
    )
    return None