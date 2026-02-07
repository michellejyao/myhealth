import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { BODY_REGIONS, BODY_REGION_LABELS, type BodyRegionId } from '../types'

/**
 * PR-01/PR-03: New Log form. Region comes from body click or manual choice.
 */
export function NewLogPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const state = location.state as { bodyRegion?: BodyRegionId } | null
  const initialRegion = state?.bodyRegion ?? null

  // Form state
  const [bodyRegion, setBodyRegion] = useState<BodyRegionId | ''>(initialRegion ?? '')
  const [datetime, setDatetime] = useState(() => {
    const now = new Date()
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset())
    return now.toISOString().slice(0, 16)
  })
  const [painScore, setPainScore] = useState<number>(5)
  const [tags, setTags] = useState('')
  const [notes, setNotes] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!bodyRegion) {
      alert('Please select a body region')
      return
    }
    // TODO (PR-03): Persist to IndexedDB via Dexie
    console.log('Saving log:', {
      bodyRegion,
      datetime,
      painScore,
      tags: tags.split(',').map((t) => t.trim()).filter(Boolean),
      notes,
    })
    navigate('/logs')
  }

  return (
    <div className="max-w-lg">
      <Link to="/" className="text-indigo-600 hover:underline mb-4 inline-block">
        ← Back to body
      </Link>
      <h1 className="text-xl font-semibold text-slate-800 mb-6">New Symptom Log</h1>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Body Region - required */}
        <div>
          <label htmlFor="bodyRegion" className="block text-sm font-medium text-slate-700 mb-1">
            Body Region <span className="text-red-500">*</span>
          </label>
          <select
            id="bodyRegion"
            value={bodyRegion}
            onChange={(e) => setBodyRegion(e.target.value as BodyRegionId)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
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
            <p className="text-xs text-slate-500 mt-1">
              Pre-selected from body viewer
            </p>
          )}
        </div>

        {/* Date/Time */}
        <div>
          <label htmlFor="datetime" className="block text-sm font-medium text-slate-700 mb-1">
            Date &amp; Time
          </label>
          <input
            id="datetime"
            type="datetime-local"
            value={datetime}
            onChange={(e) => setDatetime(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        {/* Pain Score 0-10 */}
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
            onChange={(e) => setPainScore(Number(e.target.value))}
            className="w-full accent-indigo-600"
          />
          <div className="flex justify-between text-xs text-slate-400 mt-1">
            <span>0 (none)</span>
            <span>10 (severe)</span>
          </div>
        </div>

        {/* Tags */}
        <div>
          <label htmlFor="tags" className="block text-sm font-medium text-slate-700 mb-1">
            Tags <span className="text-slate-400 font-normal">(comma-separated)</span>
          </label>
          <input
            id="tags"
            type="text"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="e.g. stress, after exercise"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        {/* Notes */}
        <div>
          <label htmlFor="notes" className="block text-sm font-medium text-slate-700 mb-1">
            Notes
          </label>
          <textarea
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            placeholder="Describe the symptom…"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 resize-none"
          />
        </div>

        {/* Submit */}
        <div className="pt-2">
          <button
            type="submit"
            className="w-full rounded-lg bg-indigo-600 px-4 py-2.5 text-white font-medium hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors"
          >
            Save Log
          </button>
        </div>
      </form>
    </div>
  )
}
