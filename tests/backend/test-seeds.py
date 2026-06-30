"""
Schema validation tests.

AI Assistance: This file was developed with assistance from DeepSeek

Prompts used:
- "Write a Python script to check if seeding data was successful"
"""
import sqlite3

conn = sqlite3.connect("workout.db")
cursor = conn.cursor()

tables = ['users', 'exercise', 'routine', 'workout_session', 'set_logs']
print("✅ Seed data counts:")

for table in tables:
    cursor.execute(f"SELECT COUNT(*) FROM {table}")
    count = cursor.fetchone()[0]
    print(f"  {table}: {count} rows")

conn.close()


 #To run the test, execute the following command in your terminal:
# python tests/backend/test-seeds.py
