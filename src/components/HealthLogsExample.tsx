import { useAuth0 } from '@auth0/auth0-react'
import { useHealthLogs } from '../hooks/useHealthLogs'
import { LoadingSpinner } from './LoadingSpinner'

/**
 * Example component demonstrating Auth0 + Supabase integration
 * This shows how to:
 * 1. Check if user is authenticated
 * 2. Fetch user's health logs from Supabase
 * 3. Create new logs
 * 4. Display list of logs
 */
export function HealthLogsExample() {
  const { loginWithRedirect, logout, isAuthenticated, user } = useAuth0()
  const { logs, isLoading, createLog, error } = useHealthLogs()

  const handleCreateLog = async () => {
    try {
      await createLog({
        title: 'New Health Log',
        description: 'Testing the integration',
        body_parts: ['general'],
        severity: 5,
        date: new Date().toISOString(),
      })
      alert('Log created successfully!')
    } catch (err) {
      alert('Error creating log')
    }
  }

  // Show login if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="text-center py-10">
        <h1 className="text-2xl font-bold mb-4">Welcome to MyHealth</h1>
        <button
          onClick={() => loginWithRedirect()}
          className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
        >
          Sign In with Auth0
        </button>
      </div>
    )
  }

  // Show loading state
  if (isLoading) {
    return <LoadingSpinner />
  }

  // Show main content
  return (
    <div className="p-6">
      <div className="mb-6 flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold mb-2">Your Health Logs</h1>
          <p className="text-gray-600">Logged in as: {user?.email}</p>
        </div>
        <button
          onClick={() => logout({ logoutParams: { returnTo: window.location.origin } })}
          className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
        >
          Logout
        </button>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <button
        onClick={handleCreateLog}
        className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 mb-6"
      >
        + Create New Log
      </button>

      {logs.length === 0 ? (
        <div className="text-center py-10">
          <p className="text-gray-500">No logs yet. Create your first health log!</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {logs.map(log => (
            <div key={log.id} className="border rounded-lg p-4 bg-white shadow">
              <h3 className="font-bold text-lg">{log.title}</h3>
              <p className="text-gray-600 text-sm">{log.description}</p>
              {log.body_parts && log.body_parts.length > 0 && (
                <p className="text-sm mt-2">
                  <span className="font-semibold">Body Parts:</span> {log.body_parts.join(', ')}
                </p>
              )}
              {log.severity && (
                <p className="text-sm">
                  <span className="font-semibold">Severity:</span> {log.severity}/10
                </p>
              )}
              <p className="text-xs text-gray-400 mt-2">
                {new Date(log.date).toLocaleDateString()} {new Date(log.date).toLocaleTimeString()}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
