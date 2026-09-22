import { useState } from 'react'
import type { Workout } from '../../domain/workouts/models'
import { WorkoutDetails } from '../workouts/WorkoutDetails'
import { NewWorkoutForm } from '../workouts/NewWorkoutForm'

export function Dashboard({ workouts, onNavigate, onSave }: { workouts: Workout[]; onNavigate(page: 'history' | 'calendar' | 'analytics'): void; onSave(workout: Workout): Promise<void> }) {
  const [logging, setLogging] = useState(false)
  const weekAgo = new Date(); weekAgo.setDate(weekAgo.getDate() - 7)
  const recent = workouts.filter((workout) => new Date(workout.performedAt) >= weekAgo).slice(0, 4)
  return <><section className="hero"><p className="eyebrow">Bibi is watching</p><h1>Train like Bibi.<br /><em>One session at a time.</em></h1><p>Start your winter-arc, with your Bibi pal</p><button className="quick-log-toggle" aria-expanded={logging} onClick={() => setLogging(!logging)}>{logging ? 'Close quick log' : '+ Quick log a workout'}</button></section>{logging && <section className="quick-log-panel"><NewWorkoutForm previousWorkouts={workouts} onSave={async workout => { await onSave(workout); setLogging(false) }} /></section>}<section className="last-week"><div className="section-heading"><div><p className="eyebrow">Recent training</p><h2>Last week</h2></div><button className="text-button" onClick={() => onNavigate('history')}>View full history →</button></div>{recent.length ? <div className="recent-grid">{recent.map((workout) => <WorkoutDetails key={workout.id} workout={workout} compact />)}</div> : <div className="empty"><strong>Your week starts here.</strong><span>Record a workout when you're ready to begin.</span></div>}</section><section className="overview-links"><button onClick={() => onNavigate('calendar')}><span>Calendar</span><strong>See your training days →</strong></button><button onClick={() => onNavigate('analytics')}><span>Progress</span><strong>Explore analytics collected by the government →</strong></button></section></>
}
