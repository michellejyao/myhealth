import { useState, useEffect } from 'react'
import { useAuth0 } from '@auth0/auth0-react'
import { BookPageLayout, BookSection } from '../components'
import { analysisService, type AIFlag, type AISummary } from '../../../services/analysisService'

export function AIInsightsPage() {
  const { user } = useAuth0()
  const userId = user?.sub ?? ''
  const [flags, setFlags] = useState<AIFlag[]>([])
  const [summaries, setSummaries] = useState<AISummary[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedFlag, setSelectedFlag] = useState<AIFlag | null>(null)

  useEffect(() => {
    if (!userId) return
    analysisService
      .fetchAIInsights(userId)
      .then(({ flags: f, summaries: s }) => {
        setFlags(f)
        setSummaries(s)
      })
      .finally(() => setLoading(false))
  }, [userId])

  if (selectedFlag) {
    return (
      <BookPageLayout title="Insight detail">
        <div className="space-y-3">
          <h3 className="font-semibold text-black">{selectedFlag.title}</h3>
          <p className="text-sm text-black/80">
            <strong>Confidence:</strong> {selectedFlag.confidence_score}%
          </p>
          <p className="text-sm text-black/80">
            <strong>Severity:</strong> {selectedFlag.severity}
          </p>
          <p className="text-sm text-black/80">
            <strong>Risk score:</strong> {selectedFlag.risk_score}/100
          </p>
          <p className="text-sm text-black mt-2">{selectedFlag.reasoning_summary}</p>
          <button
            type="button"
            onClick={() => setSelectedFlag(null)}
            className="text-sm text-accent underline mt-4"
          >
            ← Back to insights
          </button>
        </div>
      </BookPageLayout>
    )
  }

  return (
    <BookPageLayout title="AI insights">
      {loading ? (
        <p className="text-sm text-black/70">Loading…</p>
      ) : (
        <>
          <BookSection title="Insights &amp; flags">
            {flags.length === 0 ? (
              <p className="text-sm text-black/70">
                No AI insights yet. Save symptom logs to run pattern analysis.
              </p>
            ) : (
              <ul className="space-y-2">
                {flags.map((flag) => (
                  <li key={flag.id}>
                    <button
                      type="button"
                      onClick={() => setSelectedFlag(flag)}
                      className="w-full text-left p-3 rounded border border-black/10 bg-white/80 hover:bg-white transition-colors"
                    >
                      <span className="font-medium text-black">{flag.title}</span>
                      <span className="ml-2 text-xs text-black/70">
                        {flag.confidence_score}% · {flag.severity} · Risk {flag.risk_score}
                      </span>
                      <p className="text-sm text-black/70 mt-1 line-clamp-2">
                        {flag.reasoning_summary}
                      </p>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </BookSection>
          {summaries.length > 0 && (
            <BookSection title="Summaries">
              <ul className="space-y-2">
                {summaries.map((s) => (
                  <li
                    key={s.id}
                    className="p-3 rounded border border-black/10 bg-white/80 text-sm text-black"
                  >
                    {s.summary_text}
                    {(s.date_range_start || s.date_range_end) && (
                      <p className="text-xs text-black/70 mt-1">
                        {s.date_range_start && new Date(s.date_range_start).toLocaleDateString()}
                        {' – '}
                        {s.date_range_end && new Date(s.date_range_end).toLocaleDateString()}
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            </BookSection>
          )}
        </>
      )}
    </BookPageLayout>
  )
}
