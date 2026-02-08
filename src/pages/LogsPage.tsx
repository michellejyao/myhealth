import { useState, useMemo } from 'react'
import { AnalysisResultsModal } from '../components/AnalysisResultsModal'
import { useAuth0 } from '@auth0/auth0-react'
import { Link } from 'react-router-dom'
import { useHealthLogs } from '../hooks/useHealthLogs'
import { LoadingSpinner } from '../components/LoadingSpinner'
import { PageContainer } from '../components/PageContainer'
import { analysisService } from '../services/analysisService'
import { supabase } from '../lib/supabase'

export function LogsPage() {
  const { user, isAuthenticated } = useAuth0()
/**
 * PR-05: Log list from Supabase with filters by body region / tag.
 */
  const { logs, isLoading, deleteLog, error } = useHealthLogs()
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'severity-high' | 'severity-low'>('newest')
  // Modal state
  const [modalOpen, setModalOpen] = useState(false)
  const [analysisResult, setAnalysisResult] = useState<any>(null)
  const [analysisLoading, setAnalysisLoading] = useState(false)
  const [analysisError, setAnalysisError] = useState<string | null>(null)

  // Call pattern-analysis function
  const runAnalysis = async () => {
    setAnalysisLoading(true)
    setAnalysisError(null)
    try {
      if (!isAuthenticated || !user?.sub) {
        throw new Error('You must be logged in to run analysis.')
      }
      const data = await analysisService.analyzeLogs(user.sub)
      setAnalysisResult(data)
      setModalOpen(true)

      // Store result in analysis_results table
      await supabase.from('analysis_results').insert([
        {
          user_id: user.sub,
          risk_score: data.risk_score,
          summary: data.summary,
          flags: data.flags,
          insights: data.insights,
        }
      ])
    } catch (e: any) {
      setAnalysisError(e.message || 'Analysis failed')
    } finally {
      setAnalysisLoading(false)
    }
  }

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
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Health Logs</h1>
        <div className="flex gap-3">
          <Link
            to="/logs/new"
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium transition-colors"
          >
            New Log
          </Link>
          <button
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium transition-colors"
            onClick={runAnalysis}
            disabled={analysisLoading}
          >
            {analysisLoading ? 'Analyzing...' : 'Run Pattern Analysis'}
          </button>
        </div>
      </div>

      {/* Search and Sort Controls */}
      <div className="mb-6 space-y-3">
        <input
          type="text"
          placeholder="Search logs by title, description, body parts, severity, or date..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="glass-input w-full"
        />
        <div className="flex gap-3 flex-wrap">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
            className="glass-input px-3 py-2 min-w-[200px]"
          >
            <option value="newest">Sort by: Newest First</option>
            <option value="oldest">Sort by: Oldest First</option>
            <option value="severity-high">Sort by: Severity (High → Low)</option>
            <option value="severity-low">Sort by: Severity (Low → High)</option>
          </select>
          {/* Result count */}
          <div className="flex items-center text-sm text-slate-500 dark:text-white/60">
            {filteredAndSortedLogs.length} of {logs.length} logs
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-300 rounded-lg">
          {error}
        </div>
      )}
      {analysisError && (
        <div className="mb-4 p-3 bg-red-100 dark:bg-red-500/10 border border-red-400 dark:border-red-500/30 text-red-700 dark:text-red-300 rounded">
          {analysisError}
        </div>
      )}

      {filteredAndSortedLogs.length === 0 ? (
        <div className="text-center py-12">
          {logs.length === 0 ? (
            <>
              <p className="text-slate-600 dark:text-white/70 mb-4">No health logs yet. Create your first log!</p>
              <Link
                to="/logs/new"
                className="inline-block px-4 py-2 bg-accent hover:bg-accent/90 text-white rounded-lg font-medium transition-colors"
              >
                Create Log
              </Link>
            </>
          ) : (
            <p className="text-slate-600 dark:text-white/70">No logs match your search criteria.</p>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredAndSortedLogs.map((log) => (
            <div
              key={log.id}
              className="glass-card p-4 hover:bg-slate-50 dark:hover:bg-white/[0.07] transition-colors"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <Link
                    to={`/logs/${log.id}`}
                    className="text-lg font-semibold text-brand hover:text-slate-900 dark:hover:text-white transition-colors"
                  >
                    {log.title}
                  </Link>
                  {log.description && (
                    <p className="text-slate-600 dark:text-white/70 text-sm mt-1 line-clamp-2">{log.description}</p>
                  )}
                  {log.body_parts && log.body_parts.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {log.body_parts.map((part) => (
                        <span
                          key={part}
                          className="inline-block text-xs bg-brand/20 text-brand px-2 py-1 rounded border border-brand/30"
                        >
                          {part}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="text-right shrink-0">
                  {log.severity && (
                    <div className="mb-2">
                      <p className="text-sm font-medium text-slate-700 dark:text-white/80">
                        Severity: <span className="text-red-500 dark:text-red-400">{log.severity}/10</span>
                      </p>
                    </div>
                  )}
                  <p className="text-xs text-slate-400 dark:text-white/50">
                    {new Date(log.date).toLocaleDateString()} at{' '}
                    {new Date(log.date).toLocaleTimeString()}
                  </p>
                  <div className="mt-2 flex items-center justify-end gap-3">
                    {log.id && (
                      <Link
                        to={`/logs/${log.id}/edit`}
                        className="text-xs text-brand hover:text-slate-900 dark:hover:text-white"
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
                      className="text-xs text-red-500 dark:text-red-400 hover:text-red-600 dark:hover:text-red-300"
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
      <AnalysisResultsModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        result={analysisResult}
      />
    </PageContainer>
  )
}
