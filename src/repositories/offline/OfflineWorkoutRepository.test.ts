import 'fake-indexeddb/auto'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { ApiError } from '../../api/client'
import type { Workout } from '../../domain/workouts/models'
import type { WorkoutRepository } from '../WorkoutRepository'
import { IndexedDBAccountStore } from './AccountStore'
import { OfflineWorkoutRepository } from './OfflineWorkoutRepository'

const cleanups: (() => void)[] = []
beforeEach(() => { vi.stubGlobal('window', new EventTarget()) })
afterEach(() => { cleanups.splice(0).forEach(stop => stop()); vi.unstubAllGlobals() })
const workout = (): Workout => ({
  id: crypto.randomUUID(), type: 'run', kind: 'easy-run', title: 'Run',
  performedAt: '2026-09-21T09:00:00Z', createdAt: '2026-09-21T09:00:00Z', updatedAt: '2026-09-21T09:00:00Z',
  exercises: [], endurance: { distanceKm: 5, durationSeconds: 1800 },
})
function server() {
  const rows = new Map<string, Workout>()
  let failure: Error | null = null
  const check = () => { if (failure) throw failure }
  const remote: WorkoutRepository = {
    async getAll() { check(); return structuredClone([...rows.values()]) },
    async getById(id) { check(); return structuredClone(rows.get(id) ?? null) },
    async create(value) { check(); if (rows.has(value.id)) throw new ApiError(409, 'Duplicate'); rows.set(value.id, structuredClone(value)) },
    async update(value) { check(); if (!rows.has(value.id)) throw new ApiError(404, 'Missing'); rows.set(value.id, structuredClone(value)) },
    async delete(id) { check(); if (!rows.delete(id)) throw new ApiError(404, 'Missing') },
  }
  return { rows, remote, fail: (error: Error | null) => { failure = error } }
}
async function start(repo: OfflineWorkoutRepository) { cleanups.push(repo.start()); await repo.sync() }

it('caches downloads and saves offline, then reloads the durable queue and uploads exactly once', async () => {
  const s = server(), user = crypto.randomUUID(), store = new IndexedDBAccountStore(user)
  const first = workout(); s.rows.set(first.id, first)
  const repo = new OfflineWorkoutRepository(store, s.remote, user)
  await start(repo)
  s.fail(new Error('Cannot reach the server'))
  const second = workout()
  await repo.create(second); await repo.sync()
  expect(await repo.getAll()).toHaveLength(2)
  expect(repo.getStatus()).toMatchObject({ phase: 'offline', pending: 1 })
  const reloaded = new OfflineWorkoutRepository(new IndexedDBAccountStore(user), s.remote, user)
  expect(await reloaded.getAll()).toHaveLength(2)
  s.fail(null); await start(reloaded); await reloaded.sync()
  expect(s.rows.size).toBe(2)
  expect((await store.read()).pending).toHaveLength(0)
})

it('queues offline create, edit and delete in order and does not resurrect deleted workouts', async () => {
  const s = server(), user = crypto.randomUUID(), store = new IndexedDBAccountStore(user)
  s.fail(new Error('Cannot reach the server'))
  const repo = new OfflineWorkoutRepository(store, s.remote, user)
  await start(repo)
  const value = workout()
  await repo.create(value); await repo.update({ ...value, title: 'Changed' }); await repo.delete(value.id)
  await repo.sync()
  expect(await repo.getAll()).toEqual([])
  expect((await store.read()).pending).toHaveLength(3)
  s.fail(null); await repo.sync()
  expect(s.rows.size).toBe(0)
  expect(repo.getStatus()).toMatchObject({ phase: 'synced', pending: 0 })
})

it('recovers a POST committed before its response was lost', async () => {
  const s = server(), user = crypto.randomUUID(), store = new IndexedDBAccountStore(user)
  const create = s.remote.create
  s.remote.create = vi.fn(async value => { await create(value); throw new Error('Cannot reach the server') })
  const repo = new OfflineWorkoutRepository(store, s.remote, user)
  const value = workout(); await repo.create(value); await start(repo)
  expect((await store.read()).pending).toHaveLength(1)
  s.remote.create = create
  await repo.sync()
  expect(s.rows.size).toBe(1)
  expect((await store.read()).pending).toHaveLength(0)
})

it('retains local work after expired authentication and validation errors', async () => {
  const s = server(), user = crypto.randomUUID(), store = new IndexedDBAccountStore(user)
  const repo = new OfflineWorkoutRepository(store, s.remote, user)
  s.fail(new ApiError(401, 'Expired')); await start(repo)
  await repo.create(workout()); await repo.sync()
  expect(repo.getStatus().phase).toBe('auth')
  expect(await repo.getAll()).toHaveLength(1)
  s.fail(new ApiError(400, 'Invalid')); await repo.sync()
  expect(repo.getStatus().phase).toBe('error')
  expect((await store.read()).pending).toHaveLength(1)
})

it('isolates caches and queues by user ID', async () => {
  const one = new IndexedDBAccountStore(crypto.randomUUID()), two = new IndexedDBAccountStore(crypto.randomUUID())
  const repo = new OfflineWorkoutRepository(one, server().remote, 'one')
  await repo.create(workout())
  expect((await one.read()).workouts).toHaveLength(1)
  expect(await two.read()).toEqual({ workouts: [], pending: [] })
})

it('rolls back the local workout and queue together when a write fails', async () => {
  const store = new IndexedDBAccountStore(crypto.randomUUID())
  await expect(store.change(state => { state.workouts.push(workout()); throw new Error('Write failed') })).rejects.toThrow('Write failed')
  expect(await store.read()).toEqual({ workouts: [], pending: [] })
})

it('preserves a local edit made while a stale server download is in flight', async () => {
  const s = server(), user = crypto.randomUUID(), store = new IndexedDBAccountStore(user)
  const value = workout(); s.rows.set(value.id, value)
  const repo = new OfflineWorkoutRepository(store, s.remote, user); await start(repo)
  let release!: (value: Workout[]) => void
  s.remote.getAll = () => new Promise(resolve => { release = resolve })
  const syncing = repo.sync()
  await vi.waitFor(() => expect(release).toBeTypeOf('function'))
  await repo.update({ ...value, title: 'Offline edit' })
  release([value]); await syncing
  expect((await repo.getById(value.id))?.title).toBe('Offline edit')
  expect((await store.read()).pending).toHaveLength(1)
})

it('uses last uploaded edit for updates and keeps a conflicting create queued', async () => {
  const s = server(), user = crypto.randomUUID(), store = new IndexedDBAccountStore(user)
  const value = workout(); s.rows.set(value.id, value)
  const repo = new OfflineWorkoutRepository(store, s.remote, user); await start(repo)
  await repo.update({ ...value, title: 'New title' }); await repo.sync()
  expect(s.rows.get(value.id)?.title).toBe('New title')
  const conflicting = workout()
  await repo.create(conflicting)
  s.rows.set(conflicting.id, { ...conflicting, title: 'Different' })
  await repo.sync()
  expect(repo.getStatus().phase).toBe('error')
  expect((await store.read()).pending.length).toBeGreaterThan(0)
})
