import { describe, expect, it } from 'vitest'
import { normalizeWorkoutExercises } from './migration'
import type { Workout } from '../workouts/models'

const workout: Workout = { id: 'workout', type: 'strength', kind: 'push', performedAt: '2026-09-20T10:00:00.000Z', title: 'Test', exercises: [{ id: 'entry', exerciseId: 'pull-up', name: 'Incorrect', sets: [] }], createdAt: '2026-09-20T10:00:00.000Z', updatedAt: '2026-09-20T10:00:00.000Z' }
describe('normalizeWorkoutExercises', () => { it('makes IndexedDB display names agree with canonical exercise IDs', () => { expect(normalizeWorkoutExercises(workout).exercises[0]).toMatchObject({ exerciseId: 'pull-up', name: 'Pull-Up' }) }) })
