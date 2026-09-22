import type { Workout, WorkoutKind, WorkoutType } from './models'

export interface WorkoutFilters { search?: string; type?: WorkoutType | 'all'; kind?: WorkoutKind | 'all'; exercise?: string; startDate?: string; endDate?: string; sort?: 'newest' | 'oldest' }

function compareWorkoutTime(a: Workout, b: Workout): number {
  return new Date(a.performedAt).valueOf() - new Date(b.performedAt).valueOf() || new Date(a.createdAt).valueOf() - new Date(b.createdAt).valueOf()
}

export function filterWorkouts(workouts: Workout[], filters: WorkoutFilters): Workout[] {
  const search = filters.search?.trim().toLowerCase()
  return workouts.filter((workout) => {
    const date = workout.performedAt.slice(0, 10)
    const haystack = [workout.title, workout.notes, workout.kind, ...workout.exercises.map((exercise) => exercise.name)].filter(Boolean).join(' ').toLowerCase()
    return (!search || haystack.includes(search)) && (!filters.type || filters.type === 'all' || workout.type === filters.type) &&
     (!filters.kind || filters.kind === 'all' || workout.kind === filters.kind) &&
      (!filters.exercise || workout.exercises.some((exercise) => exercise.name.toLowerCase().includes(filters.exercise!.toLowerCase()))) &&
       (!filters.startDate || date >= filters.startDate) && (!filters.endDate || date <= filters.endDate)
  }).sort((a, b) => filters.sort === 'oldest' ? compareWorkoutTime(a, b) : compareWorkoutTime(b, a))
}

export function getMostRecentWorkoutForKind(workouts: Workout[], type: WorkoutType, kind: WorkoutKind): Workout | null {
  return workouts.filter((workout) => workout.type === type && workout.kind === kind)
    .sort((a, b) => compareWorkoutTime(b, a))[0] ?? null
}

export function groupWorkoutsByDay(workouts: Workout[]): Map<string, Workout[]> {
  const days = new Map<string, Workout[]>()
  for (const workout of workouts) { const key = workout.performedAt.slice(0, 10); days.set(key, [...(days.get(key) ?? []), workout]) }
  return days
}
