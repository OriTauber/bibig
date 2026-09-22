import { z } from 'zod'
import { exerciseNameFor } from '../domain/exerciseCatalog.js'
import type { Workout } from '../domain/workouts.js'

const uuid = z.string().uuid()
const strengthKinds = ['push','pull','legs','upper','lower','full-body'] as const
const runKinds = ['long-run','easy-run','tempo-run','intervals','recovery','race'] as const
const rideKinds = ['long-ride','easy-ride','tempo-ride','intervals'] as const
const setSchema = z.object({ id: uuid, reps: z.number().int().positive(), weightKg: z.number().finite().nonnegative(), completed: z.boolean() })
const exerciseSchema = z.object({ id: uuid, exerciseId: z.string().min(1), name: z.string().optional(), sets: z.array(setSchema).min(1) })
const enduranceSchema = z.object({ distanceKm: z.number().finite().positive(), durationSeconds: z.number().int().positive(), elevationGainM: z.number().finite().nonnegative().optional(), averageHeartRate: z.number().int().positive().optional() })
const base = z.object({ id: uuid, type: z.enum(['strength','run','ride']), kind: z.string(), performedAt: z.string().datetime({ offset: true }), title: z.string().trim().min(1).max(200), notes: z.string().max(5000).optional(), exercises: z.array(exerciseSchema), endurance: enduranceSchema.optional(), createdAt: z.string().datetime({ offset: true }), updatedAt: z.string().datetime({ offset: true }) })

export const workoutInputSchema = base.superRefine((value, ctx) => {
  const validKinds = value.type === 'strength' ? strengthKinds : value.type === 'run' ? runKinds : rideKinds
  if (!validKinds.includes(value.kind as never)) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['kind'], message: 'Workout kind is incompatible with workout type.' })
  if (value.type === 'strength' && value.exercises.length === 0) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['exercises'], message: 'Strength workouts require an exercise.' })
  if (value.type !== 'strength' && (!value.endurance || value.exercises.length > 0)) ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Endurance workouts require endurance details and cannot contain strength exercises.' })
  for (const [index, exercise] of value.exercises.entries()) if (!exerciseNameFor(exercise.exerciseId)) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['exercises', index, 'exerciseId'], message: 'Exercise ID is not in the canonical catalog.' })
})

export type WorkoutInput = z.infer<typeof workoutInputSchema>
export function toCanonicalWorkout(input: WorkoutInput): Workout {
  return { ...input, kind: input.kind as Workout['kind'], exercises: input.exercises.map(({ name: _ignored, ...exercise }) => ({ ...exercise, name: exerciseNameFor(exercise.exerciseId)! })), endurance: input.type === 'strength' ? undefined : input.endurance }
}
