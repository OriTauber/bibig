import type { Workout } from '../../domain/workouts/models'

export interface Change {
  key: string
  kind: 'create' | 'update' | 'delete'
  id: string
  workout?: Workout
}
export interface AccountState { workouts: Workout[]; pending: Change[] }
export interface AccountStore {
  read(): Promise<AccountState>
  change(action: (state: AccountState) => void): Promise<AccountState>
}

// One atomic snapshot per account: a saved workout and its upload entry always commit together.
export class IndexedDBAccountStore implements AccountStore {
  constructor(private userId: string) {}
  private open(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('bibig-account-workouts', 1)
      request.onupgradeneeded = () => request.result.createObjectStore('accounts')
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
  }
  private async transact(action?: (state: AccountState) => void): Promise<AccountState> {
    const db = await this.open()
    return new Promise((resolve, reject) => {
      const transaction = db.transaction('accounts', action ? 'readwrite' : 'readonly')
      const store = transaction.objectStore('accounts')
      const request = store.get(this.userId)
      let state: AccountState
      let failure: unknown
      request.onsuccess = () => {
        state = request.result ?? { workouts: [], pending: [] }
        try { if (action) { action(state); store.put(state, this.userId) } }
        catch (error) { failure = error; transaction.abort() }
      }
      transaction.oncomplete = () => { db.close(); resolve(state) }
      transaction.onabort = () => { db.close(); reject(failure ?? transaction.error ?? new Error('Local save failed.')) }
      transaction.onerror = () => { /* onabort reports the failed commit */ }
    })
  }
  read() { return this.transact() }
  change(action: (state: AccountState) => void) { return this.transact(action) }
}
