import { useParams, Link } from 'react-router-dom'

/**
 * PR-05: Log detail view placeholder. Will load log by id and show attachments.
 */
export function LogDetailPage() {
  const { id } = useParams<{ id: string }>()

  return (
    <div>
      <Link to="/logs" className="text-indigo-600 hover:underline mb-4 inline-block">
        ← Back to logs
      </Link>
      <h1 className="text-xl font-semibold text-slate-800">Log detail</h1>
      <p className="text-slate-600 mt-2">Log ID: {id}</p>
      <p className="text-slate-500 text-sm mt-2">
        Full fields + attachments + AI flags will render here.
      </p>
    </div>
  )
}
