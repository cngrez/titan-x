from fastapi import APIRouter, Depends, HTTPException
from models.workout_exercise import CreateWorkoutExerciseRequest, UpdateWorkoutExerciseRequest, WorkoutExerciseResponse
from dependencies.db import get_db
from dependencies.auth import get_current_user
from database.database import WorkoutDatabase

router = APIRouter(prefix="/workout-exercises", tags=["workout_exercises"])

# GET /api/workouts/{workout_id}/exercises — get all exercises for a specific workout session
@router.get("/workouts/{workout_id}/exercises", response_model=list[WorkoutExerciseResponse])
def get_workout_exercises(
    workout_id: int,
    current_user=Depends(get_current_user),
    db: WorkoutDatabase = Depends(get_db)
):
    workout = db.fetch_one(
        "SELECT id FROM workout_session WHERE id = ? AND user_id = ?",
        (workout_id, current_user.id)
    )
    if not workout:
        raise HTTPException(status_code=404, detail="Workout not found")
    
    # Get all exercises with their sets
    exercises = db.fetch_all(
        """SELECT we.*, e.name, e.category, e.muscle_group,
           (SELECT json_group_array(
              json_object(
                  'id', sl.id,
                  'set_number', sl.set_number,
                  'reps', sl.reps,
                  'weight', sl.weight,
                  'rpe', sl.rpe,
                  'is_warmup', sl.is_warmup,
                  'notes', sl.notes,
                  'created_at', sl.created_at
              )
            ) FROM set_logs sl WHERE sl.workout_exercise_id = we.id ORDER BY sl.set_number) as sets
           FROM workout_exercise we
           JOIN exercise e ON we.exercise_id = e.id
           WHERE we.workout_id = ?
           ORDER BY we.order_index ASC""",
        (workout_id,)
    )
    return [dict(ex) for ex in exercises]

#POST /api/workouts/{workout_id}/exercises — user can add an exercise to their own workout session
@router.post("/workouts/{workout_id}/exercises", response_model=WorkoutExerciseResponse, status_code=201)
def add_exercise_to_workout(
    workout_id: int,
    body: CreateWorkoutExerciseRequest, 
    current_user=Depends(get_current_user),
    db: WorkoutDatabase = Depends(get_db)
):
    workout = db.fetch_one(
        "SELECT id FROM workout_session WHERE id = ? AND user_id = ?",
        (workout_id, current_user.id)
    )
    if not workout:
        raise HTTPException(status_code=404, detail="Workout not found")
    
    exercise = db.fetch_one(
        "SELECT id FROM exercise WHERE id = ?",
        (body.exercise_id,)
    )
    if not exercise:
        raise HTTPException(status_code=404, detail="Exercise not found")
    
    # If no order_index provided, append to end
    if body.order_index is None:
        max_order = db.fetch_one(
            "SELECT MAX(order_index) as max FROM workout_exercise WHERE workout_id = ?",
            (workout_id,)
        )
        body.order_index = (max_order['max'] or 0) + 1
    
    cursor = db.execute(
        """INSERT INTO workout_exercise (order_index, notes, workout_id, exercise_id)
           VALUES (?, ?, ?, ?)""",
        (body.order_index, body.notes, workout_id, body.exercise_id)
    )
    workout_exercise = db.fetch_one(
        "SELECT * FROM workout_exercise WHERE id = ?",
        (cursor.lastrowid,)
    )
    return dict(workout_exercise)

#PATCH /api/workout-exercises/{workout_exercise_id} — user can update their own workout exercise
@router.patch("/workout-exercises/{workout_exercise_id}", response_model=WorkoutExerciseResponse)
def update_workout_exercise(
    workout_exercise_id: int,
    body: UpdateWorkoutExerciseRequest, 
    current_user=Depends(get_current_user),
    db: WorkoutDatabase = Depends(get_db)
):
    existing = db.fetch_one(
        """SELECT we.* FROM workout_exercise we
           JOIN workout_session ws ON we.workout_id = ws.id
           WHERE we.id = ? AND ws.user_id = ?""",
        (workout_exercise_id, current_user.id)
    )
    if not existing:
        raise HTTPException(status_code=404, detail="Set log not found")

    fields = {k: v for k, v in body.model_dump().items() if v is not None}
    if not fields:
        raise HTTPException(status_code=400, detail="No fields to update")

    set_clause = ", ".join(f"{k} = ?" for k in fields)
    values = list(fields.values()) + [workout_exercise_id]

    db.execute(
        f"UPDATE workout_exercise SET {', '.join(set_clause)} WHERE id = ?",
        tuple(values)
    )
    
    updated_workout_exercise = db.fetch_one(
        "SELECT * FROM workout_exercise WHERE id = ?",
        (workout_exercise_id,)
    )
    return dict(updated_workout_exercise)

#DELETE /api/workout-exercises/{workout_exercise_id} — user can delete their own workout exercise
@router.delete("/workout-exercises/{workout_exercise_id}", status_code=204)
def delete_workout_exercise(
    workout_exercise_id: int,
    current_user=Depends(get_current_user),
    db: WorkoutDatabase = Depends(get_db)
):
    existing = db.fetch_one(
        """SELECT we.* FROM workout_exercise we
           JOIN workout_session ws ON we.workout_id = ws.id
           WHERE we.id = ? AND ws.user_id = ?""",
        (workout_exercise_id, current_user.id)
    )
    if not existing:
        raise HTTPException(status_code=404, detail="Workout exercise not found")
    
    db.execute(
        "DELETE FROM workout_exercise WHERE id = ?",
        (workout_exercise_id,)
    )
    return {"message": "Workout-Exercise deleted"}