import { Suspense } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { BodyModel } from './BodyModel'
import { useAppStore } from '../../store'

/**
 * PR-01: 3D body viewer with GLB model and ~20 clickable regions.
 * PR-02: Click → region mapping via invisible proxy meshes.
 */
export function BodyViewer() {
  const selectedBodyRegion = useAppStore((s) => s.selectedBodyRegion)
  const setSelectedBodyRegion = useAppStore((s) => s.setSelectedBodyRegion)
  return (
    <div
      className="rounded-xl overflow-hidden border border-white/20 bg-white/5"
      style={{ width: '100%', height: 700 }}
    >
      <Canvas
        camera={{ position: [0, 1.2, 10], fov: 45 }}
        style={{ width: '100%', height: '100%' }}
        fallback={
          <div className="flex items-center justify-center w-full h-full text-white/70 text-sm bg-white/10">
            WebGL unavailable — 3D viewer cannot load
          </div>
        }
      >
        <ambientLight intensity={0.8} />
        <directionalLight position={[4, 4, 4]} intensity={1} />
        <Suspense
          fallback={
            <mesh>
              <boxGeometry args={[0.4, 0.4, 0.4]} />
              <meshStandardMaterial color="#13346c" />
            </mesh>
          }
        >
          <BodyModel
            onSelectRegion={setSelectedBodyRegion}
            highlightedRegion={selectedBodyRegion}
            yOffset={0}
            proxyScale={40}
            proxyZOffset={0.6}
          />
        </Suspense>
        <OrbitControls
          makeDefault
          enablePan={false}
          enableZoom
          enableRotate
          target={[0, 1, 0]}
          minDistance={1}
          maxDistance={3}
        />
      </Canvas>
    </div>
  )
}
