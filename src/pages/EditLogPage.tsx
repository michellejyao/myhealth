import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useAuth0 } from '@auth0/auth0-react'
import { BODY_REGIONS, BODY_REGION_LABELS, type BodyRegionId } from '../types'
import type { AttachmentEntry } from '../types'
import { logService, type HealthLog } from '../services/logService'
import { attachmentService } from '../services/attachmentService'
import { useHealthLogs } from '../hooks/useHealthLogs'
import { LoadingSpinner } from '../components/LoadingSpinner'
import { PageContainer } from '../components/PageContainer'

const toLocalDateTime = (isoDate: string) => {
  const date = new Date(isoDate)
  if (Number.isNaN(date.getTime())) return ''
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset())
  return date.toISOString().slice(0, 16)
}

const parseBodyParts = (bodyParts?: string[]) => {
  const region = bodyParts?.find((part) => BODY_REGIONS.includes(part as BodyRegionId))
  const tags = (bodyParts ?? []).filter((part) => part !== region)
  return { region: (region ?? '') as BodyRegionId | '', tags }
}

export function EditLogPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuth0()
  const userId = user?.sub ?? ''
  const { updateLog } = useHealthLogs()

  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [log, setLog] = useState<HealthLog | null>(null)
  const [attachments, setAttachments] = useState<AttachmentEntry[]>([])

  const [bodyRegion, setBodyRegion] = useState<BodyRegionId | ''>('')
  const [datetime, setDatetime] = useState('')
  const [painScore, setPainScore] = useState<number>(5)
  const [tags, setTags] = useState('')
  const [notes, setNotes] = useState('')

  useEffect(() => {
    async function loadLog() {
      if (!id) {
        setError('No log ID provided')
        setIsLoading(false)
        return
      }

      try {
        setIsLoading(true)
        setError(null)
        const [logData, attachmentsData] = await Promise.all([
          logService.getLogById(id),
          id ? attachmentService.getAttachmentsByLogId(id) : Promise.resolve([]),
        ])
        setLog(logData)
        setAttachments(attachmentsData ?? [])
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load log')
      } finally {
        setIsLoading(false)
      }
    }

    loadLog()
  }, [id])

  useEffect(() => {
    if (!log) return
    const parsed = parseBodyParts(log.body_parts)
    setBodyRegion(parsed.region)
    setDatetime(toLocalDateTime(log.date))
    setPainScore(log.severity ?? 5)
    setTags(parsed.tags.join(', '))
    setNotes(log.description ?? '')
  }, [log?.id])

  const handleRemoveAttachment = async (attachmentId: string) => {
    try {
      await attachmentService.deleteAttachment(attachmentId)
      setAttachments((prev) => prev.filter((a) => a.id !== attachmentId))
    } catch {
      setError('Failed to remove attachment')
    }
  }

  const handleAddAttachments = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files ? Array.from(e.target.files) : []
    e.target.value = ''
    if (!id || !userId || files.length === 0) return
    setUploading(true)
    try {
      for (const file of files) {
        const created = await attachmentService.uploadLogAttachment(userId, id, file)
        setAttachments((prev) => [...prev, created])
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload')
    } finally {
      setUploading(false)
    }
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setError(null)

    if (!id) {
      setError('Missing log ID')
      return
    }

    if (!bodyRegion) {
      setError('Please select a body region')
      return
    }

    if (!datetime) {
      setError('Please select a date and time')
      return
    }

    try {
      setIsSaving(true)
      const tagArray = tags.split(',').map((tag) => tag.trim()).filter(Boolean)
      const bodyParts = [bodyRegion as BodyRegionId, ...tagArray]

      await updateLog(id, {
        title: BODY_REGION_LABELS[bodyRegion as BodyRegionId],
        description: notes || undefined,
        body_parts: bodyParts,
        severity: painScore,
        date: new Date(datetime).toISOString(),
      })

      navigate(`/logs/${id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update log')
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return <LoadingSpinner />
  }

  if (error && !log) {
    return (
      <PageContainer>
        <Link to="/logs" className="text-brand hover:text-white font-medium mb-4 inline-block">
          ← Back to Logs
        </Link>
        <div className="bg-red-500/10 border border-red-500/30 text-red-300 px-4 py-3 rounded-lg">
          {error}
        </div>
      </PageContainer>
    )
  }

  return (
    <PageContainer>
      <div className="flex items-center justify-between mb-4">
        <Link to={`/logs/${id}`} className="text-brand hover:text-white font-medium">
          ← Back to Log
        </Link>
        <Link to="/logs" className="text-sm text-white/70 hover:text-white/90">
          All Logs
        </Link>
      </div>

      <h1 className="text-2xl font-bold text-white mb-6 font-display">Edit Symptom Log</h1>

      {error && (
        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 text-red-300 rounded-lg">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label htmlFor="bodyRegion" className="block text-sm font-medium text-white/80 mb-1">
            Body Region <span className="text-red-400">*</span>
          </label>
          <select
            id="bodyRegion"
            value={bodyRegion}
            onChange={(event) => setBodyRegion(event.target.value as BodyRegionId)}
            className="glass-input w-full"
            required
          >
            <option value="">Select a region…</option>
            {BODY_REGIONS.map((regionId) => (
              <option key={regionId} value={regionId}>
                {BODY_REGION_LABELS[regionId]}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="datetime" className="block text-sm font-medium text-white/80 mb-1">
            Date &amp; Time
          </label>
          <input
            id="datetime"
            type="datetime-local"
            value={datetime}
            onChange={(event) => setDatetime(event.target.value)}
            className="glass-input w-full"
          />
        </div>

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
            onChange={(event) => setPainScore(Number(event.target.value))}
            className="w-full accent-brand"
          />
          <div className="flex justify-between text-xs text-white/50 mt-1">
            <span>0 (none)</span>
            <span>10 (severe)</span>
          </div>
        </div>

        <div>
          <label htmlFor="tags" className="block text-sm font-medium text-white/80 mb-1">
            Tags <span className="text-white/50 font-normal">(comma-separated)</span>
          </label>
          <input
            id="tags"
            type="text"
            value={tags}
            onChange={(event) => setTags(event.target.value)}
            placeholder="e.g. stress, after exercise"
            className="glass-input w-full"
          />
        </div>

        <div>
          <label htmlFor="notes" className="block text-sm font-medium text-white/80 mb-1">
            Notes
          </label>
          <textarea
            id="notes"
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            rows={3}
            placeholder="Describe the symptom…"
            className="w-full glass-input resize-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-white/80 mb-1">
            Attachments
          </label>
          {attachments.length > 0 && (
            <ul className="mb-2 space-y-2">
              {attachments.map((a) => {
                const url = attachmentService.getAttachmentUrl(a)
                return (
                  <li
                    key={a.id}
                    className="flex items-center justify-between gap-2 rounded-lg border border-white/20 bg-white/5 px-3 py-2"
                  >
                    {a.type === 'image' ? (
                      <a href={url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 min-w-0">
                        <img src={url} alt="" className="h-10 w-10 rounded object-cover shrink-0" />
                        <span className="text-sm text-white/90 truncate">{a.file_name || 'Image'}</span>
                      </a>
                    ) : (
                      <a href={url} target="_blank" rel="noopener noreferrer" className="text-sm text-white/90 hover:text-white truncate min-w-0">
                        {a.type === 'video' ? '🎬' : a.type === 'audio' ? '🎵' : '📄'} {a.file_name || a.type}
                      </a>
                    )}
                    <button
                      type="button"
                      onClick={() => handleRemoveAttachment(a.id)}
                      className="shrink-0 text-sm text-red-400 hover:text-red-300"
                    >
                      Remove
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
          <input
            type="file"
            accept="image/*,video/*,audio/*,.pdf"
            multiple
            onChange={handleAddAttachments}
            disabled={uploading}
            className="w-full text-sm text-white/80 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-brand/80 file:text-white file:font-medium hover:file:bg-brand/90 disabled:opacity-50"
          />
          {uploading && <p className="mt-1 text-xs text-white/60">Uploading…</p>}
        </div>

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={isSaving}
            className="flex-1 rounded-lg bg-accent hover:bg-accent/90 px-4 py-2.5 text-white font-medium focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2 focus:ring-offset-black transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? 'Saving...' : 'Save Changes'}
          </button>
          <Link
            to={`/logs/${id}`}
            className="inline-flex items-center justify-center rounded-lg border border-white/20 px-4 py-2.5 text-white/80 hover:bg-white/10 transition-colors"
          >
            Cancel
          </Link>
        </div>
      </form>
    </PageContainer>
  )
}
