from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database.database import WorkoutDatabase

from routes.auth import router as auth_router
from routes.user import router as user_router
from routes.exercise import router as exercise_router
from routes.routine import router as routine_router
from routes.body_metrics import router as body_metrics_router
from routes.workout_session import router as workout_session_router
from routes.routine_exercise import router as routine_exercise_router
from routes.workout_exercise import router as workout_exercise_router

def create_app():
    app = FastAPI(
        title="TitanX API",
        version="1.0.0",
        description="Workout tracking API"
    )

    # Run schema on startup
    db = WorkoutDatabase()
    db.initialize()
    db.seed()
    db.close()

    app.add_middleware(
        CORSMiddleware,
        allow_origins=["http://localhost:3000"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    app.include_router(auth_router, prefix="/api")
    app.include_router(user_router, prefix="/api")
    app.include_router(exercise_router, prefix="/api")
    app.include_router(routine_router, prefix="/api")
    app.include_router(body_metrics_router, prefix="/api")
    app.include_router(workout_session_router, prefix="/api")
    app.include_router(routine_exercise_router, prefix="/api")
    app.include_router(workout_exercise_router, prefix="/api")
    
    return app

app = create_app()