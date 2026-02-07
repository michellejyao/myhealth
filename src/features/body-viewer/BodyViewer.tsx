import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { BodyModel } from './BodyModel'
import { useAppStore } from '../../store'
import { BODY_REGION_LABELS } from './bodyRegions'

/**
 * PR-01: 3D body viewer with camera controls.
 * Supports rotate (drag), zoom (scroll/pinch), and region selection.
 * Click empty space or use Clear button to deselect.
 */
export function BodyViewer() {
  const selectedBodyRegion = useAppStore((s) => s.selectedBodyRegion)
  const setSelectedBodyRegion = useAppStore((s) => s.setSelectedBodyRegion)

  const handleClearSelection = () => {
    setSelectedBodyRegion(null)
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Responsive container: taller on mobile, fixed on desktop */}
      <div className="h-[60vh] min-h-[320px] max-h-[520px] md:h-[480px] rounded-xl overflow-hidden border border-slate-200 bg-gradient-to-b from-slate-100 to-slate-200 touch-none">
        <Canvas
          camera={{ position: [0, 0, 4], fov: 45 }}
          onPointerMissed={handleClearSelection}
        >
          <ambientLight intensity={0.8} />
          <directionalLight position={[4, 4, 4]} intensity={1} />
          <BodyModel
            onSelectRegion={setSelectedBodyRegion}
            highlightedRegion={selectedBodyRegion}
          />
          <OrbitControls
            enablePan={false}
            enableZoom
            enableRotate
            minDistance={2}
            maxDistance={8}
            touches={{ ONE: 1, TWO: 2 }} // rotate with one finger, zoom with two
          />
        </Canvas>
      </div>

      {/* Selection info & clear button */}
      <div className="flex items-center justify-between px-1">
        <p className="text-sm text-slate-600">
          {selectedBodyRegion ? (
            <>
              Selected: <span className="font-medium text-indigo-600">{BODY_REGION_LABELS[selectedBodyRegion]}</span>
            </>
          ) : (
            <span className="text-slate-400">Tap a body region to log a symptom</span>
          )}
        </p>
        {selectedBodyRegion && (
          <button
            onClick={handleClearSelection}
            className="text-sm text-slate-500 hover:text-slate-700 underline"
          >
            Clear
          </button>
        )}
      </div>
    </div>
  )
}
