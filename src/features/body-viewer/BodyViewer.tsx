import { Suspense, useEffect, useRef } from 'react'
import { Canvas, useThree } from '@react-three/fiber'
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
  const showDebug =
    typeof window !== 'undefined' &&
    new URLSearchParams(window.location.search).has('debug3d')
  const controlsRef = useRef<OrbitControls | null>(null)

  return (
    <div
      className="rounded-xl overflow-hidden border border-slate-200 bg-slate-100"
      style={{ width: '100%', height: 480 }}
    >
      <Canvas
        camera={{ position: [0, 5, 0], fov: 35 }}
        style={{ width: '100%', height: '100%' }}
        fallback={
          <div className="flex items-center justify-center w-full h-full text-slate-600 text-sm bg-slate-200">
            WebGL unavailable — 3D viewer cannot load
          </div>
        }
      >
        <ambientLight intensity={0.8} />
        <directionalLight position={[4, 4, 4]} intensity={1} />
        {showDebug && (
          <>
            <axesHelper args={[1]} />
            <gridHelper args={[4, 8, '#94a3b8', '#cbd5f5']} />
            <mesh>
              <sphereGeometry args={[0.05, 16, 16]} />
              <meshStandardMaterial color="#facc15" />
            </mesh>
          </>
        )}
        <Suspense
          fallback={
            <mesh>
              <boxGeometry args={[0.4, 0.4, 0.4]} />
              <meshStandardMaterial color="#94a3b8" />
            </mesh>
          }
        >
          {showDebug && <DebugCameraRig controlsRef={controlsRef} />}
          <BodyModel
            onSelectRegion={setSelectedBodyRegion}
            highlightedRegion={selectedBodyRegion}
            scaleMultiplier={showDebug ? 1 : 0.7}
            targetHeight={showDebug ? 0.05 : 1}
            yOffset={showDebug ? -0.6 : -0.3}
          />
        </Suspense>
        <OrbitControls
          makeDefault
          enablePan={!showDebug}
          enableZoom
          enableRotate
          target={showDebug ? [0, 0, 0] : undefined}
          minDistance={showDebug ? 1.5 : undefined}
          maxDistance={showDebug ? 6 : undefined}
          minPolarAngle={showDebug ? Math.PI * 0.08 : undefined}
          maxPolarAngle={showDebug ? Math.PI * 0.92 : undefined}
          ref={controlsRef}
        />
      </Canvas>
    </div>
  )
}

function DebugCameraRig({
  controlsRef,
}: {
  controlsRef: React.MutableRefObject<OrbitControls | null>
}) {
  const { camera } = useThree()

  useEffect(() => {
    camera.position.set(0, 0, 3)
    camera.lookAt(0, 0, 0)
    if (controlsRef.current) {
      controlsRef.current.target.set(0, 0, 0)
      controlsRef.current.update()
    }
  }, [camera, controlsRef])

  return null
}
