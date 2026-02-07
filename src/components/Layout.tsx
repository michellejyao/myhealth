import { Outlet, Link, useLocation } from 'react-router-dom'
import { useAuth0 } from '@auth0/auth0-react'

const nav = [
  { to: '/', label: 'Body' },
  { to: '/logs', label: 'Logs' },
  { to: '/appointments', label: 'Appointments' },
  { to: '/family-history', label: 'Family History' },
  { to: '/profile', label: 'Profile' },
  { to: '/analysis-results', label: 'Analysis Results' },
]

export function Layout() {
  const location = useLocation()
  const { user, logout } = useAuth0()

  return (
    <div className="min-h-screen flex flex-col bg-black">
      {/* Subtle gradient + grid for depth */}
      <div className="fixed inset-0 bg-gradient-to-b from-navy/90 via-black to-navy/90 pointer-events-none" aria-hidden />
      <div
        className="fixed inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: `linear-gradient(to right, #FFFFFF 1px, transparent 1px), linear-gradient(to bottom, #FFFFFF 1px, transparent 1px)`,
          backgroundSize: '48px 48px',
        }}
        aria-hidden
      />

      {/* Floating glassmorphic nav bar - detached, centered, pill-shaped */}
      <header className="fixed top-6 left-1/2 -translate-x-1/2 z-50 w-full max-w-6xl px-4">
        <nav
          className="flex items-center justify-between rounded-full px-6 py-2.5
            bg-white/[0.08] backdrop-blur-xl
            border border-white/20
            shadow-[0_8px_32px_rgba(0,0,0,0.4),0_0_0_1px_rgba(255,255,255,0.05)_inset]
            hover:shadow-[0_12px_40px_rgba(0,0,0,0.5),0_0_0_1px_rgba(255,255,255,0.08)_inset]
            transition-shadow duration-300"
        >
          <Link
            to="/"
            className="text-xl font-bold tracking-tight text-white hover:text-brand transition-colors font-display shrink-0"
          >
            Soma
          </Link>
          <div className="flex gap-2 items-center min-w-0">
            {nav.map(({ to, label }) => (
              <Link
                key={to}
                to={to}
                className={
                  'shrink-0 whitespace-nowrap ' +
                  (location.pathname === to
                    ? 'px-4 py-2 rounded-full bg-white/15 text-brand font-medium'
                    : 'px-4 py-2 rounded-full text-white/70 hover:text-white hover:bg-white/10 font-medium transition-colors')
                }
              >
                {label}
              </Link>
            ))}
            {user && (
              <div className="flex items-center gap-3 ml-2 pl-4 border-l border-white/20">
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-medium text-white/90">{user.name}</p>
                  <p className="text-xs text-white/50 truncate max-w-[140px]">{user.email}</p>
                </div>
                <button
                  onClick={() => logout({ logoutParams: { returnTo: window.location.origin } })}
                  className="px-3 py-1.5 text-sm text-white bg-red-500/90 hover:bg-red-500 rounded-full font-medium backdrop-blur transition-colors"
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        </nav>
      </header>

      <main className="relative flex-1 w-full pt-24">
        <Outlet />
      </main>
    </div>
  )
}
