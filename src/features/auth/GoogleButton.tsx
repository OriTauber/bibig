import { useEffect, useRef, useState } from 'react'
import { Capacitor } from '@capacitor/core'
import { FirebaseAuthentication } from '@capacitor-firebase/authentication'

declare global { interface Window { google?: { accounts: { id: { initialize(options: { client_id: string; callback(response: { credential: string }): void }): void; renderButton(element: HTMLElement, options: { theme: string; size: string; width: number; text: string }): void } } } } }

export function GoogleButton({ onCredential, disabled, mode }: { onCredential(credential: string): void; disabled: boolean; mode: 'login' | 'register' }) {
  const holder = useRef<HTMLDivElement>(null); const [ready, setReady] = useState(false); const [nativeError, setNativeError] = useState('')
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID
  const native = Capacitor.isNativePlatform()
  useEffect(() => {
    if (native || !clientId || !holder.current) return
    const start = () => { if (!window.google || !holder.current) return; holder.current.textContent = ''; window.google.accounts.id.initialize({ client_id: clientId, callback: ({ credential }) => onCredential(credential) }); window.google.accounts.id.renderButton(holder.current, { theme: 'outline', size: 'large', width: 320, text: mode === 'login' ? 'signin_with' : 'signup_with' }); setReady(true) }
    const existing = document.querySelector<HTMLScriptElement>('script[data-google-identity]')
    if (existing) { existing.addEventListener('load', start); if (window.google) start(); return () => existing.removeEventListener('load', start) }
    const script = document.createElement('script'); script.src = 'https://accounts.google.com/gsi/client'; script.async = true; script.dataset.googleIdentity = 'true'; script.onload = start; document.head.append(script)
  }, [clientId, native, onCredential, mode])
  async function nativeSignIn() {
    setNativeError('')
    try {
      // Some emulators do not expose a Credential Manager provider. Google Play
      // Services sign-in is still native and works on those Android images.
      const result = await FirebaseAuthentication.signInWithGoogle({ useCredentialManager: false })
      const credential = result.credential?.idToken
      if (!credential) throw new Error('Google did not return an ID token.')
      onCredential(credential)
    } catch (error) {
      setNativeError(error instanceof Error && error.message ? error.message : 'Google sign-in was canceled or could not be completed.')
    }
  }
  if (native) return <><button type="button" className="google-native-button" disabled={disabled} onClick={() => void nativeSignIn()}>Continue with Google</button>{nativeError && <p className="form-error" role="alert">{nativeError}</p>}</>
  if (!clientId) return <p className="google-unavailable">Google sign-in is not configured for this app.</p>
  return <div className={disabled ? 'google-button disabled' : 'google-button'} aria-busy={!ready} ref={holder} />
}
