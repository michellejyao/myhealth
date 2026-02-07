import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useHealthLogs } from '../hooks/useHealthLogs'
import { LoadingSpinner } from '../components/LoadingSpinner'
import { PageContainer } from '../components/PageContainer'

/**
 * PR-05: Log list from Supabase with filters by body region / tag.
 */
export function LogsPage() {
  const { logs, isLoading, deleteLog, error } = useHealthLogs()
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'severity-high' | 'severity-low'>('newest')

  // Filter and sort logs
  const filteredAndSortedLogs = useMemo(() => {
    let result = [...logs]

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim()
      result = result.filter((log) => {
        const title = log.title?.toLowerCase() ?? ''
        const description = log.description?.toLowerCase() ?? ''
        const bodyParts = (log.body_parts ?? []).map((p) => p.toLowerCase()).join(' ')
        const severity = log.severity?.toString() ?? ''
        const dateStr = new Date(log.date).toLocaleDateString().toLowerCase()

        return (
          title.includes(query) ||
          description.includes(query) ||
          bodyParts.includes(query) ||
          severity.includes(query) ||
          dateStr.includes(query)
        )
      })
    }

    // Sort
    if (sortBy === 'newest') {
      result.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    } else if (sortBy === 'oldest') {
      result.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    } else if (sortBy === 'severity-high') {
      result.sort((a, b) => (b.severity ?? 0) - (a.severity ?? 0))
    } else if (sortBy === 'severity-low') {
      result.sort((a, b) => (a.severity ?? 0) - (b.severity ?? 0))
    }

    return result
  }, [logs, searchQuery, sortBy])

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

      {/* Search and Sort Controls */}
      <div className="mb-6 space-y-3">
        <input
          type="text"
          placeholder="Search logs by title, description, body parts, severity, or date..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-slate-800 placeholder-slate-500 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
        />
        <div className="flex gap-3">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
            className="rounded-lg border border-slate-300 px-3 py-2 text-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
          >
            <option value="newest">Sort by: Newest First</option>
            <option value="oldest">Sort by: Oldest First</option>
            <option value="severity-high">Sort by: Severity (High → Low)</option>
            <option value="severity-low">Sort by: Severity (Low → High)</option>
          </select>
          {/* Result count */}
          <div className="flex items-center text-sm text-slate-600">
            {filteredAndSortedLogs.length} of {logs.length} logs
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      {filteredAndSortedLogs.length === 0 ? (
        <div className="text-center py-12">
          {logs.length === 0 ? (
            <>
              <p className="text-slate-600 mb-4">No health logs yet. Create your first log!</p>
              <Link
                to="/logs/new"
                className="inline-block px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium transition-colors"
              >
                Create Log
              </Link>
            </>
          ) : (
            <p className="text-slate-600">No logs match your search criteria.</p>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredAndSortedLogs.map((log) => (
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
                  <div className="mt-2 flex items-center justify-end gap-3">
                    {log.id && (
                      <Link
                        to={`/logs/${log.id}/edit`}
                        className="text-xs text-indigo-600 hover:text-indigo-700"
                      >
                        Edit
                      </Link>
                    )}
                    <button
                      onClick={() => {
                        if (log.id && confirm('Delete this log?')) {
                          deleteLog(log.id)
                        }
                      }}
                      className="text-xs text-red-600 hover:text-red-700"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </PageContainer>
  )
}
