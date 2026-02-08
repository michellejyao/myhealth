import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import { PageContainer } from '../components/PageContainer'
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

export function AnalysisResultsPage() {
  const [results, setResults] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedResult, setSelectedResult] = useState<any | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)

  async function fetchResults() {
    setLoading(true)
    setError(null)
    try {
      const { data, error } = await supabase
        .from('analysis_results')
        .select('*')
        .order('created_at', { ascending: false })
      if (error) throw new Error(error.message)
      setResults(data || [])
    } catch (e: any) {
      setError(e.message || 'Failed to fetch results')
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete(id: string, e: React.MouseEvent) {
    e.stopPropagation()
    if (!confirm('Delete this analysis result?')) return
    setDeleting(id)
    try {
      const { error } = await supabase
        .from('analysis_results')
        .delete()
        .eq('id', id)
      if (error) throw new Error(error.message)
      setResults(results.filter(r => r.id !== id))
    } catch (e: any) {
      setError(e.message || 'Failed to delete')
    } finally {
      setDeleting(null)
    }
  }

  useEffect(() => {
    fetchResults()
  }, [])

  return (
    <PageContainer>
      <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">Analysis Results History</h1>
      {loading && <div className="text-slate-600 dark:text-white/70">Loading...</div>}
      {error && <div className="mb-4 p-3 bg-red-100 dark:bg-red-500/10 border border-red-400 dark:border-red-500/30 text-red-700 dark:text-red-300 rounded">{error}</div>}
      <div className="space-y-4">
        {results.map((result) => (
          <div
            key={result.id}
            className="flex items-stretch bg-slate-100 dark:bg-white/5 rounded-lg overflow-hidden hover:bg-slate-200 dark:hover:bg-white/10 transition-colors border border-slate-200 dark:border-white/10"
          >
            {/* Risk Score Badge on Left */}
            <div className={`flex flex-col items-center justify-center px-4 py-4 ${getRiskColor(result.risk_score ?? 0)} text-white min-w-[80px]`}>
              <span className="text-2xl font-bold">{result.risk_score ?? 0}</span>
              <span className="text-xs uppercase tracking-wide">{getRiskLabel(result.risk_score ?? 0)}</span>
            </div>
            
            {/* Main Content */}
            <button
              className="flex-1 text-left p-4"
              onClick={() => {
                setSelectedResult(result)
                setModalOpen(true)
              }}
            >
              <div className="font-semibold text-lg text-slate-900 dark:text-white mb-1">
                {new Date(result.created_at).toLocaleString()}
              </div>
              <div className="text-slate-700 dark:text-white/70 text-sm truncate">{result.summary}</div>
            </button>
            
            {/* Delete Button */}
            <button
              className="px-4 flex items-center justify-center text-slate-400 hover:text-red-500 dark:text-white/40 dark:hover:text-red-400 transition-colors"
              onClick={(e) => handleDelete(result.id, e)}
              disabled={deleting === result.id}
              title="Delete"
            >
              {deleting === result.id ? (
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
        ))}
      </div>
      <AnalysisResultsModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        result={selectedResult}
      />
    </PageContainer>
  )
}
