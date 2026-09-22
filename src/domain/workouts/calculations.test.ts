import { describe, expect, it } from 'vitest'
import { calculateEstimatedOneRepMax, calculatePace, calculateWorkoutVolume } from './calculations'
import type { Workout } from './models'

const workout: Workout = { id: '1', type: 'strength', kind: 'upper', title: 'Upper', performedAt: '2026-09-20T10:00:00.000Z', exercises: [{ id: 'e1', name: 'Bench press', sets: [{ id: 's1', reps: 8, weightKg: 80, completed: true }, { id: 's2', reps: 10, weightKg: 60, completed: false }] }], createdAt: '', updatedAt: '' }

describe('workout calculations', () => {
  it('uses only completed strength sets for volume', () => expect(calculateWorkoutVolume(workout)).toBe(640))
  it('calculates Brzycki estimated 1RM', () => expect(calculateEstimatedOneRepMax(80, 8)).toBeCloseTo(99.31, 2))
  it('calculates seconds per kilometer', () => expect(calculatePace({ distanceKm: 5, durationSeconds: 1500 })).toBe(300))
})
