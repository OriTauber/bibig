import { Capacitor } from '@capacitor/core'

export class ApiError extends Error {
  constructor(public status: number, message: string) { super(message) }
}
const defaultApiBaseUrl = Capacitor.isNativePlatform() ? 'http://10.0.2.2:3001/api' : '/api'
const apiBaseUrl = (import.meta.env.VITE_API_URL || defaultApiBaseUrl).replace(/\/$/, '')

export class ApiClient {
  constructor(private token?: string, private onUnauthorized?: () => void) {}
  async request<T>(path: string, method = 'GET', body?: unknown): Promise<T> {
    let response: Response
    const controller = new AbortController()
    const timeout = globalThis.setTimeout(() => controller.abort(), 8000)
    try {
      response = await fetch(apiBaseUrl + path, {
        signal: controller.signal,
        method,
        headers: { ...(body === undefined ? {} : { 'Content-Type': 'application/json' }), ...(this.token ? { Authorization: 'Bearer ' + this.token } : {}) },
        ...(body === undefined ? {} : { body: JSON.stringify(body) }),
      })
    } catch { throw new Error('Cannot reach the server. Check your connection and try again.') }
    finally { globalThis.clearTimeout(timeout) }
    if (!response.ok) {
      if (response.status === 401 && this.token) this.onUnauthorized?.()
      const payload = await response.json().catch(() => null)
      throw new ApiError(response.status, payload?.error?.message ?? 'The server could not complete the request. Please try again.')
    }
    if (response.status === 204) return undefined as T
    return response.json()
  }
}

export interface Session { token: string; user: { id: string; username: string; createdAt: string } }
export function authenticate(mode: 'login' | 'register', email: string, password: string, username?: string) {
  return new ApiClient().request<Session>('/auth/' + mode, 'POST', { email, password, ...(mode === 'register' ? { username } : {}) })
}
export function authenticateWithGoogle(credential: string, username?: string) { return new ApiClient().request<Session>('/auth/google', 'POST', { credential, ...(username ? { username } : {}) }) }
