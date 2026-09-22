import { useMemo, useState } from 'react'
import { exerciseCatalog, searchExercises } from '../../domain/exercises/catalog'

interface Props { value?: string; recentIds: string[]; onChange(exerciseId: string | undefined): void }
export function ExerciseSelector({ value, recentIds, onChange }: Props) {
  const [query, setQuery] = useState(''); const [open, setOpen] = useState(false)
  const selected = exerciseCatalog.find((exercise) => exercise.id === value)
  const results = useMemo(() => query ? searchExercises(query) : [...recentIds.map((id) => exerciseCatalog.find((exercise) => exercise.id === id)).filter((exercise): exercise is (typeof exerciseCatalog)[number] => Boolean(exercise)), ...exerciseCatalog.filter((exercise) => !recentIds.includes(exercise.id))], [query, recentIds])
  return <div className="exercise-selector"><div className="selector-input"><input aria-label="Search exercise catalog" value={open ? query : selected?.name ?? ''} onFocus={() => { setOpen(true); setQuery('') }} onChange={(event) => { setOpen(true); setQuery(event.target.value) }} placeholder="Search exercise catalog" />{value && <button type="button" className="delete" aria-label="Clear exercise" onClick={() => { onChange(undefined); setQuery(''); setOpen(true) }}>×</button>}</div>{open && <div className="selector-menu"><div className="selector-hint">{query ? 'Matching exercises' : recentIds.length ? 'Recent exercises, then full catalog' : 'All exercises'}</div>{results.map((exercise) => <button type="button" key={exercise.id} className="selector-option" onClick={() => { onChange(exercise.id); setOpen(false); setQuery('') }}><strong>{exercise.name}</strong><span>{exercise.category}</span></button>)}{!results.length && <p className="selector-empty">No catalog exercise matches that search.</p>}</div>}</div>
}
