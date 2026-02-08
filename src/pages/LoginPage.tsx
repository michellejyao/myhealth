import { useAuth0 } from '@auth0/auth0-react'
import { LoadingSpinner } from '../components/LoadingSpinner'

export function LoginPage() {
  const { loginWithRedirect, isLoading } = useAuth0()

  if (isLoading) {
    return <LoadingSpinner />
  }

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-white dark:bg-black">
      {/* Background: soft gradient + subtle grid */}
      <div
        className="absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage: `
            linear-gradient(to right, #94a3b8 1px, transparent 1px),
            linear-gradient(to bottom, #94a3b8 1px, transparent 1px)
          `,
          backgroundSize: '48px 48px',
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-br from-brand/10 via-transparent to-accent/10" />
      <div className="absolute top-1/4 -left-32 w-96 h-96 rounded-full bg-brand/20 blur-3xl" />
      <div className="absolute bottom-1/4 -right-32 w-80 h-80 rounded-full bg-accent/20 blur-3xl" />

      <div className="relative z-10 text-center px-6 max-w-md">
        <h1 className="text-5xl sm:text-6xl font-bold tracking-tight text-slate-900 dark:text-white mb-3">
          Soma
        </h1>
        <p className="text-slate-600 dark:text-white/70 text-lg mb-10 leading-relaxed">
          Your body. Your symptoms. One place to track and understand.
        </p>
        <button
          onClick={() => loginWithRedirect()}
          className="group relative inline-flex items-center justify-center gap-2 bg-accent text-white px-8 py-3.5 rounded-xl font-semibold hover:bg-accent/90 transition-all duration-200 shadow-lg shadow-black/20 hover:shadow-xl hover:-translate-y-0.5"
        >
          Sign in with Auth0
          <svg
            className="w-4 h-4 transition-transform group-hover:translate-x-0.5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>
        </button>
      </div>
    </div>
  )
}
