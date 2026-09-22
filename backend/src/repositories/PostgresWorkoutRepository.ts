import type { Pool, PoolClient } from 'pg'
import type { Workout, ExerciseEntry, EnduranceDetails } from '../domain/workouts.js'
import type { WorkoutRepository } from './WorkoutRepository.js'

type Queryable = Pick<Pool, 'query'> | PoolClient
const iso = (value: unknown) => new Date(value as string).toISOString()

export class PostgresWorkoutRepository implements WorkoutRepository {
  constructor(private readonly pool: Pool) {}

  private async hydrate(queryable: Queryable, rows: Array<Record<string, unknown>>): Promise<Workout[]> {
    if (!rows.length) return []
    const ids = rows.map((row) => row.id)
    const [exerciseResult, enduranceResult] = await Promise.all([
      queryable.query('SELECT se.id, se.workout_id, se.exercise_id, se.position, ss.id AS set_id, ss.set_number, ss.reps, ss.weight_kg, ss.completed FROM strength_exercises se LEFT JOIN strength_sets ss ON ss.strength_exercise_id = se.id WHERE se.workout_id = ANY($1::uuid[]) ORDER BY se.position, ss.set_number', [ids]),
      queryable.query('SELECT * FROM endurance_details WHERE workout_id = ANY($1::uuid[])', [ids]),
    ])
    const exercises = new Map<string, ExerciseEntry[]>()
    for (const row of exerciseResult.rows) {
      const values = exercises.get(row.workout_id) ?? []
      let exercise = values.find((item) => item.id === row.id)
      if (!exercise) { exercise = { id: row.id, exerciseId: row.exercise_id, name: '', sets: [] }; values.push(exercise); exercises.set(row.workout_id, values) }
      if (row.set_id) exercise.sets.push({ id: row.set_id, reps: row.reps, weightKg: Number(row.weight_kg), completed: row.completed })
    }
    const endurance = new Map<string, EnduranceDetails>(enduranceResult.rows.map((row) => [row.workout_id, { distanceKm: Number(row.distance_meters) / 1000, durationSeconds: row.duration_seconds, ...(row.elevation_gain_m === null ? {} : { elevationGainM: Number(row.elevation_gain_m) }), ...(row.average_heart_rate === null ? {} : { averageHeartRate: row.average_heart_rate }) }]))
    const { exerciseNameFor } = await import('../domain/exerciseCatalog.js')
    return rows.map((row) => ({ id: row.id as string, type: row.type as Workout['type'], kind: row.kind as Workout['kind'], performedAt: iso(row.performed_at), title: row.title as string, ...(row.notes === null ? {} : { notes: row.notes as string }), exercises: (exercises.get(row.id as string) ?? []).map((exercise) => ({ ...exercise, name: exerciseNameFor(exercise.exerciseId)! })), ...(endurance.has(row.id as string) ? { endurance: endurance.get(row.id as string) } : {}), createdAt: iso(row.created_at), updatedAt: iso(row.updated_at) }))
  }
  async getAll(userId: string): Promise<Workout[]> { const result = await this.pool.query('SELECT * FROM workouts WHERE user_id = $1 ORDER BY performed_at DESC', [userId]); return this.hydrate(this.pool, result.rows) }
  async getById(userId: string, id: string): Promise<Workout | null> { const result = await this.pool.query('SELECT * FROM workouts WHERE user_id = $1 AND id = $2', [userId, id]); return (await this.hydrate(this.pool, result.rows))[0] ?? null }
  async create(userId: string, workout: Workout): Promise<void> { const client = await this.pool.connect(); try { await client.query('BEGIN'); await this.write(client, userId, workout, false); await client.query('COMMIT') } catch (error) { await client.query('ROLLBACK'); throw error } finally { client.release() } }
  async update(userId: string, workout: Workout): Promise<boolean> { const client = await this.pool.connect(); try { await client.query('BEGIN'); const changed = await this.write(client, userId, workout, true); await client.query('COMMIT'); return changed } catch (error) { await client.query('ROLLBACK'); throw error } finally { client.release() } }
  async delete(userId: string, id: string): Promise<boolean> { return (await this.pool.query('DELETE FROM workouts WHERE user_id = $1 AND id = $2', [userId, id])).rowCount === 1 }
  private async write(client: PoolClient, userId: string, workout: Workout, replace: boolean): Promise<boolean> {
    const primary = replace
      ? await client.query('UPDATE workouts SET type=$3, kind=$4, performed_at=$5, title=$6, notes=$7, updated_at=$8 WHERE user_id=$1 AND id=$2', [userId, workout.id, workout.type, workout.kind, workout.performedAt, workout.title, workout.notes ?? null, workout.updatedAt])
      : await client.query('INSERT INTO workouts (id,user_id,type,kind,performed_at,title,notes,created_at,updated_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)', [workout.id, userId, workout.type, workout.kind, workout.performedAt, workout.title, workout.notes ?? null, workout.createdAt, workout.updatedAt])
    if (replace && primary.rowCount !== 1) return false
    if (replace) { await client.query('DELETE FROM strength_exercises WHERE workout_id = $1', [workout.id]); await client.query('DELETE FROM endurance_details WHERE workout_id = $1', [workout.id]) }
    for (const [position, exercise] of workout.exercises.entries()) { await client.query('INSERT INTO strength_exercises (id,workout_id,exercise_id,position) VALUES ($1,$2,$3,$4)', [exercise.id, workout.id, exercise.exerciseId, position]); for (const [setNumber, set] of exercise.sets.entries()) await client.query('INSERT INTO strength_sets (id,strength_exercise_id,set_number,reps,weight_kg,completed) VALUES ($1,$2,$3,$4,$5,$6)', [set.id, exercise.id, setNumber, set.reps, set.weightKg, set.completed]) }
    if (workout.endurance) await client.query('INSERT INTO endurance_details (workout_id,distance_meters,duration_seconds,elevation_gain_m,average_heart_rate) VALUES ($1,$2,$3,$4,$5)', [workout.id, workout.endurance.distanceKm * 1000, workout.endurance.durationSeconds, workout.endurance.elevationGainM ?? null, workout.endurance.averageHeartRate ?? null])
    return true
  }
}
