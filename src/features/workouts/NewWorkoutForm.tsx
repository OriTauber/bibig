import { useState, type FormEvent } from 'react'
import { calculatePace, calculateSpeedKph, formatDuration } from '../../domain/workouts/calculations'
import type { ExerciseEntry, StrengthSet, Workout, WorkoutKind, WorkoutType } from '../../domain/workouts/models'
import { getMostRecentWorkoutForKind } from '../../domain/workouts/queries'
import { exerciseCatalog } from '../../domain/exercises/catalog'
import { ExerciseSelector } from './ExerciseSelector'
import { kindsFor } from '../../domain/workouts/workoutTypes'
import { validateWorkout } from '../../domain/workouts/validation'
import { createId } from '../../domain/createId'

interface Props { onSave(workout: Workout): Promise<void>; previousWorkouts: Workout[]; initialWorkout?: Workout }
type ExerciseDraft = { id?: string; exerciseId?: string; sets: { id?: string; completed?: boolean; weightKg: string; reps: string }[] }
const initialExercise = (): ExerciseDraft => ({ sets: [{ weightKg: '', reps: '' }] })

export function NewWorkoutForm({ onSave, previousWorkouts, initialWorkout }: Props) {
  const initialDate = new Date(initialWorkout?.performedAt ?? Date.now())
  const [type, setType] = useState<WorkoutType>(initialWorkout?.type ?? 'strength')
  const [kind, setKind] = useState<WorkoutKind>(initialWorkout?.kind ?? 'upper')
  const [title, setTitle] = useState(initialWorkout?.title ?? '')
  const [date, setDate] = useState(new Date(initialDate.valueOf() - initialDate.getTimezoneOffset() * 60000).toISOString().slice(0, 10))
  const [time, setTime] = useState(initialDate.toTimeString().slice(0, 5))
  const [notes, setNotes] = useState(initialWorkout?.notes ?? '')
  const [exercises, setExercises] = useState<ExerciseDraft[]>(initialWorkout?.exercises.length ? initialWorkout.exercises.map(e => ({ id: e.id, exerciseId: e.exerciseId, sets: e.sets.map(s => ({ id: s.id, completed: s.completed, weightKg: String(s.weightKg), reps: String(s.reps) })) })) : [initialExercise()])
  const [distanceKm, setDistanceKm] = useState(initialWorkout?.endurance ? String(initialWorkout.endurance.distanceKm) : '')
  const [durationMinutes, setDurationMinutes] = useState(initialWorkout?.endurance ? String(initialWorkout.endurance.durationSeconds / 60) : '')
  const [elevationGainM, setElevationGainM] = useState(initialWorkout?.endurance?.elevationGainM?.toString() ?? '')
  const [averageHeartRate, setAverageHeartRate] = useState(initialWorkout?.endurance?.averageHeartRate?.toString() ?? '')
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const endurance = { distanceKm: Number(distanceKm), durationSeconds: Number(durationMinutes) * 60 }
  const pace = calculatePace(endurance)
  const speed = calculateSpeedKph(endurance)
  const previousWorkout = getMostRecentWorkoutForKind(previousWorkouts, type, kind)
  const recentExerciseIds = [...new Set(previousWorkouts.flatMap((workout) => workout.exercises.map((exercise) => exercise.exerciseId).filter((id): id is string => Boolean(id))))].slice(0, 8)
  const chooseType = (next: WorkoutType) => { setType(next); setKind(kindsFor(next)[0].value) }
  const updateExercise = (index: number, patch: Partial<ExerciseDraft>) => setExercises((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, ...patch } : item))
  const updateSet = (exerciseIndex: number, setIndex: number, patch: Partial<ExerciseDraft['sets'][number]>) => setExercises((current) => current.map((exercise, index) => index !== exerciseIndex ? exercise : { ...exercise, sets: exercise.sets.map((set, index) => index === setIndex ? { ...set, ...patch } : set) }))
  function usePreviousWorkout() {
    if (!previousWorkout) return
    setTitle(previousWorkout.title)
    setNotes(previousWorkout.notes ?? '')
    if (previousWorkout.type === 'strength') setExercises(previousWorkout.exercises.map((exercise) => ({ exerciseId: exercise.exerciseId, sets: exercise.sets.map((set) => ({ weightKg: String(set.weightKg), reps: String(set.reps) })) })))
    else if (previousWorkout.endurance) { setDistanceKm(String(previousWorkout.endurance.distanceKm)); setDurationMinutes(String(previousWorkout.endurance.durationSeconds / 60)); setElevationGainM(previousWorkout.endurance.elevationGainM ? String(previousWorkout.endurance.elevationGainM) : ''); setAverageHeartRate(previousWorkout.endurance.averageHeartRate ? String(previousWorkout.endurance.averageHeartRate) : '') }
  }

  async function submit(event: FormEvent) {
    event.preventDefault()
    const now = new Date().toISOString()
    const workout: Workout = { id: createId(), type, kind, title: title.trim() || kindsFor(type).find((entry) => entry.value === kind)!.label, performedAt: new Date(`${date}T${time}:00`).toISOString(), notes: notes.trim() || undefined, createdAt: now, updatedAt: now, exercises: type === 'strength' ? exercises.map<ExerciseEntry>((exercise) => { const canonical = exerciseCatalog.find((entry) => entry.id === exercise.exerciseId); return { id: exercise.id ?? createId(), exerciseId: canonical?.id, name: canonical?.name ?? '', sets: exercise.sets.map<StrengthSet>((set) => ({ id: set.id ?? createId(), reps: Number(set.reps), weightKg: Number(set.weightKg), completed: set.completed ?? true })) } }) : [], endurance: type === 'strength' ? undefined : { ...endurance, elevationGainM: elevationGainM ? Number(elevationGainM) : undefined, averageHeartRate: averageHeartRate ? Number(averageHeartRate) : undefined } }
    if (initialWorkout) { workout.id = initialWorkout.id; workout.createdAt = initialWorkout.createdAt }
    const result = validateWorkout(workout)
    if (!result.valid) { setError(result.errors[0]); return }
    try { setSaving(true); await onSave(workout); setTitle(''); setNotes(''); setExercises([initialExercise()]); setDistanceKm(''); setDurationMinutes(''); setElevationGainM(''); setAverageHeartRate(''); setError(null) }
    catch (error) { setError(error instanceof Error ? error.message : 'Could not save this workout. Please try again.') } finally { setSaving(false) }
  }

  return <form className="new-workout" onSubmit={submit}>
    <div className="section-heading"><div><p className="eyebrow">{initialWorkout ? 'Edit session' : 'Quick log'}</p><h2>{initialWorkout ? 'Edit workout' : 'Record a workout'}</h2></div></div>
    <div className="type-switch" aria-label="Workout category">{(['strength', 'run', 'ride'] as const).map((option) => <button type="button" className={type === option ? 'active' : ''} onClick={() => chooseType(option)} key={option}>{option === 'strength' ? 'gym' : option}</button>)}</div>
    <div className="form-grid form-grid-wide"><label>Workout type<select value={kind} onChange={(event) => setKind(event.target.value as WorkoutKind)}>{kindsFor(type).map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label><label>Date<input required type="date" value={date} onChange={(event) => setDate(event.target.value)} /></label><label>Time<input required type="time" value={time} onChange={(event) => setTime(event.target.value)} /></label><label>Title <input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Optional" /></label></div>
    {previousWorkout && <button className="previous-workout" type="button" onClick={usePreviousWorkout}>Use your previous {kindsFor(type).find((entry) => entry.value === kind)?.label} workout and edit it →</button>}
    {type === 'strength' ? <section className="exercise-editor"><div className="section-heading"><h3>Exercises</h3><button type="button" className="text-button" onClick={() => setExercises((current) => [...current, initialExercise()])}>+ Add exercise</button></div>{exercises.map((exercise, exerciseIndex) => <div className="exercise-block" key={exerciseIndex}><div className="exercise-title"><ExerciseSelector value={exercise.exerciseId} recentIds={recentExerciseIds} onChange={(exerciseId) => updateExercise(exerciseIndex, { exerciseId })} />{exercises.length > 1 && <button type="button" className="delete" onClick={() => setExercises((current) => current.filter((_, index) => index !== exerciseIndex))}>×</button>}</div>{exercise.sets.map((set, setIndex) => <div className="set-row" key={setIndex}><span>Set {setIndex + 1}</span><input required min="0" step="0.5" type="number" value={set.weightKg} onChange={(event) => updateSet(exerciseIndex, setIndex, { weightKg: event.target.value })} placeholder="kg" /><input required min="1" type="number" value={set.reps} onChange={(event) => updateSet(exerciseIndex, setIndex, { reps: event.target.value })} placeholder="reps" /><button type="button" className="delete" aria-label="Remove set" onClick={() => updateExercise(exerciseIndex, { sets: exercise.sets.filter((_, index) => index !== setIndex) })}>×</button></div>)}<div className="set-actions"><button type="button" className="text-button" onClick={() => updateExercise(exerciseIndex, { sets: [...exercise.sets, { weightKg: '', reps: '' }] })}>+ Add blank set</button>{exercise.sets.length > 0 && <button type="button" className="text-button" onClick={() => { const previous = exercise.sets[exercise.sets.length - 1]!; updateExercise(exerciseIndex, { sets: [...exercise.sets, { ...previous, id: undefined }] }) }}>↻ Duplicate previous set</button>}</div></div>)}</section> : <section><div className="form-grid endurance-grid"><label>Distance (km)<input required min="0.01" step="0.01" type="number" value={distanceKm} onChange={(event) => setDistanceKm(event.target.value)} /></label><label>Duration (minutes)<input required min="1" step="1" type="number" value={durationMinutes} onChange={(event) => setDurationMinutes(event.target.value)} /></label><label>Elevation gain (m)<input min="0" type="number" value={elevationGainM} onChange={(event) => setElevationGainM(event.target.value)} placeholder="Optional" /></label><label>Avg heart rate<input min="1" type="number" value={averageHeartRate} onChange={(event) => setAverageHeartRate(event.target.value)} placeholder="Optional bpm" /></label></div>{distanceKm && durationMinutes && <div className="calculated-detail">{type === 'run' ? `Pace: ${formatDuration(pace ?? 0)} / km` : `Average speed: ${(speed ?? 0).toFixed(1)} km/h`}</div>}</section>}
    <label>Notes<textarea value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="How did it feel? Anything to remember?" /></label>
    {error && <p className="form-error" role="alert">{error}</p>}<button className="primary" disabled={saving}>{saving ? 'Saving…' : 'Save workout'}</button>
  </form>
}
