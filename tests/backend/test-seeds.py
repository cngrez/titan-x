# quick_seed_check.py
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
