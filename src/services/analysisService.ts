import { supabase } from '../lib/supabase'

export interface AIFlag {
  id: string
  user_id: string
  log_id: string | null
  title: string
  reasoning_summary: string
  severity: 'low' | 'medium' | 'high'
  confidence_score: number
  risk_score: number
  created_at: string
}

export interface AISummary {
  id: string
  user_id: string
  summary_text: string
  date_range_start: string | null
  date_range_end: string | null
  created_at: string
}

export interface AnalysisResult {
  flags: Array<{
    title: string
    reasoning_summary: string
    severity: 'low' | 'medium' | 'high'
    confidence_score: number
  }>
  insights: string[]
  risk_score: number
  summary: string
  anomaly_detected: boolean
  family_history_connections?: string[]
}

export const analysisService = {
  /**
   * Invoke the pattern analysis Edge Function.
   * Triggers when: new log created, log edited, or user requests analysis.
   */
  async analyzeLogs(userId: string, logId?: string): Promise<AnalysisResult> {
    const { data, error } = await supabase.functions.invoke('pattern-analysis', {
      body: { user_id: userId, log_id: logId ?? undefined },
    })

    if (error) {
      throw new Error(`Analysis failed: ${error.message}`)
    }

    if (data?.error) {
      throw new Error(data.error)
    }

    return data as AnalysisResult
  },

  async getFlags(userId: string, limit = 20): Promise<AIFlag[]> {
    const { data, error } = await supabase
      .from('ai_flags')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) throw new Error(`Failed to fetch flags: ${error.message}`)
    return data ?? []
  },

  async getFlagsForLog(logId: string): Promise<AIFlag[]> {
    const { data, error } = await supabase
      .from('ai_flags')
      .select('*')
      .eq('log_id', logId)
      .order('created_at', { ascending: false })

    if (error) throw new Error(`Failed to fetch flags: ${error.message}`)
    return data ?? []
  },

  async getSummaries(userId: string, limit = 10): Promise<AISummary[]> {
    const { data, error } = await supabase
      .from('ai_summaries')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) throw new Error(`Failed to fetch summaries: ${error.message}`)
    return data ?? []
  },

  /** Fetch AI flags and summaries for book insights page. */
  async fetchAIInsights(userId: string): Promise<{ flags: AIFlag[]; summaries: AISummary[] }> {
    const [flags, summaries] = await Promise.all([
      this.getFlags(userId, 20),
      this.getSummaries(userId, 10),
    ])
    return { flags, summaries }
  },
}
