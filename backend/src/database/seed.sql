-- ============================================================
-- 1. USERS
-- ============================================================
INSERT INTO users (first_name, last_name, email, password_hash, role) VALUES
('John', 'Doe', 'john@example.com', '$2b$12$inmNzaD4QR2dEEgILg29VegJlM4I6kiQAxVx73BU1OoXrnqAZAqPe', 'user'),
('Jane', 'Smith', 'jane@example.com', '$2b$12$aWBcE6MvU954dkuhfup2wugGCRHgK9P9EtuuDJDsrTFgEFyTuWxGa', 'user'),
('Alex', 'Johnson', 'alex@example.com', '$2b$12$2x4svyyMaoEbdYJfkCCWvujTmPEBQ1FvgrSwSdFsKs/mCVcqxenjK', 'user'),
('Admin', 'Admin', 'admin@example.com', '$2b$12$WwMZckocIT8SIWnrSBn1ROOZq6x.yZ/h2ez0gnN4wjXR1zWcD3l6u', 'admin');

-- ============================================================
-- 2. EXERCISES
-- ============================================================
INSERT INTO exercise (name, category, muscle_group) VALUES
-- Push Exercises (Chest, Shoulders, Triceps)
('Bench Press', 'Push', 'Chest'),
('Incline Dumbbell Press', 'Push', 'Upper Chest'),
('Shoulder Press', 'Push', 'Shoulders'),
('Tricep Pushdown', 'Push', 'Triceps'),
('Dips', 'Push', 'Chest'),
('Push Ups', 'Push', 'Chest'),
('Lateral Raises', 'Push', 'Shoulders'),
('Overhead Tricep Extension', 'Push', 'Triceps'),

-- Pull Exercises (Back, Biceps)
('Deadlift', 'Pull', 'Back'),
('Pull Ups', 'Pull', 'Back'),
('Bent Over Row', 'Pull', 'Back'),
('Lat Pulldown', 'Pull', 'Back'),
('Face Pulls', 'Pull', 'Rear Delts'),
('Bicep Curls', 'Pull', 'Biceps'),
('Hammer Curls', 'Pull', 'Biceps'),
('Seated Cable Rows', 'Pull', 'Back'),

-- Leg Exercises (Quads, Hamstrings, Glutes, Calves)
('Squat', 'Legs', 'Quads'),
('Romanian Deadlift', 'Legs', 'Hamstrings'),
('Leg Press', 'Legs', 'Quads'),
('Leg Curl', 'Legs', 'Hamstrings'),
('Calf Raises', 'Legs', 'Calves'),
('Lunges', 'Legs', 'Glutes'),
('Bulgarian Split Squat', 'Legs', 'Quads'),
('Hip Thrusts', 'Legs', 'Glutes'),

-- Core Exercises
('Plank', 'Core', 'Abs'),
('Russian Twists', 'Core', 'Obliques'),
('Hanging Leg Raises', 'Core', 'Abs'),
('Cable Crunches', 'Core', 'Abs'),
('Dead Bug', 'Core', 'Abs');

-- ============================================================
-- 3. ROUTINES
-- ============================================================
INSERT INTO routine (name, description, is_template, user_id) VALUES
('Push Day', 'Chest, shoulders, and triceps', 1, 1),
('Pull Day', 'Back and biceps', 1, 1),
('Leg Day', 'Quads, hamstrings, glutes, and calves', 1, 1),
('Upper Body', 'Chest, back, shoulders, arms', 1, 2),
('Lower Body', 'Legs and core', 1, 2),
('Full Body', 'Full body workout', 1, 3),
('Push Day', 'Chest, shoulders, and triceps', 1, 2),
('Pull Day', 'Back and biceps', 1, 3);

-- ============================================================
-- 4. ROUTINE EXERCISES
-- ============================================================
-- Push Day (routine_id = 1)
INSERT INTO routine_exercise (routine_id, exercise_id, order_index, default_sets, default_reps, default_weight) VALUES
(1, 1, 1, 3, 10, 60.00),   -- Bench Press
(1, 2, 2, 3, 10, 22.50),   -- Incline Dumbbell Press
(1, 3, 3, 3, 10, 40.00),   -- Shoulder Press
(1, 4, 4, 3, 12, 30.00),   -- Tricep Pushdown
(1, 5, 5, 3, 10, 0.00);    -- Dips (bodyweight)

-- Pull Day (routine_id = 2)
INSERT INTO routine_exercise (routine_id, exercise_id, order_index, default_sets, default_reps, default_weight) VALUES
(2, 9, 1, 3, 8, 100.00),   -- Deadlift
(2, 10, 2, 3, 8, 0.00),    -- Pull Ups (bodyweight)
(2, 11, 3, 3, 10, 60.00),  -- Bent Over Row
(2, 12, 4, 3, 10, 50.00),  -- Lat Pulldown
(2, 14, 5, 3, 12, 15.00);  -- Bicep Curls

-- Leg Day (routine_id = 3)
INSERT INTO routine_exercise (routine_id, exercise_id, order_index, default_sets, default_reps, default_weight) VALUES
(3, 17, 1, 3, 10, 100.00), -- Squat
(3, 18, 2, 3, 10, 80.00),  -- Romanian Deadlift
(3, 19, 3, 3, 10, 150.00), -- Leg Press
(3, 20, 4, 3, 12, 50.00),  -- Leg Curl
(3, 21, 5, 3, 15, 60.00);  -- Calf Raises

-- Upper Body (routine_id = 4)
INSERT INTO routine_exercise (routine_id, exercise_id, order_index, default_sets, default_reps, default_weight) VALUES
(4, 1, 1, 3, 10, 65.00),   -- Bench Press
(4, 10, 2, 3, 8, 0.00),    -- Pull Ups
(4, 3, 3, 3, 10, 35.00),   -- Shoulder Press
(4, 11, 4, 3, 10, 55.00),  -- Bent Over Row
(4, 14, 5, 3, 12, 17.50);  -- Bicep Curls

-- Lower Body (routine_id = 5)
INSERT INTO routine_exercise (routine_id, exercise_id, order_index, default_sets, default_reps, default_weight) VALUES
(5, 17, 1, 3, 10, 110.00), -- Squat
(5, 19, 2, 3, 10, 160.00), -- Leg Press
(5, 20, 3, 3, 12, 55.00),  -- Leg Curl
(5, 21, 4, 3, 15, 65.00),  -- Calf Raises
(5, 24, 5, 3, 12, 40.00);  -- Hip Thrusts

-- Full Body (routine_id = 6)
INSERT INTO routine_exercise (routine_id, exercise_id, order_index, default_sets, default_reps, default_weight) VALUES
(6, 1, 1, 3, 10, 60.00),   -- Bench Press
(6, 17, 2, 3, 10, 90.00),  -- Squat
(6, 9, 3, 3, 8, 95.00),    -- Deadlift
(6, 10, 4, 3, 8, 0.00),    -- Pull Ups
(6, 3, 5, 3, 10, 35.00);   -- Shoulder Press

-- ============================================================
-- 5. BODY METRICS
-- ============================================================
INSERT INTO body_metrics (user_id, weight, body_fat_percentage, muscle_mass, notes) VALUES
(1, 75.50, 15.2, 35.5, 'Morning weigh-in, pre-workout'),
(1, 75.80, 15.0, 35.8, 'End of bulk phase'),
(2, 62.30, 22.5, 28.0, 'Starting cut phase'),
(2, 61.80, 21.8, 28.5, 'Progressing well'),
(3, 80.10, 18.0, 38.0, 'Maintenance phase');

-- ============================================================
-- 6. WORKOUT SESSIONS
-- ============================================================
INSERT INTO workout_session (user_id, date, notes, routine_id) VALUES
(1, '2026-06-01 08:30:00', 'Good energy today!', 1),
(1, '2026-06-02 09:00:00', 'Felt strong on deadlifts', 2),
(1, '2026-06-03 07:45:00', 'Leg day - challenging but completed', 3),
(1, '2026-06-05 08:15:00', 'Push day - increased bench to 65kg', 1),
(2, '2026-06-01 17:30:00', 'Evening workout, felt great', 4),
(2, '2026-06-03 17:45:00', 'Lower body focus', 5),
(3, '2026-06-02 06:30:00', 'Early morning full body', 6),
(3, '2026-06-04 06:45:00', 'Pull day focus', 2),
(1, '2026-06-08 08:00:00', 'PR on squat!', 3),
(1, '2026-06-10 08:30:00', 'Chest felt strong', 1);

-- ============================================================
-- 7. WORKOUT EXERCISES
-- ============================================================
-- Workout 1: Push Day (workout_session_id = 1)
INSERT INTO workout_exercise (workout_id, exercise_id, order_index, notes) VALUES
(1, 1, 1, 'Focused on form'),
(1, 2, 2, 'Incline felt good'),
(1, 3, 3, 'Shoulder press with strict form'),
(1, 4, 4, 'Tricep burn'),
(1, 5, 5, 'Bodyweight dips');

-- Workout 2: Pull Day (workout_session_id = 2)
INSERT INTO workout_exercise (workout_id, exercise_id, order_index, notes) VALUES
(2, 9, 1, 'Deadlift PR attempt'),
(2, 10, 2, 'Weighted pull ups'),
(2, 11, 3, 'Row focus on lats'),
(2, 12, 4, 'Drop sets'),
(2, 14, 5, 'Bicep pump');

-- Workout 3: Leg Day (workout_session_id = 3)
INSERT INTO workout_exercise (workout_id, exercise_id, order_index, notes) VALUES
(3, 17, 1, 'ATG squats'),
(3, 18, 2, 'RDLs felt good'),
(3, 19, 3, 'Leg press with pauses'),
(3, 20, 4, 'Hamstring curls'),
(3, 21, 5, 'Calf raises to failure');

-- Workout 4: Push Day (workout_session_id = 4)
INSERT INTO workout_exercise (workout_id, exercise_id, order_index, notes) VALUES
(4, 1, 1, 'PR set!'),
(4, 2, 2, 'Incline press with pause'),
(4, 3, 3, 'Shoulder press'),
(4, 4, 4, 'Tricep pushdowns'),
(4, 5, 5, 'Dips');

-- ============================================================
-- 8. SET LOGS
-- ============================================================
-- Workout Exercise 1: Bench Press (workout_exercise_id = 1)
INSERT INTO set_logs (workout_exercise_id, set_number, reps, weight, rpe, is_warmup, notes) VALUES
(1, 1, 12, 40.00, 6, 1, 'Warmup set'),
(1, 2, 10, 55.00, 7, 0, 'Working set'),
(1, 3, 10, 60.00, 8, 0, 'Working set'),
(1, 4, 8, 62.50, 8, 0, 'Working set');

-- Workout Exercise 2: Incline Dumbbell Press (workout_exercise_id = 2)
INSERT INTO set_logs (workout_exercise_id, set_number, reps, weight, rpe, is_warmup, notes) VALUES
(2, 1, 10, 20.00, 6, 1, 'Warmup'),
(2, 2, 10, 22.50, 7, 0, ''),
(2, 3, 8, 25.00, 8, 0, '');

-- Workout Exercise 3: Shoulder Press (workout_exercise_id = 3)
INSERT INTO set_logs (workout_exercise_id, set_number, reps, weight, rpe, is_warmup, notes) VALUES
(3, 1, 10, 30.00, 6, 1, 'Warmup'),
(3, 2, 10, 40.00, 7, 0, ''),
(3, 3, 8, 45.00, 8, 0, '');

-- Workout Exercise 4: Deadlift (workout_exercise_id = 4)
INSERT INTO set_logs (workout_exercise_id, set_number, reps, weight, rpe, is_warmup, notes) VALUES
(4, 1, 8, 60.00, 5, 1, 'Warmup'),
(4, 2, 6, 80.00, 6, 1, 'Warmup'),
(4, 3, 5, 100.00, 7, 0, 'Working set'),
(4, 4, 3, 110.00, 8, 0, 'Working set');

-- Workout Exercise 5: Squat (workout_exercise_id = 5)
INSERT INTO set_logs (workout_exercise_id, set_number, reps, weight, rpe, is_warmup, notes) VALUES
(5, 1, 10, 60.00, 5, 1, 'Warmup'),
(5, 2, 8, 80.00, 6, 1, 'Warmup'),
(5, 3, 6, 100.00, 7, 0, 'Working set'),
(5, 4, 5, 110.00, 8, 0, 'Working set');

-- Workout Exercise 6: Bench Press PR (workout_exercise_id = 6)
INSERT INTO set_logs (workout_exercise_id, set_number, reps, weight, rpe, is_warmup, notes) VALUES
(6, 1, 10, 45.00, 5, 1, 'Warmup'),
(6, 2, 8, 55.00, 6, 0, ''),
(6, 3, 6, 65.00, 8, 0, 'PR!'),
(6, 4, 4, 70.00, 9, 0, 'New PR!');

-- Workout Exercise 7: Leg Press (workout_exercise_id = 7)
INSERT INTO set_logs (workout_exercise_id, set_number, reps, weight, rpe, is_warmup, notes) VALUES
(7, 1, 12, 100.00, 5, 1, 'Warmup'),
(7, 2, 10, 150.00, 7, 0, ''),
(7, 3, 8, 170.00, 8, 0, '');

-- Workout Exercise 8: Pull Ups (workout_exercise_id = 8)
INSERT INTO set_logs (workout_exercise_id, set_number, reps, weight, rpe, is_warmup, notes) VALUES
(8, 1, 8, 0.00, 6, 0, 'Bodyweight'),
(8, 2, 6, 0.00, 7, 0, ''),
(8, 3, 5, 0.00, 8, 0, '');

-- Workout Exercise 9: RDL (workout_exercise_id = 9)
INSERT INTO set_logs (workout_exercise_id, set_number, reps, weight, rpe, is_warmup, notes) VALUES
(9, 1, 12, 50.00, 5, 1, 'Warmup'),
(9, 2, 10, 70.00, 7, 0, ''),
(9, 3, 8, 85.00, 8, 0, '');

-- Workout Exercise 10: Bicep Curls (workout_exercise_id = 10)
INSERT INTO set_logs (workout_exercise_id, set_number, reps, weight, rpe, is_warmup, notes) VALUES
(10, 1, 12, 10.00, 5, 1, 'Warmup'),
(10, 2, 12, 15.00, 7, 0, ''),
(10, 3, 10, 17.50, 8, 0, '');


-- users: 3 rows
-- exercise: 29 rows
-- routine: 8 rows
-- workout_session: 10 rows
-- set_logs: 34 rows