import { useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { BodyModel } from './BodyModel'
import { BioDigitalViewer } from './BioDigitalViewer'
import { useAppStore } from '../../store'

/**
 * PR-01: 3D body viewer placeholder with camera controls.
 * PR-02: Click → region mapping will be added via raycast in BodyModel.
 */
export function BodyViewer() {
  const selectedBodyRegion = useAppStore((s) => s.selectedBodyRegion)
  const setSelectedBodyRegion = useAppStore((s) => s.setSelectedBodyRegion)
  const [viewerMode, setViewerMode] = useState<ViewerMode>('biodigital')
  const [selectedAnatomy, setSelectedAnatomy] = useState<string | null>(null)

  return (
    <div className="h-[480px] rounded-xl overflow-hidden border border-slate-200 bg-slate-100">
      <Canvas camera={{ position: [0, 0, 4], fov: 45 }}>
        <ambientLight intensity={0.8} />
        <directionalLight position={[4, 4, 4]} intensity={1} />
        <BodyModel
          onSelectRegion={setSelectedBodyRegion}
          highlightedRegion={selectedBodyRegion}
        />
        <OrbitControls enablePan enableZoom enableRotate />
      </Canvas>
    </div>
  )
}
