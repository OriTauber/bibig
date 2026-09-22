CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE workouts (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('strength', 'run', 'ride')),
  kind TEXT NOT NULL,
  performed_at TIMESTAMPTZ NOT NULL,
  title TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL
);
CREATE INDEX workouts_user_performed_at_idx ON workouts(user_id, performed_at DESC);

CREATE TABLE strength_exercises (
  id UUID PRIMARY KEY,
  workout_id UUID NOT NULL REFERENCES workouts(id) ON DELETE CASCADE,
  exercise_id TEXT NOT NULL,
  position INTEGER NOT NULL CHECK (position >= 0),
  UNIQUE (workout_id, position)
);

CREATE TABLE strength_sets (
  id UUID PRIMARY KEY,
  strength_exercise_id UUID NOT NULL REFERENCES strength_exercises(id) ON DELETE CASCADE,
  set_number INTEGER NOT NULL CHECK (set_number >= 0),
  reps INTEGER NOT NULL CHECK (reps > 0),
  weight_kg NUMERIC(10, 3) NOT NULL CHECK (weight_kg >= 0),
  completed BOOLEAN NOT NULL,
  UNIQUE (strength_exercise_id, set_number)
);

CREATE TABLE endurance_details (
  workout_id UUID PRIMARY KEY REFERENCES workouts(id) ON DELETE CASCADE,
  distance_meters NUMERIC(12, 3) NOT NULL CHECK (distance_meters > 0),
  duration_seconds INTEGER NOT NULL CHECK (duration_seconds > 0),
  elevation_gain_m NUMERIC(12, 3),
  average_heart_rate INTEGER CHECK (average_heart_rate > 0)
);
