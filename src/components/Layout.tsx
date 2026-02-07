import { Outlet, Link, useLocation } from 'react-router-dom'
import { useAuth0 } from '@auth0/auth0-react'

const nav = [
  { to: '/', label: 'Body' },
  { to: '/logs', label: 'Logs' },
  { to: '/timeline', label: 'Timeline' },
  { to: '/profile', label: 'Profile' },
  { to: '/analysis-results', label: 'Analysis Results' },
]

export function Layout() {
  const location = useLocation()
  const { user, logout } = useAuth0()

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <header className="bg-white border-b border-slate-200 px-4 py-3 shadow-sm">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <Link to="/" className="text-xl font-bold text-indigo-600 hover:text-indigo-700">
            Soma
          </Link>
          <nav className="flex gap-6 items-center">
            {nav.map(({ to, label }) => (
              <Link
                key={to}
                to={to}
                className={
                  location.pathname === to
                    ? 'text-indigo-600 font-semibold'
                    : 'text-slate-600 hover:text-slate-900 font-medium'
                }
              >
                {label}
              </Link>
            ))}
            {user && (
              <div className="flex items-center gap-3 ml-4 pl-4 border-l border-slate-200">
                <div className="text-right">
                  <p className="text-sm font-medium text-slate-800">{user.name}</p>
                  <p className="text-xs text-slate-500">{user.email}</p>
                </div>
                <button
                  onClick={() => logout({ logoutParams: { returnTo: window.location.origin } })}
                  className="px-3 py-1.5 text-sm text-white bg-red-600 hover:bg-red-700 rounded-lg font-medium"
                >
                  Logout
                </button>
              </div>
            )}
          </nav>
        </div>
      </header>

      <main className="flex-1 w-full">
        <Outlet />
      </main>
    </div>
  )
}
