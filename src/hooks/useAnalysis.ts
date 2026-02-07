import { useState, useCallback } from 'react'
import { useAuth0 } from '@auth0/auth0-react'
import {
  analysisService,
  type AnalysisResult,
  type AIFlag,
  type AISummary,
} from '../services/analysisService'

export function useAnalysis() {
  const { user, isAuthenticated } = useAuth0()
  const [result, setResult] = useState<AnalysisResult | null>(null)
  const [flags, setFlags] = useState<AIFlag[]>([])
  const [summaries, setSummaries] = useState<AISummary[]>([])
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const analyze = useCallback(
    async (logId?: string) => {
      if (!isAuthenticated || !user?.sub) {
        setError('User not authenticated')
        return null
      }

      try {
        setIsAnalyzing(true)
        setError(null)
        const res = await analysisService.analyzeLogs(user.sub, logId)
        setResult(res)
        return res
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Analysis failed'
        setError(msg)
        return null
      } finally {
        setIsAnalyzing(false)
      }
    },
    [isAuthenticated, user?.sub]
  )

  const fetchFlags = useCallback(
    async (logId?: string) => {
      if (!isAuthenticated || !user?.sub) return []

      try {
        const data = logId
          ? await analysisService.getFlagsForLog(logId)
          : await analysisService.getFlags(user.sub)
        setFlags(data)
        return data
      } catch {
        return []
      }
    },
    [isAuthenticated, user?.sub]
  )

  const fetchSummaries = useCallback(async () => {
    if (!isAuthenticated || !user?.sub) return []

    try {
      const data = await analysisService.getSummaries(user.sub)
      setSummaries(data)
      return data
    } catch {
      return []
    }
  }, [isAuthenticated, user?.sub])

  return {
    result,
    flags,
    summaries,
    isAnalyzing,
    error,
    analyze,
    fetchFlags,
    fetchSummaries,
  }
}
