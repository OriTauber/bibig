import type { EnduranceDetails, Workout } from './models'

export function calculateWorkoutVolume(workout: Workout): number {
  return workout.exercises.flatMap((exercise) => exercise.sets)
    .filter((set) => set.completed)
    .reduce((total, set) => total + set.weightKg * set.reps, 0)
}

export function calculateEstimatedOneRepMax(weightKg: number, reps: number): number {
  if (weightKg <= 0 || reps <= 0) return 0
  return (weightKg * 36) / (37 - reps)
}

export function calculatePace(details: EnduranceDetails): number | null {
  if (details.distanceKm <= 0 || details.durationSeconds < 0) return null
  return details.durationSeconds / details.distanceKm
}

export function calculateSpeedKph(details: EnduranceDetails): number | null {
  if (details.distanceKm < 0 || details.durationSeconds <= 0) return null
  return details.distanceKm / (details.durationSeconds / 3600)
}

export function formatDuration(seconds: number): string {
  const minutes = Math.floor(seconds / 60)
  const remainder = Math.round(seconds % 60).toString().padStart(2, '0')
  return `${minutes}:${remainder}`
}

export function formatElapsedDuration(seconds: number): string {
  const wholeSeconds = Math.max(0, Math.round(seconds))
  const hours = Math.floor(wholeSeconds / 3600).toString().padStart(2, '0')
  const minutes = Math.floor((wholeSeconds % 3600) / 60).toString().padStart(2, '0')
  const remainder = (wholeSeconds % 60).toString().padStart(2, '0')
  return `${hours}:${minutes}:${remainder}`
}
