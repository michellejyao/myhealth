import { useHealthLogs } from '../hooks/useHealthLogs'
import { LoadingSpinner } from '../components/LoadingSpinner'

/**
 * PR-06: Timeline view. Shows logs grouped by date with filtering.
 */
export function TimelinePage() {
  const { logs, isLoading } = useHealthLogs()

  if (isLoading) {
    return <LoadingSpinner />
  }

  // Group logs by date
  const groupedLogs = logs.reduce(
    (acc, log) => {
      const date = new Date(log.date).toLocaleDateString()
      if (!acc[date]) acc[date] = []
      acc[date].push(log)
      return acc
    },
    {} as Record<string, typeof logs>,
  )

  const sortedDates = Object.keys(groupedLogs).sort(
    (a, b) => new Date(b).getTime() - new Date(a).getTime(),
  )

  return (
    <div>
      <h1 className="text-2xl font-semibold text-slate-800 mb-6">Timeline</h1>

      {logs.length === 0 ? (
        <div className="text-center py-10 text-slate-600">No logs to display</div>
      ) : (
        <div className="space-y-8">
          {sortedDates.map((date) => (
            <div key={date}>
              <h2 className="text-lg font-semibold text-slate-800 mb-3 sticky top-0 bg-slate-50 py-2">
                {new Date(date).toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </h2>
              <div className="space-y-3 border-l-2 border-indigo-300 pl-4">
                {groupedLogs[date].map((log) => (
                  <div key={log.id} className="relative pb-6">
                    <div className="absolute -left-6 mt-1 w-3 h-3 bg-indigo-600 rounded-full"></div>
                    <div className="bg-white rounded border border-slate-200 p-4">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <p className="font-semibold text-slate-800">{log.title}</p>
                          {log.description && (
                            <p className="text-sm text-slate-600 mt-1">{log.description}</p>
                          )}
                          {log.severity && (
                            <p className="text-sm text-slate-600 mt-2">
                              Severity: <span className="text-red-600 font-medium">{log.severity}/10</span>
                            </p>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 whitespace-nowrap ml-4">
                          {new Date(log.date).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
