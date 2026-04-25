import { Component } from "react";

export class ErrorBoundary extends Component {
  state = { err: null };

  static getDerivedStateFromError(err) {
    return { err };
  }

  componentDidCatch(err, info) {
    console.error("App render error:", err, info);
  }

  render() {
    if (this.state.err) {
      return (
        <div className="min-h-[100dvh] flex flex-col items-center justify-center gap-4 px-6 bg-gray-50 text-center">
          <p className="text-lg font-semibold text-gray-900">
            Something went wrong
          </p>
          <p className="text-sm text-gray-600 max-w-md">
            {String(this.state.err?.message || this.state.err)}
          </p>
          <button
            type="button"
            className="rounded-lg bg-primary text-white px-4 py-2 text-sm font-medium"
            onClick={() => window.location.reload()}
          >
            Reload page
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
