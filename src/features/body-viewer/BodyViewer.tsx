import { Suspense, useMemo, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, Html } from '@react-three/drei'
import { BodyModel } from './BodyModel'
import { useAppStore } from '../../store'
import { useHealthLogs } from '../../hooks/useHealthLogs'
import { BODY_REGIONS, type BodyRegionId as BodyRegionId20 } from '../../types'
import { type BodyRegionId as BodyRegionId9 } from './bodyRegions'

/**
 * PR-01: 3D body viewer with GLB model and ~20 clickable regions.
 * PR-02: Click → region mapping via invisible proxy meshes.
 */
export function BodyViewer() {
  const selectedBodyRegion = useAppStore((s) => s.selectedBodyRegion)
  const setSelectedBodyRegion = useAppStore((s) => s.setSelectedBodyRegion)
  const { logs } = useHealthLogs()

  const normalizeRegionId = (value: string): string => {
    return value
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '')
  }

  const expandToDetailed = (region: string): BodyRegionId20[] => {
    const normalized = normalizeRegionId(region)
    if ((BODY_REGIONS as readonly string[]).includes(normalized)) {
      return [normalized as BodyRegionId20]
    }
    const map: Record<BodyRegionId9, BodyRegionId20[]> = {
      head: ['head'],
      neck: ['neck'],
      chest: ['chest'],
      back: ['back'],
      abdomen: ['abdomen'],
      left_arm: ['left_shoulder', 'left_upper_arm', 'left_forearm', 'left_hand'],
      right_arm: ['right_shoulder', 'right_upper_arm', 'right_forearm', 'right_hand'],
      left_leg: ['left_upper_leg', 'left_lower_leg', 'left_foot'],
      right_leg: ['right_upper_leg', 'right_lower_leg', 'right_foot'],
    }
    return map[normalized as BodyRegionId9] ?? []
  }

  const heatmapRegionCounts = useMemo(() => {
    const counts: Partial<Record<BodyRegionId20, number>> = {}

    for (const log of logs) {
      const severityWeight =
        typeof log.severity === 'number'
          ? Math.pow(Math.max(0, Math.min(1, (log.severity - 1) / 9)), 0.5)
          : 1
      const regions = new Set<BodyRegionId20>()
      if (log.body_region) {
        for (const r of expandToDetailed(log.body_region)) regions.add(r)
      }
      if (Array.isArray(log.body_parts)) {
        for (const part of log.body_parts) {
          for (const r of expandToDetailed(part)) regions.add(r)
        }
      }

      for (const region of regions) {
        counts[region] = (counts[region] ?? 0) + severityWeight
      }
    }

    return counts
  }, [logs])

  const highlightedHeatmapRegion = selectedBodyRegion

  const [lowIntensityBlend, setLowIntensityBlend] = useState(0)
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
        <ambientLight intensity={1.1} />
        <directionalLight position={[4, 4, 4]} intensity={0.8} />
        <directionalLight position={[-4, 4, -4]} intensity={0.8} />
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
            heatmapRegionCounts={heatmapRegionCounts}
            highlightedHeatmapRegion={highlightedHeatmapRegion}
            lowIntensityBlend={lowIntensityBlend}
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
        <Html fullscreen>
          <div
            style={{
              position: 'absolute',
              top: 12,
              right: 12,
              padding: '6px 8px',
              background: 'rgba(15, 23, 42, 0.75)',
              color: '#e2e8f0',
              border: '1px solid rgba(148, 163, 184, 0.35)',
              borderRadius: 6,
              fontSize: 11,
              lineHeight: 1.4,
              fontFamily:
                'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
            }}
          >
            <div>Logs: {logs.length}</div>
            <div>
              Regions with counts:{' '}
              {Object.values(heatmapRegionCounts).filter((v) => (v ?? 0) > 0).length}
            </div>
          </div>
        </Html>
        <Html fullscreen>
          <div
            style={{
              position: 'absolute',
              top: 12,
              left: 12,
              padding: '10px 12px',
              background: 'rgba(15, 23, 42, 0.75)',
              color: '#e2e8f0',
              border: '1px solid rgba(148, 163, 184, 0.35)',
              borderRadius: 8,
              fontSize: 12,
              lineHeight: 1.4,
              width: 220,
              zIndex: 10,
              fontFamily:
                'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
            }}
          >
            <div style={{ fontWeight: 600, marginBottom: 6 }}>Low Intensity Color</div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <span>Neutral</span>
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={lowIntensityBlend}
                onChange={(e) => setLowIntensityBlend(Number(e.target.value))}
                style={{ flex: 1 }}
              />
              <span>Green</span>
            </div>
          </div>
        </Html>
      </Canvas>
    </div>
  )
}
