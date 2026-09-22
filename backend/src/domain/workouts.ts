export type WorkoutType = 'strength' | 'run' | 'ride'
export type WorkoutKind = 'push' | 'pull' | 'legs' | 'upper' | 'lower' | 'full-body' | 'long-run' | 'easy-run' | 'tempo-run' | 'intervals' | 'recovery' | 'race' | 'long-ride' | 'easy-ride' | 'tempo-ride'

export interface StrengthSet { id: string; reps: number; weightKg: number; completed: boolean }
export interface ExerciseEntry { id: string; exerciseId: string; name: string; sets: StrengthSet[] }
export interface EnduranceDetails { distanceKm: number; durationSeconds: number; elevationGainM?: number; averageHeartRate?: number }
export interface Workout { id: string; type: WorkoutType; kind: WorkoutKind; performedAt: string; title: string; notes?: string; exercises: ExerciseEntry[]; endurance?: EnduranceDetails; createdAt: string; updatedAt: string }
