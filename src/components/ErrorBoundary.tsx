'use client'

import React from 'react'

interface ErrorBoundaryState {
  hasError: boolean
  error?: Error
}

interface ErrorBoundaryProps {
  children: React.ReactNode
  fallback?: React.ComponentType<{ error?: Error; reset: () => void }>
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      const Fallback = this.props.fallback || DefaultErrorFallback
      return (
        <Fallback
          error={this.state.error}
          reset={() => this.setState({ hasError: false, error: undefined })}
        />
      )
    }

    return this.props.children
  }
}

function DefaultErrorFallback({ error, reset }: { error?: Error; reset: () => void }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-red-900 via-red-800 to-red-700 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-lg p-6 text-center">
          <div className="text-6xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-white mb-4">
            Something went wrong
          </h1>
          <p className="text-white/80 mb-6">
            {error?.message || 'An unexpected error occurred. This might be due to missing configuration.'}
          </p>
          <div className="space-y-3">
            <button
              onClick={reset}
              className="w-full bg-white text-red-800 hover:bg-white/90 font-semibold py-3 px-4 rounded-lg transition-colors"
            >
              Try Again
            </button>
            <button
              onClick={() => window.location.href = '/'}
              className="w-full bg-white/20 text-white hover:bg-white/30 font-semibold py-3 px-4 rounded-lg transition-colors"
            >
              Go to Home
            </button>
          </div>
          <div className="mt-6 text-xs text-white/60">
            <p>If this error persists, please check:</p>
            <ul className="text-left mt-2 space-y-1">
              <li>• Firebase configuration in .env.local</li>
              <li>• Internet connection</li>
              <li>• Browser console for details</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ErrorBoundary
