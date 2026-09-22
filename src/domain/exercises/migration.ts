import { findExercise } from './catalog'
import type { Workout } from '../workouts/models'

export function normalizeWorkoutExercises(workout: Workout): Workout {
  let changed = false
  const exercises = workout.exercises.map((exercise) => {
    // Prefer the canonical ID, but recover legacy/inconsistent IndexedDB records by name.
    const canonical = (exercise.exerciseId && findExercise(exercise.exerciseId)) || findExercise(exercise.name)
    if (!canonical) return exercise
    if (exercise.exerciseId === canonical.id && exercise.name === canonical.name) return exercise
    changed = true
    return { ...exercise, exerciseId: canonical.id, name: canonical.name }
  })
  return changed ? { ...workout, exercises, updatedAt: new Date().toISOString() } : workout
}
