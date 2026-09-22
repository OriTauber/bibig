import { describe, expect, it } from 'vitest'
import { exerciseCatalog, findExercise, searchExercises } from './catalog'
import { normalizeWorkoutExercises } from './migration'
import { validateWorkout } from '../workouts/validation'
import type { Workout } from '../workouts/models'

const baseWorkout: Workout = { id: 'workout', type: 'strength', kind: 'push', title: 'Push', performedAt: '2026-09-20T10:00:00.000Z', createdAt: '', updatedAt: '', exercises: [{ id: 'entry', exerciseId: 'pull-up', name: 'Pull-Up', sets: [{ id: 'set', weightKg: 0, reps: 8, completed: true }] }] }

describe('canonical exercise catalog', () => {
  it('includes each required exercise under one stable ID', () => { expect(exerciseCatalog.length).toBeGreaterThanOrEqual(73); expect(exerciseCatalog.filter((exercise) => exercise.id === 'pull-up')).toHaveLength(1); expect(findExercise('barbell bench')?.id).toBe('barbell-bench-press') })
  it('searches names, categories, and aliases', () => { expect(searchExercises('bench').map((exercise) => exercise.id)).toContain('barbell-bench-press'); expect(searchExercises('calisthenics').map((exercise) => exercise.id)).toContain('muscle-up') })
  it('normalizes known legacy names while preserving unknown exercises safely', () => { const migrated = normalizeWorkoutExercises({ ...baseWorkout, exercises: [{ ...baseWorkout.exercises[0], exerciseId: undefined, name: 'Bench Press' }, { ...baseWorkout.exercises[0], id: 'unknown', exerciseId: undefined, name: 'Made Up Movement' }] }); expect(migrated.exercises[0]).toMatchObject({ exerciseId: 'barbell-bench-press', name: 'Barbell Bench Press' }); expect(migrated.exercises[1]).toMatchObject({ exerciseId: undefined, name: 'Made Up Movement' }) })
  it('allows any catalog exercise in any workout type', () => expect(validateWorkout(baseWorkout).valid).toBe(true))
})
