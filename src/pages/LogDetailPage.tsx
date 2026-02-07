import { useParams, Link, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { logService, HealthLog } from '../services/logService'
import { LoadingSpinner } from '../components/LoadingSpinner'
import { PageContainer } from '../components/PageContainer'

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
      <PageContainer>
        <Link to="/logs" className="text-brand hover:text-white font-medium mb-4 inline-block">
          ← Back to Logs
        </Link>
        <div className="bg-red-500/10 border border-red-500/30 text-red-300 px-4 py-3 rounded-lg">
          {error || 'Log not found'}
        </div>
      </PageContainer>
    )
  }

  return (
    <PageContainer>
      <Link to="/logs" className="text-brand hover:text-white font-medium mb-4 inline-block">
        ← Back to Logs
      </Link>

      <div className="glass-card p-6">
        <div className="flex flex-wrap justify-between items-start gap-3 mb-4">
          <div>
            <h1 className="text-2xl font-bold text-white font-display">{log.title}</h1>
            <p className="text-white/70 mt-1">{log.description}</p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              to={`/logs/${log.id}/edit`}
              className="px-3 py-1.5 text-sm text-black bg-brand hover:bg-brand/90 rounded-lg font-medium transition-colors"
            >
              Edit
            </Link>
            <button
              onClick={handleDelete}
              className="px-3 py-1.5 text-sm text-white bg-red-500/90 hover:bg-red-500 rounded-lg font-medium transition-colors"
            >
              Delete
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-white/10">
          <div>
            <p className="text-sm font-semibold text-white/70">Date & Time</p>
            <p className="text-white/90">
              {new Date(log.date).toLocaleDateString()} at{' '}
              {new Date(log.date).toLocaleTimeString()}
            </p>
          </div>

          {log.severity && (
            <div>
              <p className="text-sm font-semibold text-white/70">Severity</p>
              <p className="text-white/90">{log.severity} / 10</p>
            </div>
          )}
        </div>

        {log.body_parts && log.body_parts.length > 0 && (
          <div className="mt-4 pt-4 border-t border-white/10">
            <p className="text-sm font-semibold text-white/70 mb-2">Body Parts / Tags</p>
            <div className="flex flex-wrap gap-2">
              {log.body_parts.map((part) => (
                <span
                  key={part}
                  className="inline-block text-sm bg-brand/20 text-brand px-3 py-1 rounded border border-brand/30"
                >
                  {part}
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="mt-4 pt-4 border-t border-white/10 text-xs text-white/50">
          <p>Created: {new Date(log.created_at || '').toLocaleString()}</p>
          {log.updated_at && <p>Updated: {new Date(log.updated_at).toLocaleString()}</p>}
        </div>
      </div>
    </PageContainer>
  )
}
