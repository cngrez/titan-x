from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes.auth import router
from database.database import WorkoutDatabase

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

    app.include_router(router, prefix="/api")

    @app.get("/health")
    def health():
        return {"status": "healthy", "message": "TitanX API is running"}

    return app

app = create_app()