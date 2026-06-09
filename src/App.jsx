import { AuthProvider } from './auth/AuthProvider.jsx'
import AuthGate from './auth/AuthGate.jsx'
import AppShell from './components/AppShell.jsx'

export default function App() {
  return (
    <AuthProvider>
      <AuthGate>
        <AppShell />
      </AuthGate>
    </AuthProvider>
  )
}
