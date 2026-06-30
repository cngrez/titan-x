from pathlib import Path
import sqlite3


class WorkoutDatabase:
    def __init__(self, db_path: str = "workout.db"):
        self.db_path = db_path

        self.base_path = Path(__file__).parent
        self.schema_path = self.base_path / "schema.sql"
        self.seed_path = self.base_path / "seed.sql"

        self.conn = sqlite3.connect(self.db_path)
        self.conn.row_factory = sqlite3.Row

        self.conn.execute("PRAGMA foreign_keys = ON")


    def initialize(self):
        """Create all database tables."""
        print("Initializing database...")

        with self.conn:
            self.conn.executescript(
                self.schema_path.read_text(encoding="utf-8")
            )
