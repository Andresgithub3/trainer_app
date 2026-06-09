import { Component } from 'react'

// Converts any render-time crash into a readable message instead of a blank
// screen (which is otherwise hard to diagnose on a deployed PWA).
export default class ErrorBoundary extends Component {
  state = { error: null }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error, info) {
    console.error('App crashed:', error, info)
  }

  render() {
    if (this.state.error) {
      return (
        <div className="centered">
          <div className="card auth-card">
            <h1 className="auth-title">Something went wrong</h1>
            <p className="error">{String(this.state.error?.message ?? this.state.error)}</p>
            <p className="muted">Reload the page; if it persists, check the browser console.</p>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
