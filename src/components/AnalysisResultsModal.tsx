import React from 'react'

interface AnalysisResultsModalProps {
  open: boolean
  onClose: () => void
  result: any
}

export const AnalysisResultsModal: React.FC<AnalysisResultsModalProps> = ({
  open,
  onClose,
  result,
}) => {
  if (!open || !result) return null

  const { risk_score, summary, flags = [], insights = [], ai_warning } = result

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 dark:bg-black/60">
      <div className="bg-white dark:bg-slate-900 rounded-lg shadow-lg p-8 max-w-3xl w-full relative overflow-y-auto" style={{ maxHeight: '90vh' }}>
        <button
          className="absolute top-2 right-2 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 text-xl"
          onClick={onClose}
        >
          ×
        </button>

        <h2 className="text-2xl font-bold mb-6 text-slate-900 dark:text-white">Pattern Analysis Result</h2>

        {ai_warning && (
          <div className="mb-4 p-3 bg-amber-100 dark:bg-amber-900/30 border border-amber-300 dark:border-amber-600 rounded text-amber-800 dark:text-amber-300 text-sm">
            <strong>AI Notice:</strong> {ai_warning}. Showing deterministic analysis only.
          </div>
        )}

        <div className="flex gap-6 mb-8 items-center">
          {/* Risk Score Circle - vertically centered */}
          <div className="flex flex-col items-center justify-center" style={{ minWidth: '100px' }}>
            <div className="w-20 h-20 rounded-full bg-red-100 flex items-center justify-center text-3xl font-bold text-red-600 border-4 border-red-300 shadow">
              {risk_score ?? 'N/A'}
            </div>
            <div className="mt-2 text-sm font-medium text-red-700">
              Risk Score
            </div>
          </div>

          {/* Summary */}
          <div className="flex-1 flex flex-col justify-center">
            <h3 className="font-semibold text-slate-800 dark:text-slate-200 mb-2 text-lg">
              Summary
            </h3>
            <p className="bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded p-4 text-base">
              {summary ?? 'No summary available.'}
            </p>
          </div>
        </div>

        {/* Flags */}
        {flags.length > 0 && (
          <div className="mb-6">
            <h3 className="font-semibold text-slate-800 dark:text-slate-200 mb-2 text-lg">
              Flags
            </h3>
            <ul className="space-y-3">
              {flags.map((flag: any, idx: number) => (
                <li
                  key={idx}
                  className="bg-yellow-100 dark:bg-yellow-900/30 rounded p-3 text-sm flex items-start gap-3"
                >
                  <span className="text-yellow-600 dark:text-yellow-400 mt-1">
                    <svg
                      width="24"
                      height="24"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <path
                        d="M6 21V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2z"
                        stroke="#b45309"
                        strokeWidth="2"
                        fill="#fde68a"
                      />
                    </svg>
                  </span>
                  <div>
                    <div className="font-bold text-yellow-800 dark:text-yellow-300">
                      {flag.title}
                    </div>
                    <div className="text-yellow-700 dark:text-yellow-400">
                      {flag.reasoning_summary}
                    </div>
                    <div className="mt-1 text-yellow-900 dark:text-yellow-300">
                      Severity: {flag.severity}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Insights */}
        {insights.length > 0 && (
          <div className="mb-6">
            <h3 className="font-semibold text-slate-800 dark:text-slate-200 mb-2 text-lg">
              Insights
            </h3>
            <ul className="space-y-3">
              {insights.map((insight: string, idx: number) => (
                <li
                  key={idx}
                  className="bg-blue-100 dark:bg-blue-900/30 rounded p-3 text-sm flex items-center gap-3"
                >
                  <span className="text-blue-600 dark:text-blue-400">
                    <svg
                      width="24"
                      height="24"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="#2563eb"
                        strokeWidth="2"
                        fill="#dbeafe"
                      />
                      <path
                        d="M12 8v4l3 2"
                        stroke="#2563eb"
                        strokeWidth="2"
                        strokeLinecap="round"
                      />
                    </svg>
                  </span>
                  <span className="text-blue-800 dark:text-blue-300">{insight}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  )
}
