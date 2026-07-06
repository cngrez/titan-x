from fastapi import APIRouter, Depends, HTTPException
from models.routine import CreateRoutineRequest, UpdateRoutineRequest, RoutineResponse
from dependencies.db import get_db
from dependencies.auth import get_current_user, get_current_admin_user
from database.database import WorkoutDatabase

router = APIRouter(prefix="/routines", tags=["routines"])

# GET /api/routines — anyone logged in can see all routines
@router.get("/", response_model=list[RoutineResponse])
def get_all_routines(
    current_user=Depends(get_current_user),
    db: WorkoutDatabase = Depends(get_db)
):
    routines = db.fetch_all("SELECT * FROM routine WHERE user_id = ?", (current_user.id,))
    return [dict(r) for r in routines]

# GET /api/routines/{id} — get single routine
@router.get("/{routine_id}", response_model=RoutineResponse)
def get_routine(
    routine_id: int,
    current_user=Depends(get_current_user),
    db: WorkoutDatabase = Depends(get_db)
):
    routine = db.fetch_one(
        "SELECT * FROM routine WHERE id = ? AND user_id = ?", (routine_id, current_user.id)
    )
    if not routine:
        raise HTTPException(status_code=404, detail="Routine not found")
    return dict(routine)


# POST /api/routines — user can create their own routine
@router.post("/", response_model=RoutineResponse, status_code=201)
def create_routine(
    body: CreateRoutineRequest,
    current_user=Depends(get_current_user),
    db: WorkoutDatabase = Depends(get_db),
):
    existing = db.fetch_one(
        "SELECT id FROM routine WHERE name = ? AND user_id = ?", (body.name, current_user.id)
    )
    if existing:
        raise HTTPException(status_code=400, detail="Routine already exists")

    cursor = db.execute(
        "INSERT INTO routine (name, description, user_id) VALUES (?, ?, ?)",
        (body.name, body.description, current_user.id)
    )
    routine = db.fetch_one(
        "SELECT * FROM routine WHERE id = ?", (cursor.lastrowid,)
    )
    return dict(routine)


#PATCH /api/routines/{id} — user can update their own routine
@router.patch("/{routine_id}", response_model=RoutineResponse)
def update_routine(
    routine_id: int,
    body: UpdateRoutineRequest,
    current_user=Depends(get_current_user),
    db: WorkoutDatabase = Depends(get_db)
):
    existing = db.fetch_one(
        "SELECT id FROM routine WHERE id = ? AND user_id = ?", (routine_id, current_user.id)
    )
    if not existing:
        raise HTTPException(status_code=404, detail="Routine not found")

    db.execute(
        "UPDATE routine SET name = ?, description = ? WHERE id = ? AND user_id = ?",
        (body.name, body.description, routine_id, current_user.id)
    )
    routine = db.fetch_one(
        "SELECT * FROM routine WHERE id = ?", (routine_id,)
    )
    return dict(routine)

#DELETE /api/routines/{id} — user can delete their own routine
@router.delete("/{routine_id}")
def delete_routine(
    routine_id: int,
    current_user=Depends(get_current_user),
    db: WorkoutDatabase = Depends(get_db)
):
    existing = db.fetch_one(
        "SELECT id FROM routine WHERE id = ? AND user_id = ?", (routine_id, current_user.id)
    )
    if not existing:
        raise HTTPException(status_code=404, detail="Routine not found")
    
    db .execute(
        "DELETE FROM routine WHERE id = ? AND user_id = ?", (routine_id, current_user.id)
    )
    return {"message": "Routine deleted"}
