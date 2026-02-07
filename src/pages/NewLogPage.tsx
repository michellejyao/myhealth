import { Link } from 'react-router-dom'
import { useLocation } from 'react-router-dom'
import { BODY_REGION_LABELS, type BodyRegionId } from '../types'

/**
 * PR-03: New Log form placeholder. Region comes from body click or manual choice.
 */
export function NewLogPage() {
  const location = useLocation()
  const state = location.state as { bodyRegion?: BodyRegionId } | null
  const initialRegion = state?.bodyRegion ?? null

  return (
    <div>
      <Link to="/logs" className="text-indigo-600 hover:underline mb-4 inline-block">
        ← Back to logs
      </Link>
      <h1 className="text-xl font-semibold text-slate-800 mb-4">New log</h1>
      <p className="text-slate-600 mb-4">
        Form fields: datetime, body region (required), pain score 0–10, tags, notes. Save writes to
        storage.
      </p>
      {initialRegion && (
        <p className="text-sm text-slate-500 mb-4">
          Pre-selected region from body: <strong>{BODY_REGION_LABELS[initialRegion]}</strong>
        </p>
      )}
      <div className="text-slate-500 text-sm">
        Form UI and persistence (PR-03) to be wired next.
      </div>
    </div>
  )
}
