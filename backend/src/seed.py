from database import WorkoutDatabase

def main():
    db = WorkoutDatabase("workout.db")
    db.initialize()
    db.seed()
    db.close()

if __name__ == "__main__":
    main()

# To seed data, execute the following command in your terminal:
# python backend/src/seed.py
