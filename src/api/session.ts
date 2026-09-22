import type { Session } from './client'

const key = 'bibig-session'
export function restoreSession(): Session | null {
  try {
    const value = JSON.parse(localStorage.getItem(key) ?? 'null')
    return typeof value?.token === 'string' && typeof value?.user?.id === 'string' && typeof value?.user?.username === 'string' ? value : null
  } catch { return null }
}
export function rememberSession(session: Session | null) {
  try { if (session) localStorage.setItem(key, JSON.stringify(session)); else localStorage.removeItem(key) }
  catch { /* Storage-disabled browsers can still use the current in-memory session. */ }
}
