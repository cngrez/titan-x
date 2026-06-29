"""
Schema validation tests.

AI Assistance: This file was developed with assistance from DeepSeek

Prompts used:
- "Write a Python script to validate my database schema"
"""

import sqlite3
from pathlib import Path

def test_schema():
    """Validate the database schema."""
    
    # Get the project root
    project_root = Path(__file__).parent.parent.parent
    
    # Read the schema file
    schema_path = project_root / "backend" / "database" / "schema.sql"
    
    with open(schema_path, "r") as f:
        schema_sql = f.read()

    # Connect to in-memory database
    conn = sqlite3.connect(":memory:")
    cursor = conn.cursor()

    try:
        cursor.executescript(schema_sql)
        print("✅ Schema executed successfully!")

        # Check tables
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
        tables = cursor.fetchall()
        print(f"\n Tables created: {len(tables)}")
        for table in tables:
            print(f"  - {table[0]}")

    except sqlite3.Error as e:
        print(f"❌ {repr(e)}")

    finally:
        conn.close()

if __name__ == "__main__":
    test_schema()

    #To run the test, execute the following command in your terminal:
    # python tests/backend/test-schema.py
