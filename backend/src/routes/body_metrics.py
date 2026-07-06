from fastapi import APIRouter, Depends, HTTPException
from models.body_metrics import CreateBodyMetricsRequest, UpdateBodyMetricsRequest, BodyMetricResponse
from dependencies.db import get_db
from dependencies.auth import get_current_user
from database.database import WorkoutDatabase

router = APIRouter(prefix="/body-metrics", tags=["body metrics"])

# GET /api/body-metrics — get all my body metrics
@router.get("/", response_model=list[BodyMetricResponse])
def get_all_body_metrics(
    current_user=Depends(get_current_user),
    db: WorkoutDatabase = Depends(get_db)
):
    body_metrics = db.fetch_all(
        "SELECT * FROM body_metrics WHERE user_id = ? ORDER BY created_at DESC",
        (current_user["id"],)
    )
    return [dict(bm) for bm in body_metrics]

# GET /api/body-metrics/latest — must be before /{id}
@router.get("/latest", response_model=BodyMetricResponse)
def get_latest_body_metric(
    current_user=Depends(get_current_user),
    db: WorkoutDatabase = Depends(get_db)
):
    body_metric = db.fetch_one(
        "SELECT * FROM body_metrics WHERE user_id = ? ORDER BY created_at DESC LIMIT 1",
        (current_user["id"],)
    )
    if not body_metric:
        raise HTTPException(status_code=404, detail="No body metrics found")
    return dict(body_metric)

# GET /api/body-metrics/range?start_date=YYYY-MM-DD&end_date=YYYY-MM-DD — must be before /{id}
@router.get("/range", response_model=list[BodyMetricResponse])
def get_body_metrics_in_range(
    start_date: str,
    end_date: str,
    current_user=Depends(get_current_user),
    db: WorkoutDatabase = Depends(get_db)
):
    body_metrics = db.fetch_all(
        """SELECT * FROM body_metrics 
           WHERE user_id = ? 
           AND DATE(created_at) BETWEEN ? AND ?
           ORDER BY created_at ASC""",
        (current_user["id"], start_date, end_date)
    )
    return [dict(bm) for bm in body_metrics]

# GET /api/body-metrics/date/YYYY-MM-DD — must be before /{id}
@router.get("/date/{date}", response_model=BodyMetricResponse)
def get_body_metric_by_date(
    date: str,
    current_user=Depends(get_current_user),
    db: WorkoutDatabase = Depends(get_db)
):
    body_metric = db.fetch_one(
        "SELECT * FROM body_metrics WHERE DATE(created_at) = ? AND user_id = ?",
        (date, current_user["id"])
    )
    if not body_metric:
        raise HTTPException(status_code=404, detail="No body metric found for that date")
    return dict(body_metric)

# GET /api/body-metrics/{id} — dynamic route last
@router.get("/{body_metric_id}", response_model=BodyMetricResponse)
def get_body_metric_by_id(
    body_metric_id: int,
    current_user=Depends(get_current_user),
    db: WorkoutDatabase = Depends(get_db)
):
    body_metric = db.fetch_one(
        "SELECT * FROM body_metrics WHERE id = ? AND user_id = ?",
        (body_metric_id, current_user["id"])
    )
    if not body_metric:
        raise HTTPException(status_code=404, detail="Body metric not found")
    return dict(body_metric)

# POST /api/body-metrics
@router.post("/", response_model=BodyMetricResponse, status_code=201)
def create_body_metric(
    body: CreateBodyMetricsRequest,
    current_user=Depends(get_current_user),
    db: WorkoutDatabase = Depends(get_db)
):
    # only one entry per day
    existing = db.fetch_one(
        "SELECT id FROM body_metrics WHERE user_id = ? AND DATE(created_at) = DATE('now')",
        (current_user["id"],)
    )
    if existing:
        raise HTTPException(status_code=400, detail="Body metric for today already exists")

    cursor = db.execute(
        """INSERT INTO body_metrics (weight, body_fat_percentage, muscle_mass, notes, user_id)
           VALUES (?, ?, ?, ?, ?)""",
        (body.weight, body.body_fat_percentage, body.muscle_mass, body.notes, current_user["id"])
    )
    body_metric = db.fetch_one(
        "SELECT * FROM body_metrics WHERE id = ?", (cursor.lastrowid,)
    )
    return dict(body_metric)

# PATCH /api/body-metrics/{id}
@router.patch("/{body_metric_id}", response_model=BodyMetricResponse)
def update_body_metric(
    body_metric_id: int,
    body: UpdateBodyMetricsRequest,
    current_user=Depends(get_current_user),
    db: WorkoutDatabase = Depends(get_db)
):
    existing = db.fetch_one(
        "SELECT id FROM body_metrics WHERE id = ? AND user_id = ?",
        (body_metric_id, current_user["id"])
    )
    if not existing:
        raise HTTPException(status_code=404, detail="Body metric not found")

    fields = {k: v for k, v in body.model_dump().items() if v is not None}
    if not fields:
        raise HTTPException(status_code=400, detail="No fields to update")

    set_clause = ", ".join(f"{k} = ?" for k in fields)
    values = list(fields.values()) + [body_metric_id, current_user["id"]]

    db.execute(
        f"UPDATE body_metrics SET {set_clause} WHERE id = ? AND user_id = ?",
        tuple(values)
    )
    updated = db.fetch_one(
        "SELECT * FROM body_metrics WHERE id = ?", (body_metric_id,)
    )
    return dict(updated)

# DELETE /api/body-metrics/{id}
@router.delete("/{body_metric_id}", status_code=204)
def delete_body_metric(
    body_metric_id: int,
    current_user=Depends(get_current_user),
    db: WorkoutDatabase = Depends(get_db)
):
    existing = db.fetch_one(
        "SELECT id FROM body_metrics WHERE id = ? AND user_id = ?",
        (body_metric_id, current_user["id"])
    )
    if not existing:
        raise HTTPException(status_code=404, detail="Body metric not found")

    db.execute(
        "DELETE FROM body_metrics WHERE id = ? AND user_id = ?",
        (body_metric_id, current_user["id"])
    )
    return None