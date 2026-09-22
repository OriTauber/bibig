import { useEffect, useRef, useState } from 'react'
import { Capacitor } from '@capacitor/core'
import { FirebaseAuthentication } from '@capacitor-firebase/authentication'

declare global { interface Window { google?: { accounts: { id: { initialize(options: { client_id: string; callback(response: { credential: string }): void }): void; renderButton(element: HTMLElement, options: { theme: string; size: string; width: number; text: string }): void } } } } }

let googleIdentityScript: Promise<void> | undefined
function loadGoogleIdentity(): Promise<void> {
  if (window.google) return Promise.resolve()
  if (!googleIdentityScript) googleIdentityScript = new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>('script[data-google-identity]')
    if (existing) { existing.addEventListener('load', () => resolve(), { once: true }); existing.addEventListener('error', () => reject(new Error('Unable to load Google sign-in.')), { once: true }); return }
    const script = document.createElement('script'); script.src = 'https://accounts.google.com/gsi/client'; script.async = true; script.dataset.googleIdentity = 'true'; script.onload = () => resolve(); script.onerror = () => reject(new Error('Unable to load Google sign-in.')); document.head.append(script)
  })
  return googleIdentityScript
}

export function GoogleButton({ onCredential, disabled, mode }: { onCredential(credential: string): void; disabled: boolean; mode: 'login' | 'register' }) {
  const holder = useRef<HTMLDivElement>(null); const [ready, setReady] = useState(false); const [nativeError, setNativeError] = useState('')
  const onCredentialRef = useRef(onCredential)
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID
  const native = Capacitor.isNativePlatform()
  useEffect(() => { onCredentialRef.current = onCredential }, [onCredential])
  useEffect(() => {
    if (native || !clientId || !holder.current) return
    let cancelled = false
    void loadGoogleIdentity().then(() => { if (cancelled || !window.google || !holder.current) return; holder.current.textContent = ''; window.google.accounts.id.initialize({ client_id: clientId, callback: ({ credential }) => onCredentialRef.current(credential) }); window.google.accounts.id.renderButton(holder.current, { theme: 'outline', size: 'large', width: 320, text: mode === 'login' ? 'signin_with' : 'signup_with' }); setReady(true) })
    return () => { cancelled = true }
  }, [clientId, native, mode])
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
