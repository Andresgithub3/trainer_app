import { AuthProvider } from './auth/AuthProvider.jsx'
import AuthGate from './auth/AuthGate.jsx'
import AppShell from './components/AppShell.jsx'
import { missingEnv } from './supabaseClient.js'

export default function App() {
  if (missingEnv.length) {
    return (
      <div className="centered">
        <div className="card auth-card">
          <h1 className="auth-title">Configuration needed</h1>
          <p className="muted">Missing environment variable{missingEnv.length > 1 ? 's' : ''}:</p>
          <ul className="muted env-list">
            {missingEnv.map((v) => (
              <li key={v}>{v}</li>
            ))}
          </ul>
          <p className="muted">
            Set {missingEnv.length > 1 ? 'them' : 'it'} in the Vercel project settings (or local{' '}
            <code>.env</code>) and redeploy.
          </p>
        </div>
      </div>
    )
  }

  return (
    <AuthProvider>
      <AuthGate>
        <AppShell />
      </AuthGate>
    </AuthProvider>
  )
}
