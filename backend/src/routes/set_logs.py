from fastapi import APIRouter, Depends, HTTPException
from models.set_log import CreateSetLogRequest, UpdateSetLogRequest, SetLogResponse
from dependencies.db import get_db
from dependencies.auth import get_current_user
from database.database import WorkoutDatabase

router = APIRouter(prefix="/set-logs", tags=["set logs"])

# GET /api/set-logs/{workout_exercise_id} — get all sets for a workout exercise
@router.get("/{workout_exercise_id}", response_model=list[SetLogResponse])
def get_set_logs(
    workout_exercise_id: int,
    current_user=Depends(get_current_user),
    db: WorkoutDatabase = Depends(get_db)
):
    workout_exercise = db.fetch_one(
        """SELECT we.id FROM workout_exercise we
           JOIN workout_session ws ON we.workout_id = ws.id
           WHERE we.id = ? AND ws.user_id = ?""",
        (workout_exercise_id, current_user["id"])
    )
    if not workout_exercise:
        raise HTTPException(status_code=404, detail="Workout exercise not found")

    sets = db.fetch_all(
        "SELECT * FROM set_logs WHERE workout_exercise_id = ? ORDER BY set_number",
        (workout_exercise_id,)
    )
    return [dict(s) for s in sets]

# POST /api/set-logs — log a set
@router.post("/", response_model=SetLogResponse, status_code=201)
def create_set_log(
    body: CreateSetLogRequest,
    current_user=Depends(get_current_user),
    db: WorkoutDatabase = Depends(get_db)
):
    workout_exercise = db.fetch_one(
        """SELECT we.id FROM workout_exercise we
           JOIN workout_session ws ON we.workout_id = ws.id
           WHERE we.id = ? AND ws.user_id = ?""",
        (body.workout_exercise_id, current_user["id"])
    )
    if not workout_exercise:
        raise HTTPException(status_code=404, detail="Workout exercise not found")

    cursor = db.execute(
        """INSERT INTO set_logs 
           (workout_exercise_id, set_number, reps, weight, rpe, is_warmup, notes)
           VALUES (?, ?, ?, ?, ?, ?, ?)""",
        (body.workout_exercise_id, body.set_number, body.reps,
         body.weight, body.rpe, body.is_warmup, body.notes)
    )

    set_log = db.fetch_one(
        "SELECT * FROM set_logs WHERE id = ?", (cursor.lastrowid,)
    )
    return dict(set_log)

# PATCH /api/set-logs/{id} — update a set
@router.patch("/{set_log_id}", response_model=SetLogResponse)
def update_set_log(
    set_log_id: int,
    body: UpdateSetLogRequest,
    current_user=Depends(get_current_user),
    db: WorkoutDatabase = Depends(get_db)
):
    # verify ownership
    existing = db.fetch_one(
        """SELECT sl.id FROM set_logs sl
           JOIN workout_exercise we ON sl.workout_exercise_id = we.id
           JOIN workout_session ws ON we.workout_id = ws.id
           WHERE sl.id = ? AND ws.user_id = ?""",
        (set_log_id, current_user["id"])
    )
    if not existing:
        raise HTTPException(status_code=404, detail="Set log not found")

    fields = {k: v for k, v in body.model_dump().items() if v is not None}
    if not fields:
        raise HTTPException(status_code=400, detail="No fields to update")

    set_clause = ", ".join(f"{k} = ?" for k in fields)
    values = list(fields.values()) + [set_log_id]

    db.execute(
        f"UPDATE set_logs SET {set_clause} WHERE id = ?", tuple(values)
    )

    updated = db.fetch_one("SELECT * FROM set_logs WHERE id = ?", (set_log_id,))
    return dict(updated)

# DELETE /api/set-logs/{id} — delete a set
@router.delete("/{set_log_id}")
def delete_set_log(
    set_log_id: int,
    current_user=Depends(get_current_user),
    db: WorkoutDatabase = Depends(get_db)
):
    existing = db.fetch_one(
        """SELECT sl.id FROM set_logs sl
           JOIN workout_exercise we ON sl.workout_exercise_id = we.id
           JOIN workout_session ws ON we.workout_id = ws.id
           WHERE sl.id = ? AND ws.user_id = ?""",
        (set_log_id, current_user["id"])
    )
    if not existing:
        raise HTTPException(status_code=404, detail="Set log not found")

    db.execute("DELETE FROM set_logs WHERE id = ?", (set_log_id,))
    return {"message": "Set log deleted"}