// Staff sign in with Google (ADR 0017). The portal only keeps the Google ID token for this browser
// tab; the gateway validates it on every call (audience = the portal's OAuth client, hd = the staff
// domain). Checking the domain here only gives a clearer message: the gateway decides.
import { reactive } from 'vue'

const KEY = 'portal.idToken'
export const config = {
  clientId: import.meta.env.VITE_GOOGLE_CLIENT_ID ?? '',
  domain: import.meta.env.VITE_STAFF_DOMAIN ?? '',
}
export const configured = () => !!config.clientId && !config.clientId.startsWith('not-configured')

/** The claims of a JWT, unverified (the gateway verifies). */
export function claims(token) {
  const part = token.split('.')[1] ?? ''
  const json = atob(part.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(part.length / 4) * 4, '='))
  return JSON.parse(decodeURIComponent(escape(json)))
}

/** Why a Google sign-in is not a staff sign-in, or null when it is. */
export function refusal(c, domain = config.domain, now = Date.now()) {
  if (c.hd !== domain) return `Only ${domain} accounts may sign in; ${c.email ?? 'this account'} is not one.`
  if (c.exp * 1000 <= now) return 'The sign-in has expired; sign in again.'
  return null
}

function stored() {
  try {
    return sessionStorage.getItem(KEY)
  } catch {
    return null
  }
}

function load() {
  const token = stored()
  if (!token) return null
  try {
    const c = claims(token)
    return refusal(c) ? null : { token, ...c }
  } catch {
    return null
  }
}

export const session = reactive({ user: load(), message: '' })

export function accept(token) {
  let c
  try {
    c = claims(token)
  } catch {
    session.message = 'Google returned something that is not a sign-in.'
    return false
  }
  const why = refusal(c)
  if (why) {
    session.message = why
    return false
  }
  try {
    sessionStorage.setItem(KEY, token)
  } catch {
    /* private mode: signed in for this page only */
  }
  session.user = { token, ...c }
  session.message = ''
  return true
}

export function signOut(message = '') {
  try {
    sessionStorage.removeItem(KEY)
  } catch {
    /* nothing stored */
  }
  session.user = null
  session.message = message
  window.google?.accounts?.id?.disableAutoSelect()
}

export function token() {
  if (session.user && session.user.exp * 1000 <= Date.now()) signOut('Your sign-in expired after an hour; sign in again.')
  return session.user?.token ?? ''
}

let loading
export function loadGoogle() {
  loading ??= new Promise((resolve, reject) => {
    if (window.google?.accounts?.id) return resolve(window.google)
    const script = document.createElement('script')
    script.src = 'https://accounts.google.com/gsi/client'
    script.async = true
    script.onload = () => resolve(window.google)
    script.onerror = () => reject(new Error('Google sign-in could not be loaded.'))
    document.head.appendChild(script)
  })
  return loading
}

/** Renders Google's button into `element`; `onSignedIn` runs after a staff sign-in. */
export async function renderButton(element, onSignedIn) {
  const google = await loadGoogle()
  google.accounts.id.initialize({
    client_id: config.clientId,
    hd: config.domain,
    ux_mode: 'popup',
    auto_select: true,
    callback: ({ credential }) => accept(credential) && onSignedIn(),
  })
  google.accounts.id.renderButton(element, { theme: 'filled_black', size: 'large', shape: 'pill', text: 'signin_with', width: 280 })
}
