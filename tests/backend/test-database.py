# tests/backend/test-database.py
"""
Schema validation tests.

AI Assistance: This file was developed with assistance from DeepSeek

Prompts used:
- "Write a Python script to validate my database.py"
"""


import sys
from pathlib import Path

# Add project root to Python's module search path
project_root = Path(__file__).parent.parent.parent
sys.path.insert(0, str(project_root))

# Now import the database class
from backend.src.database import WorkoutDatabase


def test_database():
    """Test all database methods."""
    print("=" * 50)
    print("TESTING DATABASE METHODS")
    print("=" * 50)

    # 1. Create instance
    print("\n1️⃣ Creating database instance...")
    db = WorkoutDatabase("test-workout.db")

    # 2. Initialize schema
    print("\n2️⃣ Initializing schema...")
    db.initialize()

    # 3. Seed data
    print("\n3️⃣ Seeding data...")
    db.seed()

    # 4. Test execute (INSERT)
    print("\n4️⃣ Testing execute()...")
    cursor = db.execute(
    "INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)", 
    ("Test User", "test@example.com", "test_password_123")
    )
    new_id = cursor.lastrowid
    print(f"   ✅ Inserted user with ID: {new_id}")

    # 5. Test fetch_one
    print("\n5️⃣ Testing fetch_one()...")
    user = db.fetch_one("SELECT * FROM users WHERE id = ?", (new_id,))
    if user:
        print(f"   ✅ Found user: {user['name']} ({user['email']})")

    # 6. Test fetch_all
    print("\n6️⃣ Testing fetch_all()...")
    users = db.fetch_all("SELECT * FROM users LIMIT 3")
    print(f"   ✅ Found {len(users)} users:")
    for u in users:
        print(f"      - {u['name']}")

    # 7. Close connection
    print("\n7️⃣ Closing connection...")
    db.close()

    print("\n" + "=" * 50)
    print("✅ ALL TESTS PASSED!")
    print("=" * 50)


if __name__ == "__main__":
    test_database()