import type { Workout } from './models'

export interface ValidationResult { valid: boolean; errors: string[] }

export function validateWorkout(workout: Workout): ValidationResult {
  const errors: string[] = []
  if (!workout.title.trim()) errors.push('A workout title is required.')
  if (workout.title.length > 200) errors.push('Title must be 200 characters or fewer.')
  if ((workout.notes?.length ?? 0) > 5000) errors.push('Notes must be 5000 characters or fewer.')
  if (Number.isNaN(new Date(workout.performedAt).valueOf())) errors.push('Workout date is invalid.')
  if (workout.type === 'strength' && workout.exercises.length === 0) errors.push('Add at least one exercise.')
  if (workout.type !== 'strength' && (!workout.endurance || workout.endurance.distanceKm <= 0 || workout.endurance.durationSeconds <= 0)) errors.push('Distance and duration must be greater than zero.')
  if (workout.endurance) {
    const details = workout.endurance
    if (!Number.isFinite(details.distanceKm) || !Number.isInteger(details.durationSeconds)) errors.push('Distance must be a number and duration must be whole seconds.')
    if (details.elevationGainM !== undefined && (!Number.isFinite(details.elevationGainM) || details.elevationGainM < 0)) errors.push('Elevation gain must be zero or greater.')
    if (details.averageHeartRate !== undefined && (!Number.isInteger(details.averageHeartRate) || details.averageHeartRate <= 0)) errors.push('Heart rate must be a positive whole number.')
  }
  for (const exercise of workout.exercises) {
    if (!exercise.sets.length) errors.push('Add at least one set to each exercise.')
    if (!exercise.exerciseId || !exercise.name.trim()) errors.push('Choose an exercise from the catalog.')
    for (const set of exercise.sets) if (!Number.isInteger(set.reps) || set.reps <= 0 || !Number.isFinite(set.weightKg) || set.weightKg < 0) errors.push('Set reps must be positive whole numbers and weight cannot be negative.')
  }
  return { valid: errors.length === 0, errors }
}
