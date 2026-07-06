from fastapi import APIRouter, Depends, HTTPException
from models.body_metrics import CreateBodyMetricsRequest, UpdateBodyMetricsRequest, BodyMetricResponse
from dependencies.db import get_db
from dependencies.auth import get_current_user
from database.database import WorkoutDatabase

router = APIRouter(prefix="/body-metrics", tags=["body_metrics"])

#GET /api/body-metrics — anyone logged in can see all body metrics
@router.get("/", response_model=list[BodyMetricResponse])
def get_all_body_metrics(
    current_user=Depends(get_current_user),
    db: WorkoutDatabase = Depends(get_db)
):
    body_metrics = db.fetch_all("SELECT * FROM body_metrics WHERE user_id = ?", (current_user.id,))
    return [dict(bm) for bm in body_metrics]

#GET /api/body-metrics/latest — get the latest body metric
@router.get("/latest", response_model=BodyMetricResponse)
def get_latest_body_metric(
    current_user=Depends(get_current_user),
    db: WorkoutDatabase = Depends(get_db)
):
    body_metric = db.fetch_one(
        "SELECT * FROM body_metrics WHERE user_id = ? ORDER BY date DESC LIMIT 1",
        (current_user.id,)
    )
    if not body_metric:
        raise HTTPException(status_code=404, detail="No body metrics found")
    return dict(body_metric)

#GET /api/body-metrics/{id} — get single body metric
@router.get("/{body_metric_id}", response_model=BodyMetricResponse)
def get_body_metric_by_id(
    body_metric_id: int, 
    current_user=Depends(get_current_user),
    db: WorkoutDatabase = Depends(get_db)
):
    body_metric = db.fetch_one(
        "SELECT * FROM body_metrics WHERE id = ? AND user_id = ?",
        (body_metric_id, current_user.id)
    )
    if not body_metric:
        raise HTTPException(status_code=404, detail="Body metric not found")
    return dict(body_metric)

#POST /api/body-metrics - users can create own body metrics
@router.post("/", response_model=BodyMetricResponse, status_code=201)
def create_body_metrics(
    body: CreateBodyMetricsRequest,
    current_user=Depends(get_current_user),
    db: WorkoutDatabase = Depends(get_db)
):
    existing = db.fetch_one(
        "SELECT id FROM body_metrics WHERE date = DATE('now') AND user_id = ?",
        (current_user.id,)
    )
    if existing:
        raise HTTPException(status_code=400, detail="Body metrics for today already exist")
    
    cursor = db.execute(
        "INSERT INTO body_metrics (weight, body_fat_percentage, muscle_mass, notes, user_id) VALUES (?, ?, ?, ?, ?)",
        (body.weight, body.body_fat_percentage, body.muscle_mass, body.notes, current_user.id)
    )
    body_metric = db.fetch_one(
        "SELECT * FROM body_metrics WHERE id = ?", (cursor.lastrowid,)
    )
    return dict(body_metric)

#PATCH /api/body-metrics/{id} - users can update own body metrics   
@router.patch("/{body_metric_id}", response_model=BodyMetricResponse)
def update_body_metrics(
    body_metric_id: UpdateBodyMetricsRequest,
    current_user=Depends(get_current_user),
    db: WorkoutDatabase = Depends(get_db)
):
    existing = db.fetch_one(
        "SELECT id FROM body_metrics WHERE id = ? AND user_id = ?",
        (body_metric_id, current_user.id)
    )
    if not existing:
        raise HTTPException(status_code=404, detail="Body metric not found")

    db.execute(
        "UPDATE body_metrics SET weight = ?, body_fat_percentage = ?, muscle_mass = ?, notes = ? WHERE id = ? AND user_id = ?",
        (body_metric_id.weight, body_metric_id.body_fat_percentage, body_metric_id.muscle_mass, body_metric_id.notes, body_metric_id, current_user.id)
    )
    updated_body_metric = db.fetch_one(
        "SELECT * FROM body_metrics WHERE id = ?", (body_metric_id,)
    )
    return dict(updated_body_metric
)
    
#DELETE /api/body-metrics/{id} - users can delete own body metrics
@router.delete("/{body_metric_id}", status_code=204)
def delete_body_metrics(
    body_metric_id: int,
    current_user=Depends(get_current_user),
    db: WorkoutDatabase = Depends(get_db)
):
    existing = db.fetch_one(
        "SELECT id FROM body_metrics WHERE id = ? AND user_id = ?",
        (body_metric_id, current_user.id)
    )
    if not existing:
        raise HTTPException(status_code=404, detail="Body metric not found")

    db.execute(
        "DELETE FROM body_metrics WHERE id = ? AND user_id = ?",
        (body_metric_id, current_user.id)
    )
    return