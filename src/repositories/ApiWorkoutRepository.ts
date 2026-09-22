import { ApiClient, ApiError } from '../api/client'
import type { Workout } from '../domain/workouts/models'
import type { WorkoutRepository } from './WorkoutRepository'

export class ApiWorkoutRepository implements WorkoutRepository {
  constructor(private client: ApiClient) {}
  getAll() { return this.client.request<Workout[]>('/workouts') }
  async getById(id: string): Promise<Workout | null> {
    try { return await this.client.request<Workout>('/workouts/' + encodeURIComponent(id)) }
    catch (error) { if (error instanceof ApiError && error.status === 404) return null; throw error }
  }
  async create(workout: Workout) { await this.client.request('/workouts', 'POST', workout) }
  async update(workout: Workout) { await this.client.request('/workouts/' + encodeURIComponent(workout.id), 'PUT', workout) }
  async delete(id: string) { await this.client.request('/workouts/' + encodeURIComponent(id), 'DELETE') }
}
