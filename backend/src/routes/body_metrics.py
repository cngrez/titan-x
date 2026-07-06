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

#GET /api/body-metrics/date/{date} — get body metric by date
@router.get("/date/{date}", response_model=BodyMetricResponse)
def get_body_metric_by_date(
    date: str,  # Format: YYYY-MM-DD
    current_user=Depends(get_current_user),
    db: WorkoutDatabase = Depends(get_db)
):
    body_metric = db.fetch_one(
        "SELECT * FROM body_metrics WHERE date = ? AND user_id = ?",
        (date, current_user.id)
    )
    if not body_metric:
        raise HTTPException(status_code=404, detail="Body metric not found for the specified date")
    return dict(body_metric)

#GET /api/body-metrics/range?start_date=YYYY-MM-DD&end_date=YYYY-MM-DD — get body metrics in a date range
@router.get("/range", response_model=list[BodyMetricResponse])
def get_body_metrics_in_range(
    start_date: str,  # Format: YYYY-MM-DD
    end_date: str,    # Format: YYYY-MM-DD
    current_user=Depends(get_current_user),
    db: WorkoutDatabase = Depends(get_db)
):
    body_metrics = db.fetch_all(
        "SELECT * FROM body_metrics WHERE date BETWEEN ? AND ? AND user_id = ? ORDER BY date ASC",
        (start_date, end_date, current_user.id)
    )
    return [dict(bm) for bm in body_metrics]

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
    body_metric_id: int,
    body: UpdateBodyMetricsRequest,
    current_user=Depends(get_current_user),
    db: WorkoutDatabase = Depends(get_db)
):
    existing = db.fetch_one(
        "SELECT id FROM body_metrics WHERE id = ? AND user_id = ?",
        (body_metric_id, current_user.id)
    )
    if not existing:
        raise HTTPException(status_code=404, detail="Set log not found")

    fields = {k: v for k, v in body.model_dump().items() if v is not None}
    if not fields:
        raise HTTPException(status_code=400, detail="No fields to update")

    set_clause = ", ".join(f"{k} = ?" for k in fields)
    values = list(fields.values()) + [body_metric_id]
    
    db.execute(
        f"UPDATE body_metrics SET {set_clause} WHERE id = ? AND user_id = ?",
        values + [current_user.id]
    )
    update_body_metrics = db.fetch_one(
        "SELECT * FROM body_metrics WHERE id = ? AND user_id = ?",
        (body_metric_id, current_user.id)
    )
    return dict(update_body_metrics)
    
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