import { useParams, Link, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { logService, HealthLog } from '../services/logService'
import { LoadingSpinner } from '../components/LoadingSpinner'

/**
 * PR-05: Log detail view. Loads log by id from Supabase and shows all fields.
 */
export function LogDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [log, setLog] = useState<HealthLog | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadLog() {
      if (!id) {
        setError('No log ID provided')
        return
      }

      try {
        setIsLoading(true)
        setError(null)
        const data = await logService.getLogById(id)
        setLog(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load log')
      } finally {
        setIsLoading(false)
      }
    }

    loadLog()
  }, [id])

  const handleDelete = async () => {
    if (!id || !confirm('Are you sure you want to delete this log?')) return

    try {
      await logService.deleteLog(id)
      navigate('/logs')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete log')
    }
  }

  if (isLoading) {
    return <LoadingSpinner />
  }

  if (error || !log) {
    return (
      <div>
        <Link to="/logs" className="text-indigo-600 hover:underline mb-4 inline-block">
          ← Back to logs
        </Link>
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error || 'Log not found'}
        </div>
      </div>
    )
  }

  return (
    <div>
      <Link to="/logs" className="text-indigo-600 hover:underline mb-4 inline-block">
        ← Back to logs
      </Link>

      <div className="bg-white rounded-lg border border-slate-200 p-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">{log.title}</h1>
            <p className="text-slate-600 mt-1">{log.description}</p>
          </div>
          <button
            onClick={handleDelete}
            className="text-red-600 hover:bg-red-50 px-3 py-1 rounded text-sm"
          >
            Delete
          </button>
        </div>

        <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-slate-200">
          <div>
            <p className="text-sm font-semibold text-slate-700">Date & Time</p>
            <p className="text-slate-600">
              {new Date(log.date).toLocaleDateString()} at{' '}
              {new Date(log.date).toLocaleTimeString()}
            </p>
          </div>

          {log.severity && (
            <div>
              <p className="text-sm font-semibold text-slate-700">Severity</p>
              <p className="text-slate-600">{log.severity} / 10</p>
            </div>
          )}
        </div>

        {log.body_parts && log.body_parts.length > 0 && (
          <div className="mt-4 pt-4 border-t border-slate-200">
            <p className="text-sm font-semibold text-slate-700 mb-2">Body Parts / Tags</p>
            <div className="flex flex-wrap gap-2">
              {log.body_parts.map((part) => (
                <span
                  key={part}
                  className="inline-block text-sm bg-indigo-100 text-indigo-700 px-3 py-1 rounded"
                >
                  {part}
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="mt-4 pt-4 border-t border-slate-200 text-xs text-slate-500">
          <p>Created: {new Date(log.created_at || '').toLocaleString()}</p>
          {log.updated_at && <p>Updated: {new Date(log.updated_at).toLocaleString()}</p>}
        </div>
      </div>
    </div>
  )
}
