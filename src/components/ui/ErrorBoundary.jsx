import { Component } from 'react'
import { RotateCcw } from 'lucide-react'

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error('Pivot ErrorBoundary caught an error:', error, errorInfo)
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null })
    if (typeof this.props.onRetry === 'function') {
      this.props.onRetry()
    }
  }

  render() {
    if (!this.state.hasError) {
      return this.props.children
    }

    return (
      <div className="min-h-[100dvh] flex flex-col items-center justify-center bg-surface-light dark:bg-surface-dark p-6 text-center">
        <div className="w-20 h-20 mb-6 rounded-3xl bg-gradient-to-br from-pivot-800 to-slate-900 flex items-center justify-center shadow-xl shadow-pivot-900/20">
          <img
            src="/pivot-logo.png"
            alt="Pivot"
            className="w-12 h-12 object-contain"
            onError={(e) => {
              e.target.style.display = 'none'
            }}
          />
        </div>

        <h1 className="text-xl font-bold text-pivot-900 dark:text-white mb-2">
          Something went wrong
        </h1>
        <p className="text-sm text-pivot-500 dark:text-slate-400 max-w-xs mb-6">
          Pivot ran into an unexpected issue. Try reloading the page to get back on track.
        </p>

        <button
          onClick={this.handleRetry}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-accent-blue hover:bg-accent-blue/90 text-white text-sm font-medium transition-colors shadow-lg shadow-accent-blue/20"
        >
          <RotateCcw size={16} />
          Retry
        </button>

        {this.state.error?.message && (
          <p className="mt-6 text-xs text-pivot-400 dark:text-slate-600 font-mono max-w-xs break-words">
            {this.state.error.message}
          </p>
        )}
      </div>
    )
  }
}
