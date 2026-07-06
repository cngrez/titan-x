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

