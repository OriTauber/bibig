import { useSyncExternalStore } from 'react'
import { OfflineWorkoutRepository } from '../../repositories/offline/OfflineWorkoutRepository'

export function SyncStatus({ repository, onSignIn }: { repository: OfflineWorkoutRepository; onSignIn: () => void }) {
  const state = useSyncExternalStore(repository.subscribe, repository.getStatus)
  const label = { checking: 'Changes waiting to sync', syncing: 'Syncing…', synced: 'All changes synced', offline: 'Server unavailable · working offline', auth: 'Sign in again to sync · local saving still works', error: 'Sync needs attention' }[state.phase]
  return <section className="sync-status" aria-live="polite">
    <span>{label} · {state.pending} pending change{state.pending === 1 ? '' : 's'}</span>
    {state.phase === 'error' && <p className="app-error">{state.message} Your changes remain saved locally.</p>}
    {state.phase === 'auth' ? <button className="text-button" onClick={onSignIn}>Sign in again</button> : <button className="text-button" disabled={state.phase === 'syncing'} onClick={() => void repository.sync()}>Sync now</button>}
  </section>
}
