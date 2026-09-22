import { useCallback, useEffect, useMemo, useState } from 'react'
import type { WorkoutRepository } from '../repositories/WorkoutRepository'
import type { Workout } from '../domain/workouts/models'
import { OfflineWorkoutRepository } from '../repositories/offline/OfflineWorkoutRepository'

export function useWorkouts(repository: WorkoutRepository) {
  const [workouts, setWorkouts] = useState<Workout[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const refresh = useCallback(async () => {
    try { setLoading(true); setWorkouts(await repository.getAll()); setError(null) }
    catch (error) { setError(error instanceof Error ? error.message : 'Your workouts could not be loaded.') }
    finally { setLoading(false) }
  }, [repository])
  useEffect(() => { void refresh() }, [refresh])
  useEffect(() => {
    if (!(repository instanceof OfflineWorkoutRepository)) return
    const unsubscribe = repository.subscribe(() => { void refresh() })
    const stop = repository.start()
    return () => { unsubscribe(); stop() }
  }, [repository, refresh])
  const save = useCallback(async (workout: Workout) => { await repository.create(workout); await refresh() }, [refresh, repository])
  const remove = useCallback(async (id: string) => { await repository.delete(id); await refresh() }, [refresh, repository])
  const update = useCallback(async (workout: Workout) => { await repository.update(workout); await refresh() }, [refresh, repository])
  return useMemo(() => ({ workouts, loading, error, save, remove, update }), [workouts, loading, error, save, remove, update])
}
