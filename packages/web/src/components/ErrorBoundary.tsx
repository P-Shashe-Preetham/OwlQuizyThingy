import { Component, type ErrorInfo, type PropsWithChildren } from "react"

type ErrorBoundaryState = {
  hasError: boolean
  error: Error | null
}

class ErrorBoundary extends Component<PropsWithChildren, ErrorBoundaryState> {
  constructor(props: PropsWithChildren) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo)
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null })
    window.location.href = "/"
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-dvh flex-col items-center justify-center bg-gradient-to-br from-gray-900 to-gray-800 p-6 text-center">
          <div className="mb-6 text-6xl">😵</div>
          <h1 className="mb-3 text-3xl font-bold text-white">
            Something went wrong
          </h1>
          <p className="mb-6 max-w-md text-lg text-gray-400">
            An unexpected error occurred. Please try refreshing the page or
            going back to the home screen.
          </p>
          {this.state.error && (
            <pre className="mb-6 max-w-lg overflow-auto rounded-lg bg-black/40 p-4 text-left text-sm text-red-400">
              {this.state.error.message}
            </pre>
          )}
          <button
            onClick={this.handleReset}
            className="rounded-lg bg-orange-500 px-8 py-3 text-lg font-bold text-white shadow-lg transition-transform hover:scale-105 active:scale-95"
          >
            Go Home
          </button>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary
