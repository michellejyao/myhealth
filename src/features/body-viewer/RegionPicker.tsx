import { BODY_REGIONS, BODY_REGION_LABELS, type BodyRegionId } from './bodyRegions'

interface RegionPickerProps {
  /** Called when user selects a region */
  onSelect: (region: BodyRegionId) => void
  /** Called when user cancels selection */
  onCancel: () => void
  /** Optional suggested region from detection (shown highlighted) */
  suggestion?: BodyRegionId | null
  /** Position hint for where the picker should appear */
  position?: { x: number; y: number }
}

/**
 * Fallback region picker shown when automatic detection fails.
 * Displays all body regions in a grid for manual selection.
 */
export function RegionPicker({ onSelect, onCancel, suggestion }: RegionPickerProps) {
  // Group regions logically for display
  const regionGroups = [
    { label: 'Upper Body', regions: ['head', 'neck', 'chest', 'back'] as BodyRegionId[] },
    { label: 'Core', regions: ['abdomen'] as BodyRegionId[] },
    { label: 'Arms', regions: ['left_arm', 'right_arm'] as BodyRegionId[] },
    { label: 'Legs', regions: ['left_leg', 'right_leg'] as BodyRegionId[] },
  ]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div 
        className="bg-white rounded-xl shadow-2xl max-w-sm w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        role="dialog"
        aria-label="Select body region"
      >
        {/* Header */}
        <div className="px-4 py-3 border-b border-slate-200 bg-slate-50">
          <h3 className="font-semibold text-slate-800">Select Body Region</h3>
          <p className="text-sm text-slate-500">
            We couldn't determine the exact region. Please select manually.
          </p>
        </div>

        {/* Region grid */}
        <div className="p-4 space-y-4">
          {regionGroups.map((group) => (
            <div key={group.label}>
              <h4 className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">
                {group.label}
              </h4>
              <div className="grid grid-cols-2 gap-2">
                {group.regions.map((regionId) => (
                  <button
                    key={regionId}
                    onClick={() => onSelect(regionId)}
                    className={`
                      px-3 py-2.5 rounded-lg text-sm font-medium transition-colors
                      ${suggestion === regionId
                        ? 'bg-indigo-100 text-indigo-700 ring-2 ring-indigo-500 ring-offset-1'
                        : 'bg-slate-100 text-slate-700 hover:bg-indigo-50 hover:text-indigo-600'
                      }
                    `}
                  >
                    {BODY_REGION_LABELS[regionId]}
                    {suggestion === regionId && (
                      <span className="ml-1 text-xs text-indigo-500">(suggested)</span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-slate-200 bg-slate-50">
          <button
            onClick={onCancel}
            className="w-full px-4 py-2 text-sm text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}

/**
 * Inline region picker shown below the viewer (alternative to modal).
 */
export function InlineRegionPicker({ 
  onSelect, 
  onCancel, 
  suggestion 
}: RegionPickerProps) {
  return (
    <div className="mt-3 p-4 rounded-xl border border-amber-200 bg-amber-50">
      <div className="flex items-start gap-2 mb-3">
        <svg className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        <div>
          <p className="text-sm font-medium text-amber-800">
            Couldn't detect the body region
          </p>
          <p className="text-xs text-amber-600 mt-0.5">
            Please select the region you clicked:
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {BODY_REGIONS.map((regionId) => (
          <button
            key={regionId}
            onClick={() => onSelect(regionId)}
            className={`
              px-3 py-1.5 rounded-lg text-xs font-medium transition-colors
              ${suggestion === regionId
                ? 'bg-indigo-600 text-white'
                : 'bg-white text-slate-700 border border-slate-200 hover:border-indigo-300 hover:text-indigo-600'
              }
            `}
          >
            {BODY_REGION_LABELS[regionId]}
          </button>
        ))}
      </div>

      <button
        onClick={onCancel}
        className="mt-3 text-xs text-slate-500 hover:text-slate-700 underline"
      >
        Cancel selection
      </button>
    </div>
  )
}
