import { calculatePace, calculateSpeedKph, calculateWorkoutVolume, formatDuration, formatElapsedDuration } from '../../domain/workouts/calculations'
import type { Workout } from '../../domain/workouts/models'
import { formatWorkoutKind } from '../../domain/workouts/workoutTypes'

export function WorkoutDetails({ workout, compact = false }: { workout: Workout; compact?: boolean }) {
  const endurance = workout.endurance
  const date = new Intl.DateTimeFormat(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' }).format(new Date(workout.performedAt))
  return <article className={compact ? 'workout-card compact' : 'workout-card'}>
    <div className="workout-card-heading"><span className={`tag ${workout.type}`}>{workout.type === 'strength' ? 'Gym' : workout.type}</span><h3>{workout.title}</h3><p>{formatWorkoutKind(workout.kind)} · {date}</p></div>
    {workout.type === 'strength' ? <>
      <p className="workout-summary">{Math.round(calculateWorkoutVolume(workout)).toLocaleString()} kg volume · {workout.exercises.length} exercise{workout.exercises.length === 1 ? '' : 's'}</p>
      {!compact && <div className="exercise-detail">{workout.exercises.map((exercise) => <p key={exercise.id}><strong>{exercise.name}</strong><span>{exercise.sets.map((set) => `${set.weightKg} kg × ${set.reps}`).join(' · ')}</span></p>)}</div>}
    </> : endurance && <div className="endurance-summary">
      <span><strong>{endurance.distanceKm.toFixed(2)} km</strong>distance</span><span><strong>{formatElapsedDuration(endurance.durationSeconds)}</strong>duration</span><span><strong>{workout.type === 'run' ? `${formatDuration(calculatePace(endurance) ?? 0)} /km` : `${(calculateSpeedKph(endurance) ?? 0).toFixed(1)} km/h`}</strong>{workout.type === 'run' ? 'pace' : 'average speed'}</span>
    </div>}
    {workout.notes && !compact && <p className="notes">{workout.notes}</p>}
  </article>
}
