import { afterEach, expect, it, vi } from 'vitest'
import { ApiClient, authenticate } from '../api/client'
import { ApiWorkoutRepository } from './ApiWorkoutRepository'
import type { Workout } from '../domain/workouts/models'

afterEach(() => vi.unstubAllGlobals())
it('routes CRUD through authenticated API requests', async () => {
  const fetcher = vi.fn().mockImplementation(async (_path: string, init: RequestInit) => init.method === 'DELETE' ? new Response(null, { status: 204 }) : new Response('[]', { status: 200 }))
  vi.stubGlobal('fetch', fetcher)
  const repository = new ApiWorkoutRepository(new ApiClient('token'))
  const workout = { id: 'workout-id' } as Workout
  await repository.getAll()
  await repository.create(workout)
  await repository.update(workout)
  await repository.delete(workout.id)
  expect(fetcher.mock.calls.map(([path, init]) => [path, init.method])).toEqual([
    ['/api/workouts', 'GET'], ['/api/workouts', 'POST'], ['/api/workouts/workout-id', 'PUT'], ['/api/workouts/workout-id', 'DELETE'],
  ])
  expect(fetcher.mock.calls[1][1]).toMatchObject({ headers: { Authorization: 'Bearer token' }, body: JSON.stringify(workout) })
})
it('returns null only for missing workouts and expires unauthorized sessions', async () => {
  const expired = vi.fn()
  vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce(new Response('{}', { status: 404 })).mockResolvedValueOnce(new Response('{}', { status: 401 })))
  const repository = new ApiWorkoutRepository(new ApiClient('token', expired))
  expect(await repository.getById('missing')).toBeNull()
  await expect(repository.getAll()).rejects.toThrow()
  expect(expired).toHaveBeenCalledOnce()
})
it('does not hide server validation errors or network failures', async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce(new Response(JSON.stringify({ error: { message: 'Invalid workout' } }), { status: 400 })).mockRejectedValueOnce(new Error('Network')))
  const client = new ApiClient('token')
  await expect(client.request('/workouts')).rejects.toThrow('Invalid workout')
  await expect(client.request('/workouts')).rejects.toThrow('Cannot reach the server')
})
it('registers without sending an existing account token', async () => {
  const fetcher = vi.fn().mockResolvedValue(new Response('{"token":"new-token"}'))
  vi.stubGlobal('fetch', fetcher)
  expect(await authenticate('register', 'user@example.com', 'password')).toEqual({ token: 'new-token' })
  expect(fetcher.mock.calls[0][0]).toBe('/api/auth/register')
  expect(fetcher.mock.calls[0][1].headers.Authorization).toBeUndefined()
})
