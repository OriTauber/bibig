import { describe, expect, it } from 'vitest'
import { enduranceHistory, personalRecords, strengthProgression, strengthVolumeTrend, workoutFrequencyTrend } from './analytics'
import type { Workout } from './models'

const workouts: Workout[] = [
  { id: 'strength-1', type: 'strength', kind: 'upper', title: 'Upper', performedAt: '2026-09-01T10:00:00.000Z', exercises: [{ id: 'bench', exerciseId: 'barbell-bench-press', name: 'Barbell Bench Press', sets: [{ id: 's1', weightKg: 80, reps: 8, completed: true }, { id: 's2', weightKg: 75, reps: 10, completed: true }, { id: 's3', weightKg: 60, reps: 10, completed: false }] }], createdAt: '', updatedAt: '' },
  { id: 'strength-2', type: 'strength', kind: 'pull', title: 'Pull', performedAt: '2026-09-08T10:00:00.000Z', exercises: [{ id: 'bench-2', exerciseId: 'barbell-bench-press', name: 'Barbell Bench Press', sets: [{ id: 's3', weightKg: 85, reps: 8, completed: true }] }], createdAt: '', updatedAt: '' },
  { id: 'run-1', type: 'run', kind: 'easy-run', title: 'Easy run', performedAt: '2026-09-09T10:00:00.000Z', exercises: [], endurance: { distanceKm: 5, durationSeconds: 1500 }, createdAt: '', updatedAt: '' },
  { id: 'ride-1', type: 'ride', kind: 'long-ride', title: 'Long ride', performedAt: '2026-09-10T10:00:00.000Z', exercises: [], endurance: { distanceKm: 30, durationSeconds: 5400 }, createdAt: '', updatedAt: '' },
]

describe('analytics derived from workout history', () => {
  it('handles an empty history without creating trend points or records', () => { expect(workoutFrequencyTrend([], 'week')).toEqual([]); expect(strengthProgression([])).toEqual([]); expect(personalRecords([])).toEqual([]) })
  it('uses completed strength sets only for volume', () => expect(strengthVolumeTrend(workouts, 'week').map((point) => point.value)).toEqual([1390, 680]))
  it('uses one top set per workout for progression while retaining total workout volume', () => { const progression = strengthProgression(workouts); expect(progression[0].performances).toHaveLength(2); expect(progression[0].performances[0]).toMatchObject({ weightKg: 80, reps: 8, volumeKg: 1390 }); expect(progression[0].workoutKinds).toEqual(['upper', 'pull']); expect(personalRecords(workouts).find((record) => record.label === 'Barbell Bench Press')?.workoutId).toBe('strength-2') })
  it('derives running pace and cycling speed from endurance records', () => { expect(enduranceHistory(workouts, 'run')[0].paceSecondsPerKm).toBe(300); expect(enduranceHistory(workouts, 'ride')[0].averageSpeedKph).toBe(20) })
})
