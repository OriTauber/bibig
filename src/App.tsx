import { useMemo, useState } from 'react'
import { ApiClient, type Session } from './api/client'
import { ApiWorkoutRepository } from './repositories/ApiWorkoutRepository'
import { IndexedDBWorkoutRepository } from './repositories/IndexedDB/IndexedDBWorkoutRepository'
import type { WorkoutRepository } from './repositories/WorkoutRepository'
import { SignIn } from './features/auth/SignIn'
import { rememberSession, restoreSession } from './api/session'
import { IndexedDBAccountStore } from './repositories/offline/AccountStore'
import { OfflineWorkoutRepository } from './repositories/offline/OfflineWorkoutRepository'
import { SyncStatus } from './features/workouts/SyncStatus'
import { AnalyticsPage } from './features/analytics/AnalyticsPage'
import { CalendarPage } from './features/calendar/CalendarPage'
import { Dashboard } from './features/dashboard/Dashboard'
import { HistoryPage } from './features/history/HistoryPage'
import { NewWorkoutForm } from './features/workouts/NewWorkoutForm'
import { useWorkouts } from './hooks/useWorkouts'
import './styles/app.css'

type Page = 'home' | 'history' | 'calendar' | 'analytics'
export default function App() {
  const [session, setSession] = useState<Session | null>(restoreSession)
  const [local, setLocal] = useState(false)
  const [message, setMessage] = useState('')
  const acceptSession = (value: Session) => { rememberSession(value); setSession(value) }
  const repository = useMemo(() => session
    ? new OfflineWorkoutRepository(new IndexedDBAccountStore(session.user.id), new ApiWorkoutRepository(new ApiClient(session.token)), session.user.id)
    : new IndexedDBWorkoutRepository(), [session])
  if (!session && !local) return <SignIn message={message} onSession={acceptSession} onLocal={() => setLocal(true)} />
  return <WorkoutApp key={session?.token ?? 'local'} repository={repository} account={session?.user.username}
    onExit={() => { rememberSession(null); setSession(null); setLocal(false); setMessage('Any unsynced account workouts remain on this device. Sign back into the same account to resume syncing.') }} />
}

function WorkoutApp({ repository, account, onExit }: { repository: WorkoutRepository; account?: string; onExit: () => void }) {
  const { workouts, loading, error, save, remove, update } = useWorkouts(repository); const [page, setPage] = useState<Page>('home')
  const navigate = (next: Page) => { setPage(next); window.scrollTo({ top: 0, behavior: 'smooth' }) }
  return <main className="app-shell"><header><button className="brand" onClick={() => navigate('home')} aria-label="Go to home">
    <img src="/bibiglogo-enhanced-v2.png" alt="bibig" />
  </button><nav>{(['home', 'history', 'calendar', 'analytics'] as const).map((entry) => <button className={page === entry ? 'active' : ''} key={entry} onClick={() => navigate(entry)}>{entry === 'home' ? 'Today' : entry}</button>)}</nav><button className="text-button" onClick={onExit}>{account ? 'Sign out' : 'Sign in'}</button></header><p role="status">{account ? 'Hi, ' + account : 'Device-only workouts'}</p>{repository instanceof OfflineWorkoutRepository && <SyncStatus repository={repository} onSignIn={onExit} />}{error && <p className="app-error">{error}</p>}{page === 'home' && <Dashboard workouts={workouts} onNavigate={navigate} onSave={save} />}{page === 'history' && <HistoryPage workouts={workouts} onUpdate={update} onDelete={remove} />}{page === 'calendar' && <CalendarPage workouts={workouts} />}{page === 'analytics' && <AnalyticsPage workouts={workouts} />}{loading && <div className="loading">Loading workouts…</div>}<footer>{account ? 'Saved on this device · Syncs to your account when connected' : 'Stored on this device · No account required'}</footer></main>
}
