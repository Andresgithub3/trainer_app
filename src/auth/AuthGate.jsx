import { useState } from 'react'
import { supabase } from '../supabaseClient.js'
import { useAuth } from './authContext.js'

export default function AuthGate({ children }) {
  const { session, loading } = useAuth()
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState('idle') // idle | sending | sent | error
  const [message, setMessage] = useState('')

  if (loading) {
    return <div className="centered muted">Loading…</div>
  }

  if (session) {
    return children
  }

  async function sendLink(e) {
    e.preventDefault()
    setStatus('sending')
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: window.location.origin },
    })
    if (error) {
      setStatus('error')
      setMessage(error.message)
    } else {
      setStatus('sent')
    }
  }

  return (
    <div className="centered">
      <form className="card auth-card" onSubmit={sendLink}>
        <h1 className="auth-title">Benchmark Tracker</h1>
        {status === 'sent' ? (
          <p className="muted">
            Check <strong>{email}</strong> for a magic link, then open it on this device.
          </p>
        ) : (
          <>
            <label className="field-label" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              className="input"
              type="email"
              inputMode="email"
              autoComplete="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <button className="btn btn-primary" type="submit" disabled={status === 'sending'}>
              {status === 'sending' ? 'Sending…' : 'Send magic link'}
            </button>
            {status === 'error' && <p className="error">{message}</p>}
          </>
        )}
      </form>
    </div>
  )
}
