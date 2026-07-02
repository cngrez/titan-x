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
            self.conn.executescript(self.schema_path.read_text(encoding="utf-8"))
            print("Database initialized successfully!")

    def seed(self):
        """Insert seed data."""
        if not self.seed_path.exists():
            print("⚠️ No seed file found. Skipping...")
            return

        print(" Seeding database...")

        # Check if already seeded
        count = self.fetch_one("SELECT COUNT(*) as count FROM users")['count']
        if count > 0:
            print(" Database already seeded. Skipping...")
            return

        with self.conn:
            self.conn.executescript(
                self.seed_path.read_text(encoding="utf-8")
            )

        print("Database seeded successfully!")

    def execute(self, sql: str, params: tuple = ()):
        """Execute INSERT/UPDATE/DELETE statements."""
        with self.conn:
            cursor = self.conn.execute(sql, params)
            print(f"Executed SQL: {sql} with params: {params}")

        return cursor

    def fetch_one(self, sql: str, params: tuple = ()):
        """Return a single row."""
        cursor = self.conn.execute(sql, params)
        print(f"Executed SQL: {sql} with params: {params}")
        return cursor.fetchone()

    def fetch_all(self, sql: str, params: tuple = ()):
        """Return multiple rows."""
        cursor = self.conn.execute(sql, params)
        print(f"Executed SQL: {sql} with params: {params}")
        return cursor.fetchall()

    def close(self):
        """Close the database connection."""
        print("Database connection closed.")
        self.conn.close()
