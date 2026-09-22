import { afterEach, expect, it, vi } from 'vitest'
import { rememberSession, restoreSession } from './session'

afterEach(() => vi.unstubAllGlobals())
it('restores the tab session for offline reloads and clears it on sign-out', () => {
  const values = new Map<string, string>()
  vi.stubGlobal('localStorage', {
    setItem: (key: string, value: string) => values.set(key, value),
    getItem: (key: string) => values.get(key) ?? null,
    removeItem: (key: string) => values.delete(key),
  })
  const session = { token: 'expired-or-valid-token', user: { id: 'account-a', username: 'alex', createdAt: '' } }
  rememberSession(session)
  expect(restoreSession()).toEqual(session)
  rememberSession(null)
  expect(restoreSession()).toBeNull()
})
it('handles corrupt or blocked browser storage without crashing', () => {
  vi.stubGlobal('localStorage', { getItem: () => 'invalid-json', setItem: () => { throw new Error('Blocked') } })
  expect(restoreSession()).toBeNull()
  expect(() => rememberSession({ token: 'test', user: { id: 'one', username: 'alex', createdAt: '' } })).not.toThrow()
})
