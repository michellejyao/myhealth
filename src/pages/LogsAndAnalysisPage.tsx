import { useState, useMemo, useEffect } from 'react'
import { useAuth0 } from '@auth0/auth0-react'
import { Link } from 'react-router-dom'
import { createClient } from '@supabase/supabase-js'
import { useHealthLogs } from '../hooks/useHealthLogs'
import { LoadingSpinner } from '../components/LoadingSpinner'
import { PageContainer } from '../components/PageContainer'
import { analysisService } from '../services/analysisService'
import { AnalysisResultsModal } from '../components/AnalysisResultsModal'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY
const supabase = createClient(supabaseUrl, supabaseKey)

function getRiskColor(riskScore: number): string {
  if (riskScore >= 70) return 'bg-red-500'
  if (riskScore >= 40) return 'bg-yellow-500'
  return 'bg-green-500'
}

function getRiskLabel(riskScore: number): string {
  if (riskScore >= 70) return 'High'
  if (riskScore >= 40) return 'Medium'
  return 'Low'
}

export function LogsAndAnalysisPage() {
  const { user, isAuthenticated } = useAuth0()
  const { logs, isLoading: logsLoading, deleteLog, error: logsError } = useHealthLogs()

  // Logs state
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'severity-high' | 'severity-low'>('newest')
  const [selectedLogIds, setSelectedLogIds] = useState<Set<string>>(new Set())

  // Analysis state
  const [results, setResults] = useState<any[]>([])
  const [analysisLoading, setAnalysisLoading] = useState(true)
  const [analysisError, setAnalysisError] = useState<string | null>(null)
  const [selectedAnalysisIds, setSelectedAnalysisIds] = useState<Set<string>>(new Set())
  const [deletingAnalysisIds, setDeletingAnalysisIds] = useState<Set<string>>(new Set())

  // Modal state
  const [modalOpen, setModalOpen] = useState(false)
  const [analysisResult, setAnalysisResult] = useState<any>(null)
  const [runningAnalysis, setRunningAnalysis] = useState(false)
  const [analysisErrorMsg, setAnalysisErrorMsg] = useState<string | null>(null)

  // Fetch analysis results
  const fetchResults = async () => {
    setAnalysisLoading(true)
    setAnalysisError(null)
    try {
      const { data, error } = await supabase
        .from('analysis_results')
        .select('*')
        .order('created_at', { ascending: false })
      if (error) throw new Error(error.message)
      setResults(data || [])
    } catch (e: any) {
      setAnalysisError(e.message || 'Failed to fetch results')
    } finally {
      setAnalysisLoading(false)
    }
  }

  // Load analysis results on mount
  useEffect(() => {
    fetchResults()
  }, [])

  // Run analysis
  const runAnalysis = async () => {
    setRunningAnalysis(true)
    setAnalysisErrorMsg(null)
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

      // Refresh results
      await fetchResults()
    } catch (e: any) {
      setAnalysisErrorMsg(e.message || 'Analysis failed')
    } finally {
      setRunningAnalysis(false)
    }
  }

  // Filter and sort logs
  const filteredAndSortedLogs = useMemo(() => {
    let result = [...logs]

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

  const toggleLogSelection = (logId: string) => {
    const newSet = new Set(selectedLogIds)
    if (newSet.has(logId)) {
      newSet.delete(logId)
    } else {
      newSet.add(logId)
    }
    setSelectedLogIds(newSet)
  }

  const toggleAnalysisSelection = (analysisId: string) => {
    const newSet = new Set(selectedAnalysisIds)
    if (newSet.has(analysisId)) {
      newSet.delete(analysisId)
    } else {
      newSet.add(analysisId)
    }
    setSelectedAnalysisIds(newSet)
  }

  const deleteSelectedLogs = async () => {
    if (selectedLogIds.size === 0) return
    if (!confirm(`Delete ${selectedLogIds.size} log(s)?`)) return

    try {
      for (const logId of selectedLogIds) {
        await deleteLog(logId)
      }
      setSelectedLogIds(new Set())
    } catch (e: any) {
      console.error('Error deleting logs:', e)
    }
  }

  const deleteSelectedAnalysis = async () => {
    if (selectedAnalysisIds.size === 0) return
    if (!confirm(`Delete ${selectedAnalysisIds.size} analysis result(s)?`)) return

    setDeletingAnalysisIds(new Set(selectedAnalysisIds))
    try {
      for (const id of selectedAnalysisIds) {
        await supabase.from('analysis_results').delete().eq('id', id)
      }
      setResults(results.filter(r => !selectedAnalysisIds.has(r.id)))
      setSelectedAnalysisIds(new Set())
    } catch (e: any) {
      setAnalysisError(e.message || 'Failed to delete')
    } finally {
      setDeletingAnalysisIds(new Set())
    }
  }

  if (logsLoading || analysisLoading) {
    return <LoadingSpinner />
  }

  return (
    <PageContainer>
      <div className="flex flex-col lg:flex-row gap-6 min-h-[calc(100vh-8rem)]">
        {/* Logs Section - Left Side */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Health Logs</h2>
            <Link
              to="/logs/new"
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium transition-colors"
            >
              New Log
            </Link>
          </div>

          {/* Search */}
          <div className="mb-6 space-y-3">
            <input
              type="text"
              placeholder="Search logs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="glass-input w-full"
            />
            <div className="flex gap-3 flex-wrap items-center">
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
              <div className="text-sm text-slate-500 dark:text-white/60">
                {filteredAndSortedLogs.length} of {logs.length} logs
              </div>
              {selectedLogIds.size > 0 && (
                <button
                  onClick={deleteSelectedLogs}
                  className="ml-auto px-3 py-1.5 text-sm bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                >
                  Delete {selectedLogIds.size} log(s)
                </button>
              )}
            </div>
          </div>

          {logsError && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-300 rounded-lg">
              {logsError}
            </div>
          )}

          {filteredAndSortedLogs.length === 0 ? (
            <div className="text-center py-12">
              {logs.length === 0 ? (
                <p className="text-slate-600 dark:text-white/70">No health logs yet. Create your first log!</p>
              ) : (
                <p className="text-slate-600 dark:text-white/70">No logs match your search criteria.</p>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {filteredAndSortedLogs
                .filter((log) => log.id)
                .map((log) => (
                  <div
                    key={log.id}
                    className={`glass-card p-3 hover:bg-slate-50 dark:hover:bg-white/[0.07] transition-colors cursor-pointer ${
                      selectedLogIds.has(log.id!) ? 'ring-2 ring-indigo-500' : ''
                    }`}
                    onClick={() => toggleLogSelection(log.id!)}
                  >
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        checked={selectedLogIds.has(log.id!)}
                        onChange={() => toggleLogSelection(log.id!)}
                        className="mt-1 shrink-0"
                        onClick={(e) => e.stopPropagation()}
                      />
                      <div className="min-w-0 flex-1">
                        <Link
                          to={`/logs/${log.id}`}
                          className="text-lg font-semibold text-brand hover:text-slate-900 dark:hover:text-white transition-colors block"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {log.title}
                        </Link>
                        {log.description && (
                          <p className="text-slate-600 dark:text-white/70 text-sm mt-1 line-clamp-2">{log.description}</p>
                        )}
                        {log.body_parts && log.body_parts.length > 0 && (
                          <div className="flex flex-wrap gap-2 mt-2">
                            {log.body_parts.map((part) => (
                              <span key={part} className="inline-block text-xs bg-brand/20 text-brand px-2 py-1 rounded border border-brand/30">
                                {part}
                              </span>
                            ))}
                          </div>
                        )}
                        <div className="mt-2 flex flex-col gap-1">
                          {log.severity && (
                            <p className="text-sm font-medium text-slate-700 dark:text-white/80">
                              Severity: <span className="text-red-500 dark:text-red-400">{log.severity}/10</span>
                            </p>
                          )}
                          <p className="text-xs text-slate-400 dark:text-white/50">
                            {new Date(log.date).toLocaleDateString()} at{' '}
                            {new Date(log.date).toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Link
                          to={`/logs/${log.id}/edit`}
                          className="text-xs text-brand hover:text-slate-900 dark:hover:text-white"
                          onClick={(e) => e.stopPropagation()}
                        >
                          Edit
                        </Link>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            if (confirm('Delete this log?')) {
                              deleteLog(log.id!)
                            }
                          }}
                          className="text-xs text-red-500 dark:text-red-400 hover:text-red-600 dark:hover:text-red-300"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>

        {/* Analysis Results Section - Right Side */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Analysis Results</h2>
            <button
              onClick={runAnalysis}
              disabled={runningAnalysis}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium transition-colors disabled:opacity-50"
            >
              {runningAnalysis ? 'Analyzing...' : 'Run Analysis'}
            </button>
          </div>

          {analysisErrorMsg && (
            <div className="mb-4 p-3 bg-red-100 dark:bg-red-500/10 border border-red-400 dark:border-red-500/30 text-red-700 dark:text-red-300 rounded">
              {analysisErrorMsg}
            </div>
          )}

          {analysisError && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-300 rounded-lg">
              {analysisError}
            </div>
          )}

          {selectedAnalysisIds.size > 0 && (
            <div className="mb-4">
              <button
                onClick={deleteSelectedAnalysis}
                disabled={deletingAnalysisIds.size > 0}
                className="px-3 py-1.5 text-sm bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50 transition-colors"
              >
                Delete {selectedAnalysisIds.size} result(s)
              </button>
            </div>
          )}

          {results.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-slate-600 dark:text-white/70">No analysis results yet. Run an analysis to get started!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {results.map((result) => (
                <div
                  key={result.id}
                  className={`flex items-stretch bg-slate-100 dark:bg-white/5 rounded-lg overflow-hidden hover:bg-slate-200 dark:hover:bg-white/10 transition-colors border border-slate-200 dark:border-white/10 cursor-pointer ${
                    selectedAnalysisIds.has(result.id) ? 'ring-2 ring-indigo-500' : ''
                  }`}
                  onClick={() => toggleAnalysisSelection(result.id)}
                >
                  {/* Risk Score Badge */}
                  <div className={`flex flex-col items-center justify-center px-4 py-4 ${getRiskColor(result.risk_score ?? 0)} text-white min-w-[80px]`}>
                    <span className="text-2xl font-bold">{result.risk_score ?? 0}</span>
                    <span className="text-xs uppercase tracking-wide">{getRiskLabel(result.risk_score ?? 0)}</span>
                  </div>

                  {/* Main Content */}
                  <button
                    className="flex-1 text-left p-4 min-w-0"
                    onClick={(e) => {
                      e.stopPropagation()
                      setAnalysisResult(result)
                      setModalOpen(true)
                    }}
                  >
                    <div className="font-semibold text-lg text-slate-900 dark:text-white mb-1">
                      {new Date(result.created_at).toLocaleString()}
                    </div>
                    <div className="text-slate-700 dark:text-white/70 text-sm line-clamp-3">{result.summary}</div>
                  </button>

                  {/* Checkbox and Delete */}
                  <div className="flex items-center gap-2 px-4 shrink-0">
                    <input
                      type="checkbox"
                      checked={selectedAnalysisIds.has(result.id)}
                      onChange={() => toggleAnalysisSelection(result.id)}
                      className="shrink-0"
                      onClick={(e) => e.stopPropagation()}
                    />
                    <button
                      className="p-2 text-slate-400 hover:text-red-500 dark:text-white/40 dark:hover:text-red-400 transition-colors shrink-0"
                      onClick={async (e) => {
                        e.stopPropagation()
                        if (!confirm('Delete this analysis result?')) return
                        setDeletingAnalysisIds(new Set([result.id]))
                        try {
                          const { error } = await supabase
                            .from('analysis_results')
                            .delete()
                            .eq('id', result.id)
                          if (error) throw new Error(error.message)
                          setResults(results.filter(r => r.id !== result.id))
                        } catch (e: any) {
                          setAnalysisError(e.message || 'Failed to delete')
                        } finally {
                          setDeletingAnalysisIds(new Set())
                        }
                      }}
                      disabled={deletingAnalysisIds.has(result.id)}
                      title="Delete"
                    >
                      {deletingAnalysisIds.has(result.id) ? (
                        <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                      ) : (
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <AnalysisResultsModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        result={analysisResult}
      />
    </PageContainer>
  )
}
