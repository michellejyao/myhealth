import { Outlet, Link, useLocation } from 'react-router-dom'
import { useAuth0 } from '@auth0/auth0-react'

const nav = [
  { to: '/', label: 'Body' },
  { to: '/logs', label: 'Logs' },
  { to: '/timeline', label: 'Timeline' },
  { to: '/profile', label: 'Profile' },
]

export function Layout() {
  const location = useLocation()
  const { user, logout } = useAuth0()

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <header className="bg-white border-b border-slate-200 px-4 py-3">
        <div className="flex items-center justify-between max-w-6xl mx-auto">
          <Link to="/" className="font-semibold text-slate-800">
            MyHealth
          </Link>
          <nav className="flex gap-4 items-center">
            {nav.map(({ to, label }) => (
              <Link
                key={to}
                to={to}
                className={
                  location.pathname === to
                    ? 'text-indigo-600 font-medium'
                    : 'text-slate-600 hover:text-slate-900'
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
                  className="px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded"
                >
                  Logout
                </button>
              </div>
            )}
          </nav>
        </div>
      </header>
      <main className="flex-1 max-w-6xl w-full mx-auto p-4">
        <Outlet />
      </main>
    </div>
  )
}
