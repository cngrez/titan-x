CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password VARCHAR (255) NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS body_metrics (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    weight DECIMAL (5, 2) NOT NULL,
    height DECIMAL (5, 2) NOT NULL,
    body_fat_percentage DECIMAL (4, 1),
    muscle_mass DECIMAL (4, 1),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    notes TEXT,
    user_id INTEGER NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS workoutSession(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date DATETIME,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    user_id INTEGER NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
    routine_id INTEGER,
    FOREIGN KEY (routine_id) REFERENCES workoutRoutines (id) ON DELETE CASCADE
)

CREATE TABLE IF NOT EXISTS routine(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    is_template BOOLEAN DEFAULT TRUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    user_id INTEGER NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
)

CREATE TABLE IF NOT EXISTS routineExercise(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_index INTEGER NOT NULL,
    default_sets INTEGER NOT NULL,  
    default_reps INTEGER NOT NULL,
    default_weight DECIMAL (5, 2) NOT NULL,
    notes TEXT, 
    exercise_id INTEGER NOT NULL,
    FOREIGN KEY (exercise_id) REFERENCES exercises (id) ON DELETE CASCADE,
    routine_id INTEGER NOT NULL,
    FOREIGN KEY (routine_id) REFERENCES routine (id) ON DELETE CASCADE
)

CREATE TABLE IF NOT EXISTS exercise(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR (100) NOT NULL,
    category VARCHAR (50) NOT NULL,
    muscle_group VARCHAR (50) NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
)

CREATE TABLE IF NOT EXISTS workoutExercise(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_index INTEGER NOT NULL,
    notes TEXT,
    workout_id INTEGER NOT NULL,
    FOREIGN KEY (workout_id) REFERENCES workoutSession (id) ON DELETE CASCADE,
    exercise_id INTEGER NOT NULL,
    FOREIGN KEY (exercise_id) REFERENCES exercise (id) ON DELETE CASCADE
)
