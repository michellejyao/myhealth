import { useEffect, useRef, useCallback, useState } from 'react'
import { type BodyRegionId } from './bodyRegions'
import { mapAnatomyToBodyRegion } from './anatomyMapping'

// BioDigital Human API types
declare global {
  interface Window {
    HumanAPI: new (iframeId: string) => HumanAPIInstance
  }
}

interface HumanAPIInstance {
  on: (event: string, callback: (data: unknown) => void) => void
  once: (event: string, callback: (data: unknown) => void) => void
  send: (message: string, params?: unknown, callback?: (data: unknown) => void) => void
}

interface ScenePickedEvent {
  objectId?: string
  name?: string
  displayName?: string
  picked?: boolean
  position?: { x: number; y: number; z: number }
}

interface BioDigitalViewerProps {
  onSelectRegion: (region: BodyRegionId, anatomyName?: string) => void
  highlightedRegion?: BodyRegionId | null
  /** Optional BioDigital developer key - required for production */
  developerKey?: string
}

// Model ID for male complete anatomy
const MODEL_ID = 'production/maleAdult/male_complete_anatomy_20'

/**
 * BioDigital Human 3D anatomy viewer with click-to-select body regions.
 * Uses BioDigital's embedded widget API for realistic anatomical visualization.
 */
export function BioDigitalViewer({ 
  onSelectRegion, 
  highlightedRegion,
  developerKey 
}: BioDigitalViewerProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const humanApiRef = useRef<HumanAPIInstance | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedAnatomy, setSelectedAnatomy] = useState<string | null>(null)

  // Build the widget URL with parameters
  const widgetUrl = buildWidgetUrl(MODEL_ID, developerKey)

  // Initialize HumanAPI when iframe loads
  const initializeApi = useCallback(() => {
    if (!window.HumanAPI) {
      console.error('HumanAPI not loaded')
      setError('BioDigital API failed to load')
      return
    }

    try {
      const human = new window.HumanAPI('biodigital-iframe')
      humanApiRef.current = human

      // Listen for when the model is fully loaded
      human.on('human.ready', () => {
        setIsLoading(false)
        console.log('BioDigital Human model ready')
        
        // Configure initial camera position for full body view
        human.send('camera.set', {
          position: { x: 0, y: 0, z: 2.5 },
          target: { x: 0, y: 0, z: 0 },
          animate: true
        })
      })

      // Listen for object selection/click events
      human.on('scene.picked', (data: unknown) => {
        const event = data as ScenePickedEvent
        handleObjectPicked(event)
      })

      // Also listen for selection changes
      human.on('scene.selectionUpdated', (data: unknown) => {
        const selection = data as { objectIds?: string[], objects?: Array<{ objectId: string, displayName?: string }> }
        if (selection.objects && selection.objects.length > 0) {
          const firstObject = selection.objects[0]
          handleObjectPicked({ 
            objectId: firstObject.objectId, 
            displayName: firstObject.displayName 
          })
        }
      })

      // Handle loading errors
      human.on('human.error', (data: unknown) => {
        console.error('BioDigital error:', data)
        setError('Failed to load anatomy model')
        setIsLoading(false)
      })

    } catch (err) {
      console.error('Failed to initialize HumanAPI:', err)
      setError('Failed to initialize BioDigital viewer')
    }
  }, [])

  // Handle when an anatomical structure is clicked
  const handleObjectPicked = useCallback((event: ScenePickedEvent) => {
    if (!event.objectId && !event.displayName && !event.name) return

    const anatomyName = event.displayName || event.name || event.objectId || ''
    console.log('Anatomy picked:', anatomyName, event)

    setSelectedAnatomy(anatomyName)

    // Map the anatomical structure name to our body region
    const bodyRegion = mapAnatomyToBodyRegion(anatomyName)
    
    if (bodyRegion) {
      onSelectRegion(bodyRegion, anatomyName)
    }
  }, [onSelectRegion])

  // Load the HumanAPI script
  useEffect(() => {
    // Check if script already loaded
    if (window.HumanAPI) {
      return
    }

    const script = document.createElement('script')
    script.src = 'https://developer.biodigital.com/builds/api/human-api-3.0.0.min.js'
    script.async = true
    script.onload = () => {
      console.log('HumanAPI script loaded')
    }
    script.onerror = () => {
      setError('Failed to load BioDigital API script')
    }
    document.head.appendChild(script)

    return () => {
      // Cleanup script on unmount if needed
    }
  }, [])

  // Highlight region when prop changes
  useEffect(() => {
    if (!humanApiRef.current || !highlightedRegion) return

    // BioDigital uses specific object IDs - we'd need to maintain a mapping
    // For now, we just log - full implementation would use scene.select
    console.log('Highlight region:', highlightedRegion)
  }, [highlightedRegion])

  return (
    <div className="relative w-full h-full min-h-[320px]">
      {/* Loading overlay */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-100 z-10">
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-slate-600">Loading anatomy model...</p>
          </div>
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-100 z-10">
          <div className="flex flex-col items-center gap-3 p-4 text-center">
            <svg className="w-12 h-12 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <p className="text-sm text-slate-600">{error}</p>
            <p className="text-xs text-slate-400">Using fallback body model</p>
          </div>
        </div>
      )}

      {/* Selected anatomy info */}
      {selectedAnatomy && !error && (
        <div className="absolute top-2 left-2 bg-white/90 backdrop-blur-sm rounded-lg px-3 py-2 shadow-sm z-10">
          <p className="text-xs text-slate-500">Selected:</p>
          <p className="text-sm font-medium text-indigo-600">{selectedAnatomy}</p>
        </div>
      )}

      {/* BioDigital iframe */}
      <iframe
        id="biodigital-iframe"
        ref={iframeRef}
        src={widgetUrl}
        className="w-full h-full border-0"
        allow="fullscreen; xr-spatial-tracking"
        onLoad={initializeApi}
        title="BioDigital Human Anatomy"
      />
    </div>
  )
}

/**
 * Build the BioDigital widget URL with appropriate parameters
 */
function buildWidgetUrl(modelId: string, developerKey?: string): string {
  const baseUrl = 'https://human.biodigital.com/viewer/'
  const params = new URLSearchParams({
    m: modelId,
    // UI customization - hide default UI elements we don't need
    'ui-info': 'false',
    'ui-share': 'false', 
    'ui-tour': 'false',
    'ui-loader': 'circle',
    'ui-anatomy-descriptions': 'false',
    // Enable selection
    'ui-tools': 'true',
    // Background
    'background-color': 'f1f5f9', // Tailwind slate-100
  })

  // Add developer key if provided
  if (developerKey) {
    params.set('dk', developerKey)
  }

  return `${baseUrl}?${params.toString()}`
}

export default BioDigitalViewer
