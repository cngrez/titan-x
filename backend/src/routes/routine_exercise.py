from fastapi import APIRouter, Depends, HTTPException
from models.routine_exercise import CreateRoutineExerciseRequest, UpdateRoutineExerciseRequest, RoutineExerciseResponse
from dependencies.db import get_db
from dependencies.auth import get_current_user
from database.database import WorkoutDatabase

router = APIRouter(prefix="/routine-exercises", tags=["routine_exercises"])

#GET /api/routines/{routine_id}/exercises — get all exercises for a specific routine
@router.get("/routines/{routine_id}/exercises", response_model=list[RoutineExerciseResponse])
def get_routine_exercises(
    routine_id: int,
    current_user=Depends(get_current_user),
    db: WorkoutDatabase = Depends(get_db)
):
    routine = db.fetch_one(
        "SELECT * FROM routine WHERE id = ? AND (user_id = ? OR is_template = TRUE)",
        (routine_id, current_user.id)
    )
    if not routine:
        raise HTTPException(status_code=404, detail="Routine not found")
    
    # Get all exercises for this routine
    exercises = db.fetch_all(
        """SELECT re.*, e.name, e.category, e.muscle_group 
           FROM routine_exercise re
           JOIN exercise e ON re.exercise_id = e.id
           WHERE re.routine_id = ?
           ORDER BY re.order_index ASC""",
        (routine_id,)
    )
    return [dict(ex) for ex in exercises]

#POST /api/routines/{routine_id}/exercises — user can add an exercise to their own routine
@router.post("/routines/{routine_id}/exercises", response_model=RoutineExerciseResponse, status_code=201)
def add_exercise_to_routine(
    routine_id: int,
    body: CreateRoutineExerciseRequest,
    current_user=Depends(get_current_user),
    db: WorkoutDatabase = Depends(get_db)
):
    routine = db.fetch_one(
        "SELECT * FROM routine WHERE id = ? AND user_id = ?",
        (routine_id, current_user.id)
    )
    if not routine:
        raise HTTPException(status_code=404, detail="Routine not found or not yours")
    
    exercise = db.fetch_one(
        "SELECT id FROM exercise WHERE id = ?",
        (body.exercise_id,)
    )
    if not exercise:
        raise HTTPException(status_code=404, detail="Exercise not found")
    
    cursor = db.execute(
        """INSERT INTO routine_exercise 
           (order_index, default_sets, default_reps, default_weight, notes, exercise_id, routine_id)
           VALUES (?, ?, ?, ?, ?, ?, ?)""",
        (body.order_index, body.default_sets, body.default_reps, 
         body.default_weight, body.notes, body.exercise_id, routine_id)
    )
    
    routine_exercises = db.fetch_one(
        "SELECT * FROM routine_exercise WHERE id = ?",
        (cursor.lastrowid,)
    )
    return dict(routine_exercises)

#PATCH /api/routine-exercises/{routine_exercise_id} — user can update their own routine exercise
@router.patch("/routine-exercises/{routine_exercise_id}", response_model=RoutineExerciseResponse)
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
        (routine_exercise_id, current_user.id)
    )
    if not existing:
        raise HTTPException(status_code=404, detail="Routine exercise not found")
    
    # Build dynamic update query
    update_fields = []
    params = []
    
    if body.order_index is not None:
        update_fields.append("order_index = ?")
        params.append(body.order_index)
    if body.default_sets is not None:
        update_fields.append("default_sets = ?")
        params.append(body.default_sets)
    if body.default_reps is not None:
        update_fields.append("default_reps = ?")
        params.append(body.default_reps)
    if body.default_weight is not None:
        update_fields.append("default_weight = ?")
        params.append(body.default_weight)
    if body.notes is not None:
        update_fields.append("notes = ?")
        params.append(body.notes)
    
    if not update_fields:
        raise HTTPException(status_code=400, detail="No fields to update")
    
    params.append(routine_exercise_id)
    db.execute(
        f"UPDATE routine_exercise SET {', '.join(update_fields)} WHERE id = ?",
        tuple(params)
    )
    
    update_routine_exercise = db.fetch_one("SELECT * FROM routine_exercise WHERE id = ?", (routine_exercise_id,))
    return dict(update_routine_exercise)

#DELETE /api/routine-exercises/{routine_exercise_id} — user can remove an exercise from their own routine
@router.delete("/routine-exercises/{routine_exercise_id}", status_code=204)
def remove_exercise_from_routine(
    routine_exercise_id: int,
    current_user=Depends(get_current_user),
    db: WorkoutDatabase = Depends(get_db)
):
    existing = db.fetch_one(
        """SELECT re.id FROM routine_exercise re
           JOIN routine r ON re.routine_id = r.id
           WHERE re.id = ? AND r.user_id = ?""",
        (routine_exercise_id, current_user.id)
    )
    if not existing:
        raise HTTPException(status_code=404, detail="Routine exercise not found")
    
    db.execute("DELETE FROM routine_exercise WHERE id = ?", (routine_exercise_id,))
    return {"message": "Routine-Exercise deleted"}

