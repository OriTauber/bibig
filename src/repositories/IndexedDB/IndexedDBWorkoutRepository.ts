import type { Workout } from '../../domain/workouts/models'
import { normalizeWorkoutExercises } from '../../domain/exercises/migration'
import type { WorkoutRepository } from '../WorkoutRepository'

// Retain the original storage key so bibig can read existing local workouts.
const DB_NAME = 'stride'
const STORE = 'workouts'

export class IndexedDBWorkoutRepository implements WorkoutRepository {
  private database(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, 1)
      request.onupgradeneeded = () => {
        if (!request.result.objectStoreNames.contains(STORE)) request.result.createObjectStore(STORE, { keyPath: 'id' })
      }
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
  }

  private async transact<T>(mode: IDBTransactionMode, action: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
    const db = await this.database()
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE, mode)
      const request = action(transaction.objectStore(STORE))
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
      transaction.oncomplete = () => db.close()
      transaction.onerror = () => { db.close(); reject(transaction.error) }
    })
  }

  async getAll(): Promise<Workout[]> { const stored = await this.transact('readonly', (store) => store.getAll()); const normalized = stored.map(normalizeWorkoutExercises); await Promise.all(normalized.filter((workout, index) => workout !== stored[index]).map((workout) => this.update(workout))); return normalized.sort((a, b) => new Date(b.performedAt).valueOf() - new Date(a.performedAt).valueOf() || new Date(b.createdAt).valueOf() - new Date(a.createdAt).valueOf()) }
  async getById(id: string): Promise<Workout | null> { const workout = (await this.transact('readonly', (store) => store.get(id))) ?? null; if (!workout) return null; const normalized = normalizeWorkoutExercises(workout); if (normalized !== workout) await this.update(normalized); return normalized }
  async create(workout: Workout): Promise<void> { await this.transact('readwrite', (store) => store.add(workout)) }
  async update(workout: Workout): Promise<void> { await this.transact('readwrite', (store) => store.put(workout)) }
  async delete(id: string): Promise<void> { await this.transact('readwrite', (store) => store.delete(id)) }
}
