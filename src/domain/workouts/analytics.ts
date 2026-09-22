import { calculateEstimatedOneRepMax, calculatePace, calculateSpeedKph, calculateWorkoutVolume } from './calculations'
import type { Workout, WorkoutKind, WorkoutType } from './models'

export type Aggregation = 'week' | 'month'
export interface TrendPoint { key: string; label: string; value: number; breakdown: Partial<Record<WorkoutType, number>> }
export interface StrengthPerformance { workoutId: string; performedAt: string; weightKg: number; reps: number; volumeKg: number; estimatedOneRepMaxKg: number; bestEstimatedOneRepMaxKg: number; bestEstimatedWeightKg: number; bestEstimatedReps: number }
export interface ExerciseProgression { exerciseId: string; exerciseName: string; workoutKinds: WorkoutKind[]; performances: StrengthPerformance[] }
export interface EndurancePerformance { workoutId: string; title: string; kind: WorkoutKind; performedAt: string; distanceKm: number; durationSeconds: number; paceSecondsPerKm?: number; averageSpeedKph?: number }
export interface PersonalRecordEntry { label: string; value: string; detail: string; performedAt: string; workoutId: string }

function periodKey(date: Date, aggregation: Aggregation): string {
  if (aggregation === 'month') return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
  const local = new Date(date.getFullYear(), date.getMonth(), date.getDate()); const day = local.getDay() || 7; local.setDate(local.getDate() + 4 - day)
  const yearStart = new Date(local.getFullYear(), 0, 1); const week = Math.ceil((((local.valueOf() - yearStart.valueOf()) / 86400000) + 1) / 7)
  return `${local.getFullYear()}-W${String(week).padStart(2, '0')}`
}
function periodLabel(key: string, aggregation: Aggregation): string { return aggregation === 'month' ? new Intl.DateTimeFormat(undefined, { month: 'short', year: '2-digit' }).format(new Date(`${key}-01T12:00:00`)) : key.replace('-', ' ') }
function trend(workouts: Workout[], aggregation: Aggregation, value: (workout: Workout) => number): TrendPoint[] {
  const periods = new Map<string, TrendPoint>()
  for (const workout of workouts) { const key = periodKey(new Date(workout.performedAt), aggregation); const point = periods.get(key) ?? { key, label: periodLabel(key, aggregation), value: 0, breakdown: {} }; point.value += value(workout); point.breakdown[workout.type] = (point.breakdown[workout.type] ?? 0) + value(workout); periods.set(key, point) }
  return [...periods.values()].sort((a, b) => a.key.localeCompare(b.key))
}

export function workoutFrequencyTrend(workouts: Workout[], aggregation: Aggregation): TrendPoint[] { return trend(workouts, aggregation, () => 1) }
export function strengthVolumeTrend(workouts: Workout[], aggregation: Aggregation): TrendPoint[] { return trend(workouts.filter((workout) => workout.type === 'strength'), aggregation, calculateWorkoutVolume) }
export function thisWeekWorkoutCount(workouts: Workout[], now = new Date()): number { return workouts.filter((workout) => periodKey(new Date(workout.performedAt), 'week') === periodKey(now, 'week')).length }
export function thisMonthWorkoutCount(workouts: Workout[], now = new Date()): number { return workouts.filter((workout) => periodKey(new Date(workout.performedAt), 'month') === periodKey(now, 'month')).length }

export function strengthProgression(workouts: Workout[]): ExerciseProgression[] {
  const result = new Map<string, ExerciseProgression>()
  for (const workout of workouts.filter((entry) => entry.type === 'strength')) for (const exercise of workout.exercises) {
    const exerciseId = exercise.exerciseId ?? `legacy:${exercise.name.toLowerCase()}`
    const current = result.get(exerciseId) ?? { exerciseId, exerciseName: exercise.name, workoutKinds: [], performances: [] }
    if (!current.workoutKinds.includes(workout.kind)) current.workoutKinds.push(workout.kind)
    for (const set of exercise.sets.filter((entry) => entry.completed)) { const estimatedOneRepMaxKg = calculateEstimatedOneRepMax(set.weightKg, set.reps); current.performances.push({ workoutId: workout.id, performedAt: workout.performedAt, weightKg: set.weightKg, reps: set.reps, volumeKg: set.weightKg * set.reps, estimatedOneRepMaxKg, bestEstimatedOneRepMaxKg: estimatedOneRepMaxKg, bestEstimatedWeightKg: set.weightKg, bestEstimatedReps: set.reps }) }
    result.set(exerciseId, current)
  }
  return [...result.values()].map((entry) => {
    const byWorkout = new Map<string, StrengthPerformance>()
    for (const performance of entry.performances) {
      const current = byWorkout.get(performance.workoutId)
      if (!current) { byWorkout.set(performance.workoutId, performance); continue }
      const topSet = performance.weightKg > current.weightKg ? performance : current
      const bestEstimated = performance.bestEstimatedOneRepMaxKg > current.bestEstimatedOneRepMaxKg ? performance : current
      byWorkout.set(performance.workoutId, { ...topSet, volumeKg: current.volumeKg + performance.volumeKg, bestEstimatedOneRepMaxKg: bestEstimated.bestEstimatedOneRepMaxKg, bestEstimatedWeightKg: bestEstimated.bestEstimatedWeightKg, bestEstimatedReps: bestEstimated.bestEstimatedReps })
    }
    return { ...entry, performances: [...byWorkout.values()].sort((a, b) => a.performedAt.localeCompare(b.performedAt)) }
  }).filter((entry) => entry.performances.length > 0)
}

export function enduranceHistory(workouts: Workout[], type: 'run' | 'ride'): EndurancePerformance[] {
  return workouts.filter((workout) => workout.type === type && workout.endurance).map((workout) => ({ workoutId: workout.id, title: workout.title, kind: workout.kind, performedAt: workout.performedAt, distanceKm: workout.endurance!.distanceKm, durationSeconds: workout.endurance!.durationSeconds, paceSecondsPerKm: type === 'run' ? calculatePace(workout.endurance!) ?? undefined : undefined, averageSpeedKph: type === 'ride' ? calculateSpeedKph(workout.endurance!) ?? undefined : undefined })).sort((a, b) => a.performedAt.localeCompare(b.performedAt))
}

export function personalRecords(workouts: Workout[]): PersonalRecordEntry[] {
  const records: PersonalRecordEntry[] = []
  for (const exercise of strengthProgression(workouts)) { const best = exercise.performances.reduce((best, current) => current.bestEstimatedOneRepMaxKg > best.bestEstimatedOneRepMaxKg ? current : best); records.push({ label: exercise.exerciseName, value: `${best.bestEstimatedOneRepMaxKg.toFixed(1)} kg e1RM`, detail: `${best.bestEstimatedWeightKg} kg × ${best.bestEstimatedReps}`, performedAt: best.performedAt, workoutId: best.workoutId }) }
  const runs = enduranceHistory(workouts, 'run'); if (runs.length) { const longest = runs.reduce((best, current) => current.distanceKm > best.distanceKm ? current : best); records.push({ label: 'Longest run', value: `${longest.distanceKm.toFixed(2)} km`, detail: longest.title, performedAt: longest.performedAt, workoutId: longest.workoutId }); const fastest = runs.filter((run) => run.paceSecondsPerKm).reduce<EndurancePerformance | null>((best, current) => !best || current.paceSecondsPerKm! < best.paceSecondsPerKm! ? current : best, null); if (fastest) records.push({ label: 'Fastest run pace', value: `${Math.floor(fastest.paceSecondsPerKm! / 60)}:${String(Math.round(fastest.paceSecondsPerKm! % 60)).padStart(2, '0')} / km`, detail: fastest.title, performedAt: fastest.performedAt, workoutId: fastest.workoutId }) }
  const rides = enduranceHistory(workouts, 'ride'); if (rides.length) { const longest = rides.reduce((best, current) => current.distanceKm > best.distanceKm ? current : best); records.push({ label: 'Longest ride', value: `${longest.distanceKm.toFixed(2)} km`, detail: longest.title, performedAt: longest.performedAt, workoutId: longest.workoutId }); const fastest = rides.filter((ride) => ride.averageSpeedKph).reduce<EndurancePerformance | null>((best, current) => !best || current.averageSpeedKph! > best.averageSpeedKph! ? current : best, null); if (fastest) records.push({ label: 'Highest average speed', value: `${fastest.averageSpeedKph!.toFixed(1)} km/h`, detail: fastest.title, performedAt: fastest.performedAt, workoutId: fastest.workoutId }) }
  return records.sort((a, b) => b.performedAt.localeCompare(a.performedAt))
}
