import { useEffect, useRef, useCallback, useState } from 'react'

interface AvatarCreatorProps {
  /** Called when user completes avatar creation with the GLB URL. */
  onAvatarCreated: (url: string) => void
  /** Called when user closes the creator without saving. */
  onClose: () => void
  /** Optional subdomain (default: 'demo'). Get your own at readyplayer.me */
  subdomain?: string
  /** Body type: 'fullbody' (default) or 'halfbody' */
  bodyType?: 'fullbody' | 'halfbody'
  /** Quick start mode - simpler creation flow */
  quickStart?: boolean
}

interface ReadyPlayerMeEvent {
  source: string
  eventName: string
  data?: {
    url?: string
    id?: string
  }
}

/**
 * Ready Player Me Avatar Creator iframe component.
 * Allows users to create a custom 3D avatar that can be used in the body viewer.
 * 
 * Note: Ready Player Me doesn't provide a built-in "medical" or "minimal clothing" mode.
 * For medical use cases, consider:
 * - Using Studio (studio.readyplayer.me) to create a custom subdomain with limited assets
 * - Post-processing avatars to apply neutral clothing/skin via REST API
 * - Creating a custom base avatar template
 * 
 * @see https://docs.readyplayer.me/ready-player-me/integration-guides/web
 */
export function AvatarCreator({ 
  onAvatarCreated, 
  onClose, 
  subdomain = 'demo',
  bodyType = 'fullbody',
  quickStart = false 
}: AvatarCreatorProps) {
  const frameRef = useRef<HTMLIFrameElement>(null)
  const [isLoading, setIsLoading] = useState(true)

  const handleMessage = useCallback(
    (event: MessageEvent) => {
      let json: ReadyPlayerMeEvent | null = null
      
      try {
        json = JSON.parse(event.data)
      } catch {
        return // Not a JSON message, ignore
      }

      if (json?.source !== 'readyplayerme') {
        return
      }

      // Subscribe to all events when frame is ready
      if (json.eventName === 'v1.frame.ready') {
        setIsLoading(false)
        frameRef.current?.contentWindow?.postMessage(
          JSON.stringify({
            target: 'readyplayerme',
            type: 'subscribe',
            eventName: 'v1.**',
          }),
          '*'
        )
      }

      // Avatar export completed - get the GLB URL
      if (json.eventName === 'v1.avatar.exported' && json.data?.url) {
        // Build avatar URL with parameters for medical use:
        // - morphTargets: for facial expressions
        // - textureAtlas: single texture for performance
        // - lod: level of detail (1 = medium quality)
        // Note: clothing cannot be removed via URL parameters
        const params = new URLSearchParams({
          morphTargets: 'ARKit',
          textureAtlas: '1024',
          lod: '1',
        })
        const avatarUrl = `${json.data.url}?${params.toString()}`
        onAvatarCreated(avatarUrl)
      }
    },
    [onAvatarCreated]
  )

  useEffect(() => {
    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [handleMessage])

  // Build iframe URL with configuration for medical context
  const params = new URLSearchParams({
    frameApi: 'true',
    clearCache: 'true',
    bodyType: bodyType,
  })
  
  if (quickStart) {
    params.append('quickStart', 'true')
  }

  const iframeSrc = `https://${subdomain}.readyplayer.me/avatar?${params.toString()}`

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl h-[85vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-black/10">
          <div>
            <h2 className="font-semibold text-black">Create Your Avatar</h2>
            <p className="text-sm text-black/70">Customize your 3D body model</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-black/5 rounded-lg transition-colors"
            aria-label="Close"
          >
            <svg className="w-5 h-5 text-black/70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Iframe container */}
        <div className="flex-1 relative">
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-white">
              <div className="flex flex-col items-center gap-3">
                <div className="w-10 h-10 border-4 border-brand/30 border-t-accent rounded-full animate-spin" />
                <p className="text-sm text-black/80">Loading avatar creator...</p>
              </div>
            </div>
          )}
          <iframe
            ref={frameRef}
            src={iframeSrc}
            allow="camera *; microphone *; clipboard-write"
            className="w-full h-full border-0"
            title="Ready Player Me Avatar Creator"
          />
        </div>

        {/* Footer with info */}
        <div className="px-4 py-3 border-t border-black/10 bg-white">
          <p className="text-xs text-black/70 text-center mb-2">
            Powered by Ready Player Me. Your avatar will be used in the body viewer for symptom logging.
          </p>
          <details className="text-xs text-black/70">
            <summary className="cursor-pointer hover:text-black text-center">
              Want minimal clothing for medical use?
            </summary>
            <div className="mt-2 p-2 bg-white rounded border border-black/10 text-left">
              <p className="mb-2">
                <strong>Options for medical-appropriate avatars:</strong>
              </p>
              <ol className="list-decimal ml-4 space-y-1">
                <li>Create custom subdomain at <a href="https://studio.readyplayer.me" target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">studio.readyplayer.me</a> to limit clothing options</li>
                <li>Choose simple, neutral clothing during creation (t-shirt, plain pants)</li>
                <li>Alternative: Use anatomical 3D models from medical sources (e.g., BioDigital, Visible Body)</li>
              </ol>
            </div>
          </details>
        </div>
      </div>
    </div>
  )
}
