import { useState, useEffect } from 'react'
import { useAuth0 } from '@auth0/auth0-react'
import {
  BookPageLayout,
  BookSection,
  BookFormField,
  BookSaveButton,
} from '../components'
import {
  BODY_REGION_LABELS,
  PAIN_TYPES,
  SYMPTOM_TAG_OPTIONS,
} from '../../../types'
import type { BodyRegionId, PainType } from '../../../types'
import type { HealthLog } from '../../../services/logService'
import { logService } from '../../../services/logService'
import { analysisService } from '../../../services/analysisService'
import { attachmentService } from '../../../services/attachmentService'

const inputClass =
  'w-full rounded border border-black/20 bg-white px-3 py-2 text-black text-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent'

interface BodyRegionLogPageProps {
  bodyRegion: BodyRegionId
  logId?: string | null
  /** When true, only show recorded issues (e.g. body part click); no add/new form. */
  recordedIssuesOnly?: boolean
  onSaved?: () => void
  onCancel?: () => void
}

export function BodyRegionLogPage({
  bodyRegion,
  logId,
  recordedIssuesOnly = false,
  onSaved,
  onCancel,
}: BodyRegionLogPageProps) {
  const { user } = useAuth0()
  const userId = user?.sub ?? ''
  const isEdit = Boolean(logId)

  const [datetime, setDatetime] = useState(() => {
    const now = new Date()
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset())
    return now.toISOString().slice(0, 16)
  })
  const [painScore, setPainScore] = useState(5)
  const [painType, setPainType] = useState<PainType>('aching')
  const [symptomTags, setSymptomTags] = useState<string[]>([])
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [attachmentFiles, setAttachmentFiles] = useState<File[]>([])
  const [previousLogs, setPreviousLogs] = useState<HealthLog[]>([])
  const [loadingLogs, setLoadingLogs] = useState(true)

  // Fetch previously recorded health issues for this body region
  useEffect(() => {
    if (!userId) return
    let cancelled = false
    setLoadingLogs(true)
    logService
      .getLogsByBodyRegion(userId, bodyRegion)
      .then((logs) => {
        if (!cancelled) setPreviousLogs(logs ?? [])
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoadingLogs(false)
      })
    return () => { cancelled = true }
  }, [userId, bodyRegion])

  // Load existing log when editing
  useEffect(() => {
    if (!logId) return
    let cancelled = false
    logService.getLogById(logId).then((log) => {
      if (cancelled || !log) return
      setDatetime(new Date(log.date).toISOString().slice(0, 16))
      setPainScore(log.severity ?? 5)
      setPainType((log.pain_type as PainType) || 'aching')
      setSymptomTags(log.symptom_tags ?? [])
      setNotes(log.description ?? '')
    }).catch(() => setError('Failed to load log'))
    return () => { cancelled = true }
  }, [logId])

  const toggleSymptomTag = (tag: string) => {
    setSymptomTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    )
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSaving(true)
    try {
      if (isEdit && logId) {
        await logService.updateLogEntry(logId, {
          body_region: bodyRegion,
          datetime: new Date(datetime).toISOString(),
          pain_score: painScore,
          pain_type: painType,
          symptom_tags: symptomTags,
          notes: notes || undefined,
        })
      } else {
        const created = await logService.createLogEntry(userId, {
          body_region: bodyRegion,
          datetime: new Date(datetime).toISOString(),
          pain_score: painScore,
          pain_type: painType,
          symptom_tags: symptomTags,
          notes: notes || undefined,
        })
        if (created?.id) {
          try {
            await analysisService.analyzeLogs(userId, created.id)
          } catch {
            // Non-blocking
          }
          for (const file of attachmentFiles) {
            try {
              await attachmentService.uploadLogAttachment(userId, created.id, file)
            } catch {
              // Non-blocking
            }
          }
        }
      }
      onSaved?.()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!logId || !confirm('Delete this log?')) return
    setSaving(true)
    try {
      await logService.deleteLogEntry(logId)
      onSaved?.()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete')
    } finally {
      setSaving(false)
    }
  }

  const regionLabel = BODY_REGION_LABELS[bodyRegion]

  return (
    <BookPageLayout title={recordedIssuesOnly ? regionLabel : `Symptom log — ${regionLabel}`}>
      {/* Previously recorded health issues for this body region */}
      <BookSection title="Your recorded issues">
        {loadingLogs ? (
          <p className="text-sm text-black/70">Loading…</p>
        ) : previousLogs.length === 0 ? (
          <p className="text-sm text-black/70">No health records for this region yet.</p>
        ) : (
          <ul className={`space-y-2 overflow-y-auto ${recordedIssuesOnly ? 'max-h-[60vh]' : 'max-h-32'}`}>
            {previousLogs.map((log) => (
              <li
                key={log.id}
                className="p-2 rounded border border-black/10 bg-white/80 text-sm text-black"
              >
                <span className="font-medium">
                  {new Date(log.date).toLocaleDateString()} {new Date(log.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
                {log.severity != null && (
                  <span className="ml-1 text-accent">Pain: {log.severity}/10</span>
                )}
                {log.pain_type && (
                  <span className="ml-1 text-black/70">({log.pain_type})</span>
                )}
                {log.description && (
                  <p className="mt-0.5 text-xs text-black/70 line-clamp-1">{log.description}</p>
                )}
              </li>
            ))}
          </ul>
        )}
      </BookSection>

      {!recordedIssuesOnly && (
      <form onSubmit={handleSave} className="space-y-4">
        {error && (
          <div className="p-2 rounded bg-brand/20 text-accent text-sm">
            {error}
          </div>
        )}

        <BookSection title="When &amp; where">
          <BookFormField label="Body region">
            <input
              type="text"
              value={regionLabel}
              readOnly
              className={inputClass + ' bg-white/90'}
            />
          </BookFormField>
          <BookFormField label="Date &amp; time" htmlFor="datetime">
            <input
              id="datetime"
              type="datetime-local"
              value={datetime}
              onChange={(e) => setDatetime(e.target.value)}
              className={inputClass}
            />
          </BookFormField>
        </BookSection>

        <BookSection title="Pain">
          <BookFormField label={`Pain score: ${painScore}`} htmlFor="pain_score">
            <input
              id="pain_score"
              type="range"
              min={0}
              max={10}
              value={painScore}
              onChange={(e) => setPainScore(Number(e.target.value))}
              className="w-full accent-accent"
            />
          </BookFormField>
          <BookFormField label="Pain type" htmlFor="pain_type">
            <select
              id="pain_type"
              value={painType}
              onChange={(e) => setPainType(e.target.value as PainType)}
              className={inputClass}
            >
              {PAIN_TYPES.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </BookFormField>
        </BookSection>

        <BookSection title="Symptoms">
          <BookFormField label="Tags">
            <div className="flex flex-wrap gap-2">
              {SYMPTOM_TAG_OPTIONS.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => toggleSymptomTag(tag)}
                  className={
                    symptomTags.includes(tag)
                      ? 'px-2 py-1 rounded text-xs bg-accent text-white'
                      : 'px-2 py-1 rounded text-xs border border-black/20 text-black/80'
                  }
                >
                  {tag}
                </button>
              ))}
            </div>
          </BookFormField>
        </BookSection>

        <BookSection title="Notes">
          <BookFormField label="Notes">
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Describe the symptom…"
              className={inputClass + ' resize-none'}
            />
          </BookFormField>
        </BookSection>

        <BookSection title="Attachments">
          <BookFormField label="Image / file" hint="Optional. Upload will be saved to your record.">
            <input
              type="file"
              accept="image/*,video/*,audio/*"
              multiple
              onChange={(e) => {
                const files = e.target.files ? Array.from(e.target.files) : []
                setAttachmentFiles((prev) => [...prev, ...files])
              }}
              className="text-sm text-black/70"
            />
            {attachmentFiles.length > 0 && (
              <p className="mt-1 text-xs text-black/70">
                {attachmentFiles.length} file(s) selected — will be saved with this log.
              </p>
            )}
          </BookFormField>
        </BookSection>

        <div className="flex flex-wrap gap-2 pt-4 border-t border-black/10">
          <BookSaveButton type="submit" label="Save log" saving={saving} />
          {onCancel && (
            <BookSaveButton
              type="button"
              variant="secondary"
              label="Cancel"
              onClick={onCancel}
              disabled={saving}
            />
          )}
          {isEdit && logId && (
            <BookSaveButton
              type="button"
              variant="danger"
              label="Delete log"
              onClick={handleDelete}
              disabled={saving}
            />
          )}
        </div>
      </form>
      )}
    </BookPageLayout>
  )
}
