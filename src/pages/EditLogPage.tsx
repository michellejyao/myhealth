import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { BODY_REGIONS, BODY_REGION_LABELS, type BodyRegionId } from '../types'
import { logService, type HealthLog } from '../services/logService'
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
  const { updateLog } = useHealthLogs()

  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [log, setLog] = useState<HealthLog | null>(null)

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

  useEffect(() => {
    if (!log) return
    const parsed = parseBodyParts(log.body_parts)
    setBodyRegion(parsed.region)
    setDatetime(toLocalDateTime(log.date))
    setPainScore(log.severity ?? 5)
    setTags(parsed.tags.join(', '))
    setNotes(log.description ?? '')
  }, [log?.id])

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
        <Link to="/logs" className="text-indigo-600 hover:text-indigo-700 font-medium mb-4 inline-block">
          ← Back to Logs
        </Link>
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      </PageContainer>
    )
  }

  return (
    <PageContainer>
      <div className="flex items-center justify-between mb-4">
        <Link to={`/logs/${id}`} className="text-indigo-600 hover:text-indigo-700 font-medium">
          ← Back to Log
        </Link>
        <Link to="/logs" className="text-sm text-slate-500 hover:text-slate-700">
          All Logs
        </Link>
      </div>

      <h1 className="text-2xl font-bold text-slate-900 mb-6">Edit Symptom Log</h1>

      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label htmlFor="bodyRegion" className="block text-sm font-medium text-slate-700 mb-1">
            Body Region <span className="text-red-500">*</span>
          </label>
          <select
            id="bodyRegion"
            value={bodyRegion}
            onChange={(event) => setBodyRegion(event.target.value as BodyRegionId)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
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
          <label htmlFor="datetime" className="block text-sm font-medium text-slate-700 mb-1">
            Date &amp; Time
          </label>
          <input
            id="datetime"
            type="datetime-local"
            value={datetime}
            onChange={(event) => setDatetime(event.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        <div>
          <label htmlFor="painScore" className="block text-sm font-medium text-slate-700 mb-1">
            Pain Score: <span className="font-semibold text-indigo-600">{painScore}</span>
          </label>
          <input
            id="painScore"
            type="range"
            min={0}
            max={10}
            value={painScore}
            onChange={(event) => setPainScore(Number(event.target.value))}
            className="w-full accent-indigo-600"
          />
          <div className="flex justify-between text-xs text-slate-400 mt-1">
            <span>0 (none)</span>
            <span>10 (severe)</span>
          </div>
        </div>

        <div>
          <label htmlFor="tags" className="block text-sm font-medium text-slate-700 mb-1">
            Tags <span className="text-slate-400 font-normal">(comma-separated)</span>
          </label>
          <input
            id="tags"
            type="text"
            value={tags}
            onChange={(event) => setTags(event.target.value)}
            placeholder="e.g. stress, after exercise"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        <div>
          <label htmlFor="notes" className="block text-sm font-medium text-slate-700 mb-1">
            Notes
          </label>
          <textarea
            id="notes"
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            rows={3}
            placeholder="Describe the symptom…"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 resize-none"
          />
        </div>

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={isSaving}
            className="flex-1 rounded-lg bg-indigo-600 px-4 py-2.5 text-white font-medium hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? 'Saving...' : 'Save Changes'}
          </button>
          <Link
            to={`/logs/${id}`}
            className="inline-flex items-center justify-center rounded-lg border border-slate-300 px-4 py-2.5 text-slate-700 hover:bg-slate-50"
          >
            Cancel
          </Link>
        </div>
      </form>
    </PageContainer>
  )
}
