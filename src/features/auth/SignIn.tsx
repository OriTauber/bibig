import { useState, type FormEvent } from 'react'
import { authenticate, authenticateWithGoogle, type Session } from '../../api/client'
import { GoogleButton } from './GoogleButton'

export function SignIn({ onSession, onLocal, message }: { onSession: (session: Session) => void; onLocal: () => void; message: string }) {
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [email, setEmail] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  async function submit(event: FormEvent) {
    event.preventDefault(); setBusy(true); setError('')
    try { onSession(await authenticate(mode, email.trim(), password, username.trim())) }
    catch (error) { setError(error instanceof Error ? error.message : 'Unable to sign in.') }
    finally { setBusy(false) }
  }
  async function google(credential: string) { setBusy(true); setError(''); try { onSession(await authenticateWithGoogle(credential, mode === 'register' ? username.trim() : undefined)) } catch (error) { setError(error instanceof Error ? error.message : 'Google sign-in failed.') } finally { setBusy(false) } }
  return <main className="app-shell"><h1 className="signin-brand"><img src="/bibiglogo-enhanced-v2.png" alt="bibig" /></h1><section className="auth-panel new-workout">
    <h2>{mode === 'login' ? 'Welcome back' : 'Create your account'}</h2>
    <p>{mode === 'login' ? 'Use your email and password, or your existing Google-linked account, or your Likud member card' : 'Choose a username, then create an account with a password or Google.'}</p>
    {message && <p role="status">{message}</p>}
    <form onSubmit={submit}>
      <fieldset disabled={busy}>
        <label>Email<input type="email" autoComplete="username" required value={email} onChange={event => setEmail(event.target.value)} /></label>
        {mode === 'register' && <label>Username<input autoComplete="nickname" required minLength={3} maxLength={32} pattern="[A-Za-z0-9_-]+" value={username} onChange={event => setUsername(event.target.value)} placeholder="e.g. sam_lifts" /></label>}
        <label>Password<input type="password" autoComplete={mode === 'login' ? 'current-password' : 'new-password'} minLength={8} maxLength={72} required value={password} onChange={event => setPassword(event.target.value)} /></label>
        {error && <p className="form-error" role="alert">{error}</p>}
        <button className="primary" disabled={busy}>{busy ? 'Please wait…' : mode === 'login' ? 'Sign in' : 'Create account'}</button>
      </fieldset>
    </form>
    <div className="auth-divider"><span>or</span></div>{mode === 'register' && !username.trim() ? <button type="button" className="google-placeholder" disabled>Continue with Google <span>Choose a username first</span></button> : <GoogleButton mode={mode} disabled={busy} onCredential={credential => void google(credential)} />}
    <p><button className="text-button" disabled={busy} onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError('') }}>{mode === 'login' ? 'Create an account' : 'Already have an account? Sign in'}</button></p>
    <button className="text-button" disabled={busy} onClick={onLocal}>Continue on this device</button>
    <p>לתפארת מדינת ישראל</p>
  </section></main>
}
