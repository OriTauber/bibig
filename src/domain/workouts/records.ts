import { calculateEstimatedOneRepMax } from './calculations'
import type { PersonalRecord, Workout } from './models'

export function calculatePersonalRecords(workouts: Workout[]): PersonalRecord[] {
  const records = new Map<string, PersonalRecord>()
  for (const workout of workouts) {
    for (const exercise of workout.exercises) {
      for (const set of exercise.sets.filter((entry) => entry.completed)) {
        const estimate = calculateEstimatedOneRepMax(set.weightKg, set.reps)
        const current = records.get(exercise.name)
        if (!current || estimate > current.estimatedOneRepMaxKg) {
          records.set(exercise.name, { exerciseName: exercise.name, estimatedOneRepMaxKg: estimate, workoutId: workout.id, performedAt: workout.performedAt })
        }
      }
    }
  }
  return [...records.values()].sort((a, b) => b.estimatedOneRepMaxKg - a.estimatedOneRepMaxKg)
}
