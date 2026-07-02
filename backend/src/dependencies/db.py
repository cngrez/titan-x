from database.database import WorkoutDatabase

def get_db():
    """Get database connection."""
    db = WorkoutDatabase()
    try:
        yield db
    finally:
        db.close()