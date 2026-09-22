import type { RideWorkoutKind, RunWorkoutKind, StrengthWorkoutKind, WorkoutKind, WorkoutType } from './models'

export const strengthKinds: { value: StrengthWorkoutKind; label: string }[] = [
  { value: 'push', label: 'Push' }, { value: 'pull', label: 'Pull' }, { value: 'legs', label: 'Legs' },
  { value: 'upper', label: 'Upper' }, { value: 'lower', label: 'Lower' }, { value: 'full-body', label: 'Full body' },
]
export const runKinds: { value: RunWorkoutKind; label: string }[] = [
  { value: 'long-run', label: 'Long run' }, { value: 'easy-run', label: 'Easy run' }, { value: 'tempo-run', label: 'Tempo run' },
  { value: 'intervals', label: 'Intervals' }, { value: 'recovery', label: 'Recovery' }, { value: 'race', label: 'Race' },
]
export const rideKinds: { value: RideWorkoutKind; label: string }[] = [
  { value: 'long-ride', label: 'Long ride' }, { value: 'easy-ride', label: 'Easy ride' }, { value: 'tempo-ride', label: 'Tempo ride' }, { value: 'intervals', label: 'Intervals' },
]
export function kindsFor(type: WorkoutType) { return type === 'strength' ? strengthKinds : type === 'run' ? runKinds : rideKinds }
export function formatWorkoutKind(kind: WorkoutKind): string { return [...strengthKinds, ...runKinds, ...rideKinds].find((entry) => entry.value === kind)?.label ?? kind }
