import { Outlet, Link, useLocation } from 'react-router-dom'
import { useAuth0 } from '@auth0/auth0-react'
import { useTheme } from '../contexts/ThemeContext'

const nav = [
  { to: '/', label: 'Body' },
  { to: '/logs', label: 'Logs' },
  { to: '/appointments', label: 'Appointments' },
  { to: '/family-history', label: 'Family History' },
  { to: '/health-profile', label: 'Health Profile' },
  { to: '/profile', label: 'Profile' },
  { to: '/analysis-results', label: 'Analysis' },
]

// Sun icon for light mode
function SunIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="5" />
      <line x1="12" y1="1" x2="12" y2="3" />
      <line x1="12" y1="21" x2="12" y2="23" />
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
      <line x1="1" y1="12" x2="3" y2="12" />
      <line x1="21" y1="12" x2="23" y2="12" />
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
    </svg>
  )
}

// Moon icon for dark mode
function MoonIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  )
}

export function Layout() {
  const location = useLocation()
  const { user, logout } = useAuth0()
  const { theme, toggleTheme } = useTheme()

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-black transition-colors duration-300">
      {/* Subtle gradient + grid for depth (dark mode only) */}
      <div className="fixed inset-0 bg-gradient-to-b from-slate-100 via-slate-50 to-slate-100 dark:from-navy/90 dark:via-black dark:to-navy/90 pointer-events-none transition-colors duration-300" aria-hidden />
      <div
        className="fixed inset-0 opacity-[0.02] dark:opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: `linear-gradient(to right, currentColor 1px, transparent 1px), linear-gradient(to bottom, currentColor 1px, transparent 1px)`,
          backgroundSize: '48px 48px',
        }}
        aria-hidden
      />

      {/* Floating glassmorphic nav bar - detached, centered, pill-shaped */}
      <header className="fixed top-6 left-1/2 -translate-x-1/2 z-50 w-full max-w-6xl px-4">
        <nav
          className="flex items-center justify-between rounded-full px-6 py-2.5 overflow-hidden
            bg-white/80 dark:bg-white/[0.08] backdrop-blur-xl
            border border-slate-200 dark:border-white/20
            shadow-lg shadow-slate-200/50 dark:shadow-[0_8px_32px_rgba(0,0,0,0.4),0_0_0_1px_rgba(255,255,255,0.05)_inset]
            hover:shadow-xl dark:hover:shadow-[0_12px_40px_rgba(0,0,0,0.5),0_0_0_1px_rgba(255,255,255,0.08)_inset]
            transition-all duration-300"
        >
          <Link
            to="/"
            className="text-xl font-bold tracking-tight text-slate-900 dark:text-white hover:text-brand transition-colors font-display shrink-0"
          >
            Soma
          </Link>
          <div className="flex gap-1 items-center min-w-0 overflow-x-auto scrollbar-hide">
            {nav.map(({ to, label }) => (
              <Link
                key={to}
                to={to}
                className={
                  'shrink-0 whitespace-nowrap ' +
                  (location.pathname === to
                    ? 'px-3 py-1.5 rounded-full bg-brand/20 dark:bg-white/15 text-brand text-sm font-medium'
                    : 'px-3 py-1.5 rounded-full text-slate-600 dark:text-white/70 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 text-sm font-medium transition-colors')
                }
              >
                {label}
              </Link>
            ))}
          </div>
          
          <div className="flex items-center gap-2 shrink-0 ml-2">
            {/* Theme toggle button */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-full text-slate-600 dark:text-white/70 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 transition-colors"
              aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
            </button>

            {user && (
              <>
                <div className="w-px h-6 bg-slate-200 dark:bg-white/20" />
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-medium text-slate-900 dark:text-white/90">{user.name}</p>
                  <p className="text-xs text-slate-500 dark:text-white/50 truncate max-w-[120px]">{user.email}</p>
                </div>
                <button
                  onClick={() => logout({ logoutParams: { returnTo: window.location.origin } })}
                  className="px-3 py-1.5 text-sm text-white bg-red-500/90 hover:bg-red-500 rounded-full font-medium transition-colors"
                >
                  Logout
                </button>
              </>
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
