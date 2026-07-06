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
