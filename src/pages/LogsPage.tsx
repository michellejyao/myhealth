import { Link } from 'react-router-dom'
import { useHealthLogs } from '../hooks/useHealthLogs'
import { LoadingSpinner } from '../components/LoadingSpinner'
import { PageContainer } from '../components/PageContainer'

/**
 * PR-05: Log list from Supabase with filters by body region / tag.
 */
export function LogsPage() {
  const { logs, isLoading, deleteLog, error } = useHealthLogs()

  if (isLoading) {
    return <LoadingSpinner />
  }

  return (
    <PageContainer>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Health Logs</h1>
        <Link
          to="/logs/new"
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium transition-colors"
        >
          New Log
        </Link>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      {logs.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-slate-600 mb-4">No health logs yet. Create your first log!</p>
          <Link
            to="/logs/new"
            className="inline-block px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium transition-colors"
          >
            Create Log
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {logs.map((log) => (
            <div
              key={log.id}
              className="border border-slate-200 rounded-lg p-4 bg-white hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div>
                  <Link
                    to={`/logs/${log.id}`}
                    className="text-lg font-semibold text-indigo-600 hover:underline"
                  >
                    {log.title}
                  </Link>
                  {log.description && (
                    <p className="text-slate-600 text-sm mt-1">{log.description}</p>
                  )}
                  {log.body_parts && log.body_parts.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {log.body_parts.map((part) => (
                        <span
                          key={part}
                          className="inline-block text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded"
                        >
                          {part}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="text-right">
                  {log.severity && (
                    <div className="mb-2">
                      <p className="text-sm font-medium text-slate-700">
                        Severity: <span className="text-red-600">{log.severity}/10</span>
                      </p>
                    </div>
                  )}
                  <p className="text-xs text-slate-500">
                    {new Date(log.date).toLocaleDateString()} at{' '}
                    {new Date(log.date).toLocaleTimeString()}
                  </p>
                  <button
                    onClick={() => {
                      if (log.id && confirm('Delete this log?')) {
                        deleteLog(log.id)
                      }
                    }}
                    className="text-xs text-red-600 hover:text-red-700 mt-2"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </PageContainer>
  )
}
