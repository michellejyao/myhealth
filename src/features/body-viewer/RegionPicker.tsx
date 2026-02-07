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
        className="bg-white rounded-xl shadow-2xl max-w-sm w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200 border border-white/20"
        role="dialog"
        aria-label="Select body region"
      >
        {/* Header */}
        <div className="px-4 py-3 border-b border-black/10 bg-white">
          <h3 className="font-semibold text-black">Select Body Region</h3>
          <p className="text-sm text-black/70">
            We couldn't determine the exact region. Please select manually.
          </p>
        </div>

        {/* Region grid */}
        <div className="p-4 space-y-4">
          {regionGroups.map((group) => (
            <div key={group.label}>
              <h4 className="text-xs font-medium text-black/60 uppercase tracking-wider mb-2">
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
                        ? 'bg-accent text-white ring-2 ring-accent ring-offset-1'
                        : 'bg-black/5 text-black hover:bg-brand/20 hover:text-accent border border-black/10'
                      }
                    `}
                  >
                    {BODY_REGION_LABELS[regionId]}
                    {suggestion === regionId && (
                      <span className="ml-1 text-xs text-white/80">(suggested)</span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-black/10 bg-white">
          <button
            onClick={onCancel}
            className="w-full px-4 py-2 text-sm text-black/80 hover:bg-black/5 rounded-lg transition-colors"
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
    <div className="mt-3 p-4 rounded-xl border border-brand/30 bg-brand/10">
      <div className="flex items-start gap-2 mb-3">
        <svg className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        <div>
          <p className="text-sm font-medium text-black">
            Couldn't detect the body region
          </p>
          <p className="text-xs text-black/70 mt-0.5">
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
                ? 'bg-accent text-white'
                : 'bg-white text-black border border-black/20 hover:border-brand hover:text-accent'
              }
            `}
          >
            {BODY_REGION_LABELS[regionId]}
          </button>
        ))}
      </div>

      <button
        onClick={onCancel}
        className="mt-3 text-xs text-black/70 hover:text-black underline"
      >
        Cancel selection
      </button>
    </div>
  )
}
