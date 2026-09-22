import { ApiError } from '../../api/client'
import type { Workout } from '../../domain/workouts/models'
import type { WorkoutRepository } from '../WorkoutRepository'
import type { AccountStore, Change } from './AccountStore'
import { createId } from '../../domain/createId'

export interface SyncStatus { phase: 'checking' | 'syncing' | 'synced' | 'offline' | 'auth' | 'error'; pending: number; message?: string }
export class OfflineWorkoutRepository implements WorkoutRepository {
  private listeners = new Set<() => void>()
  private status: SyncStatus = { phase: 'checking', pending: 0 }
  private flight?: Promise<void>
  private stopped = true
  constructor(private store: AccountStore, private remote: WorkoutRepository, private accountId: string) {}
  subscribe = (listener: () => void) => { this.listeners.add(listener); return () => { this.listeners.delete(listener) } }
  getStatus = () => this.status
  private notify(patch: Partial<SyncStatus>) { this.status = { ...this.status, ...patch }; this.listeners.forEach(listener => listener()) }
  async getAll() { return (await this.store.read()).workouts.sort((a, b) => Date.parse(b.performedAt) - Date.parse(a.performedAt)) }
  async getById(id: string) { return (await this.store.read()).workouts.find(workout => workout.id === id) ?? null }
  private async save(kind: Change['kind'], id: string, workout?: Workout) {
    const state = await this.store.change(state => {
      const existing = state.workouts.some(item => item.id === id)
      if (kind === 'create' && existing) throw new Error('This workout already exists.')
      if (kind === 'update' && !existing) throw new Error('Workout not found.')
      state.workouts = state.workouts.filter(item => item.id !== id)
      if (workout) state.workouts.push(workout)
      state.pending.push({ key: createId(), kind, id, workout })
    })
    this.notify({ pending: state.pending.length })
    if (!this.stopped) void this.sync()
  }
  create(workout: Workout) { return this.save('create', workout.id, workout) }
  update(workout: Workout) { return this.save('update', workout.id, workout) }
  delete(id: string) { return this.save('delete', id) }

  start() {
    this.stopped = false
    const retry = () => { void this.sync() }
    const timer = setInterval(retry, 15000)
    window.addEventListener('online', retry)
    window.addEventListener('focus', retry)
    retry()
    return () => { this.stopped = true; clearInterval(timer); window.removeEventListener('online', retry); window.removeEventListener('focus', retry) }
  }
  sync(): Promise<void> {
    if (this.flight) return this.flight
    const run = () => this.reconcile()
    // Coordinate uploads across tabs, while local IndexedDB writes can continue immediately.
    this.flight = (async () => {
      if (typeof navigator !== 'undefined' && navigator.locks) await navigator.locks.request('bibig-sync-' + this.accountId, run)
      else await run()
    })().finally(() => { this.flight = undefined })
    return this.flight
  }
  private async reconcile() {
    try {
      let state = await this.store.read()
      this.notify({ phase: 'syncing', pending: state.pending.length, message: undefined })
      // A finite snapshot prevents continuous typing from starving the next download.
      for (const change of state.pending) {
        if (this.stopped) return
        await this.upload(change)
        state = await this.store.change(current => { current.pending = current.pending.filter(item => item.key !== change.key) })
        this.notify({ pending: state.pending.length })
      }
      if (this.stopped) return
      const downloaded = await this.remote.getAll()
      state = await this.store.change(current => {
        // Never let a download overwrite edits made while requests were in flight.
        const dirty = new Set(current.pending.map(item => item.id))
        current.workouts = [...downloaded.filter(item => !dirty.has(item.id)), ...current.workouts.filter(item => dirty.has(item.id))]
      })
      this.notify({ phase: state.pending.length ? 'checking' : 'synced', pending: state.pending.length })
    } catch (error) {
      const phase = error instanceof ApiError
        ? error.status === 401 ? 'auth' : error.status >= 500 ? 'offline' : 'error'
        : error instanceof TypeError || (error instanceof Error && error.message.startsWith('Cannot reach')) ? 'offline' : 'error'
      this.notify({ phase, message: error instanceof Error ? error.message : 'Sync failed. Your pending changes are kept on this device.' })
    }
  }
  private async upload(change: Change) {
    if (change.kind === 'delete') {
      try { await this.remote.delete(change.id) }
      catch (error) { if (!(error instanceof ApiError && error.status === 404)) throw error }
      return
    }
    if (change.kind === 'update') { await this.remote.update(change.workout!); return }
    try { await this.remote.create(change.workout!) }
    catch (error) {
      if (!(error instanceof ApiError && error.status === 409)) throw error
      // A lost POST response may have committed. Confirm the owned record before acknowledging.
      const existing = await this.remote.getById(change.id)
      if (!existing || !sameWorkout(existing, change.workout!)) throw new ApiError(409, 'A different version of this workout already exists. Pending changes are retained; contact support before retrying.')
    }
  }
}

function sameWorkout(a: Workout, b: Workout): boolean {
  const canonical = (w: Workout) => JSON.stringify([
    w.id, w.type, w.kind, Date.parse(w.performedAt), w.title.trim(), w.notes ?? '',
    w.exercises.map(e => [e.id, e.exerciseId, e.sets.map(s => [s.id, s.reps, s.weightKg, s.completed])]),
    w.endurance ? [w.endurance.distanceKm, w.endurance.durationSeconds, w.endurance.elevationGainM ?? null, w.endurance.averageHeartRate ?? null] : null,
  ])
  return canonical(a) === canonical(b)
}
