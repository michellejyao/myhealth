import { Link } from 'react-router-dom'
import { BODY_REGION_LABELS } from '../types'

/**
 * PR-05: Log list placeholder. Will load from db and support filters.
 */
export function LogsPage() {
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-semibold text-slate-800">Logs</h1>
        <Link
          to="/logs/new"
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
        >
          New log
        </Link>
      </div>
      <p className="text-slate-600">
        Log list (by datetime desc) and filters by body region / tag will go here. Click a log to open
        detail view.
      </p>
      <p className="text-slate-500 text-sm mt-2">
        Body regions: {Object.values(BODY_REGION_LABELS).join(', ')}
      </p>
    </div>
  )
}
