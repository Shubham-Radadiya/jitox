import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 bg-[#f8fafc]">
      <Helmet>
        <title>Page not found — Jitox</title>
        <meta
          name="description"
          content="This page does not exist. Sign in to Jitox or return to the dashboard."
        />
        <meta name="robots" content="noindex, follow" />
      </Helmet>
      <main className="text-center max-w-md">
        <p className="text-sm text-teal-700 font-medium mb-2">Error 404</p>
        <h1 className="text-2xl font-bold text-gray-900 mb-3">Page not found</h1>
        <p className="text-gray-600 text-sm mb-6">
          The link may be broken or the page was removed.
        </p>
        <Link
          to="/login"
          className="inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-white hover:opacity-95 min-h-11 min-w-[44px]"
        >
          Go to sign in
        </Link>
      </main>
    </div>
  );
}
