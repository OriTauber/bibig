import type { Workout } from '../domain/workouts/models'

export interface WorkoutRepository {
  getAll(): Promise<Workout[]>
  getById(id: string): Promise<Workout | null>
  create(workout: Workout): Promise<void>
  update(workout: Workout): Promise<void>
  delete(id: string): Promise<void>
}
