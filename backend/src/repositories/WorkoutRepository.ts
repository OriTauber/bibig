import type { Workout } from '../domain/workouts.js'
export interface WorkoutRepository { getAll(userId: string): Promise<Workout[]>; getById(userId: string, id: string): Promise<Workout | null>; create(userId: string, workout: Workout): Promise<void>; update(userId: string, workout: Workout): Promise<boolean>; delete(userId: string, id: string): Promise<boolean> }
