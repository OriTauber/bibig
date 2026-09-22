import { calculateWorkoutVolume } from './calculations'
import type { Workout } from './models'

export interface WorkoutStatistics {
  workoutCount: number
  strengthVolumeKg: number
  distanceKm: number
  durationSeconds: number
}

export function calculateStatistics(workouts: Workout[]): WorkoutStatistics {
  return workouts.reduce<WorkoutStatistics>((statistics, workout) => ({
    workoutCount: statistics.workoutCount + 1,
    strengthVolumeKg: statistics.strengthVolumeKg + calculateWorkoutVolume(workout),
    distanceKm: statistics.distanceKm + (workout.endurance?.distanceKm ?? 0),
    durationSeconds: statistics.durationSeconds + (workout.endurance?.durationSeconds ?? 0),
  }), { workoutCount: 0, strengthVolumeKg: 0, distanceKm: 0, durationSeconds: 0 })
}

export function getWorkoutsInRange(workouts: Workout[], start: Date, end: Date): Workout[] {
  return workouts.filter((workout) => {
    const date = new Date(workout.performedAt)
    return date >= start && date <= end
  })
}
