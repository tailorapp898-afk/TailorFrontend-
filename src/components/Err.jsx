import React from "react"

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null, errorInfo: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error("❌ Error caught by ErrorBoundary:", error, errorInfo)
    this.setState({ errorInfo })
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-6 text-center">
          <h2 className="text-xl font-semibold text-red-600">
            Oops! Something went wrong 😢
          </h2>
          <p className="text-gray-500 mt-2">
            Please refresh the page or try again later.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
          >
            Refresh
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
