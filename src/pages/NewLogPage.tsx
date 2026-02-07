import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { BODY_REGIONS, BODY_REGION_LABELS, PAIN_TYPES, type BodyRegionId, type PainType } from '../types'
import { useHealthLogs } from '../hooks/useHealthLogs'
import { attachmentService } from '../services/attachmentService'
import { PageContainer } from '../components/PageContainer'

/**
 * PR-01/PR-03: New Log form. Region comes from body click or manual choice.
 * Now persists to Supabase via Auth0 + Supabase integration.
 */
export function NewLogPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const state = location.state as { bodyRegion?: BodyRegionId } | null
  const initialRegion = state?.bodyRegion ?? null
  const { createLog, isLoading: isSaving, user } = useHealthLogs()

  // Form state
  const [bodyRegion, setBodyRegion] = useState<BodyRegionId | ''>(initialRegion ?? '')
  const [datetime, setDatetime] = useState(() => {
    const now = new Date()
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset())
    return now.toISOString().slice(0, 16)
  })
  const [painScore, setPainScore] = useState<number>(5)
  const [painType, setPainType] = useState<PainType>('aching')
  const [painTypeOther, setPainTypeOther] = useState('')
  const [notes, setNotes] = useState('')
  const [attachmentFiles, setAttachmentFiles] = useState<File[]>([])
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    
    if (!bodyRegion) {
      setError('Please select a body region')
      return
    }

    try {
      const effectivePainType = painType === 'other' && painTypeOther.trim() ? painTypeOther.trim() : painType
      const newLog = await createLog({
        title: BODY_REGION_LABELS[bodyRegion as BodyRegionId],
        description: notes || undefined,
        body_parts: [bodyRegion as BodyRegionId],
        body_region: bodyRegion as BodyRegionId,
        pain_type: effectivePainType,
        severity: painScore,
        date: new Date(datetime).toISOString(),
      })

      if (newLog?.id && attachmentFiles.length > 0 && user?.sub) {
        for (const file of attachmentFiles) {
          try {
            await attachmentService.uploadLogAttachment(user.sub, newLog.id, file)
          } catch {
            // continue with other files; log is already saved
          }
        }
      }

      navigate('/logs')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save log')
    }
  }

  return (
    <PageContainer>
      <Link to="/logs" className="text-brand hover:text-white font-medium mb-4 inline-block">
        ← Back to Logs
      </Link>
      <h1 className="text-2xl font-bold text-white mb-6 font-display">New Symptom Log</h1>

      {error && (
        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 text-red-300 rounded-lg">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Body Region - required */}
        <div>
          <label htmlFor="bodyRegion" className="block text-sm font-medium text-white/80 mb-1">
            Body Region <span className="text-red-400">*</span>
          </label>
          <select
            id="bodyRegion"
            value={bodyRegion}
            onChange={(e) => setBodyRegion(e.target.value as BodyRegionId)}
            className="glass-input w-full"
            required
          >
            <option value="">Select a region…</option>
            {BODY_REGIONS.map((id) => (
              <option key={id} value={id}>
                {BODY_REGION_LABELS[id]}
              </option>
            ))}
          </select>
          {initialRegion && bodyRegion === initialRegion && (
            <p className="text-xs text-white/50 mt-1">
              Pre-selected from body viewer
            </p>
          )}
        </div>

        {/* Date/Time */}
        <div>
          <label htmlFor="datetime" className="block text-sm font-medium text-white/80 mb-1">
            Date &amp; Time
          </label>
          <input
            id="datetime"
            type="datetime-local"
            value={datetime}
            onChange={(e) => setDatetime(e.target.value)}
            className="glass-input w-full"
          />
        </div>

        {/* Pain Score 0-10 */}
        <div>
          <label htmlFor="painScore" className="block text-sm font-medium text-white/80 mb-1">
            Pain Score: <span className="font-semibold text-brand">{painScore}</span>
          </label>
          <input
            id="painScore"
            type="range"
            min={0}
            max={10}
            value={painScore}
            onChange={(e) => setPainScore(Number(e.target.value))}
            className="w-full accent-brand"
          />
          <div className="flex justify-between text-xs text-white/50 mt-1">
            <span>0 (none)</span>
            <span>10 (severe)</span>
          </div>
        </div>

        {/* Pain type */}
        <div>
          <label className="block text-sm font-medium text-white/80 mb-2">
            Type of pain
          </label>
          <div className="flex flex-wrap gap-2">
            {PAIN_TYPES.filter((p) => p !== 'other').map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setPainType(p)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium capitalize transition-colors ${
                  painType === p
                    ? 'bg-accent text-white'
                    : 'bg-white/10 text-white/80 hover:bg-white/15 border border-white/10'
                }`}
              >
                {p}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setPainType('other')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                painType === 'other'
                  ? 'bg-accent text-white'
                  : 'bg-white/10 text-white/80 hover:bg-white/15 border border-white/10'
              }`}
            >
              Other
            </button>
          </div>
          {painType === 'other' && (
            <input
              type="text"
              value={painTypeOther}
              onChange={(e) => setPainTypeOther(e.target.value)}
              placeholder="Describe your type of pain…"
              className="mt-2 w-full glass-input"
            />
          )}
        </div>

        {/* Notes */}
        <div>
          <label htmlFor="notes" className="block text-sm font-medium text-white/80 mb-1">
            Notes
          </label>
          <textarea
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            placeholder="Describe the symptom…"
            className="w-full glass-input resize-none"
          />
        </div>

        {/* Attachments */}
        <div>
          <label htmlFor="attachments" className="block text-sm font-medium text-white/80 mb-1">
            Attach file or image
          </label>
          <input
            id="attachments"
            type="file"
            accept="image/*,video/*,audio/*,.pdf"
            multiple
            onChange={(e) => {
              const files = e.target.files ? Array.from(e.target.files) : []
              setAttachmentFiles((prev) => [...prev, ...files])
            }}
            className="w-full text-sm text-white/80 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-brand/80 file:text-white file:font-medium hover:file:bg-brand/90"
          />
          {attachmentFiles.length > 0 && (
            <ul className="mt-2 space-y-1 text-sm text-white/70">
              {attachmentFiles.map((f, i) => (
                <li key={i} className="flex items-center justify-between gap-2">
                  <span className="truncate">{f.name}</span>
                  <button
                    type="button"
                    onClick={() => setAttachmentFiles((prev) => prev.filter((_, j) => j !== i))}
                    className="shrink-0 text-red-400 hover:text-red-300"
                    aria-label="Remove"
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Submit */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={isSaving}
            className="w-full rounded-lg bg-accent hover:bg-accent/90 px-4 py-2.5 text-white font-medium focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2 focus:ring-offset-black transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? 'Saving...' : 'Save Log'}
          </button>
        </div>
      </form>
    </PageContainer>
  )
}
