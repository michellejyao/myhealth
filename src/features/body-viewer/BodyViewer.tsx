import { Suspense, useMemo, useState, useRef } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, Html } from '@react-three/drei'
import { BodyModel } from './BodyModel'
import { useAppStore } from '../../store'
import { useHealthLogs } from '../../hooks/useHealthLogs'
import { BODY_REGIONS, PAIN_TYPES, type BodyRegionId as BodyRegionId20, type PainType } from '../../types'
import { type BodyRegionId as BodyRegionId9 } from './bodyRegions'

/**
 * PR-01: 3D body viewer with GLB model and ~20 clickable regions.
 * PR-02: Click → region mapping via invisible proxy meshes.
 */
export function BodyViewer() {
  const selectedBodyRegion = useAppStore((s) => s.selectedBodyRegion)
  const setSelectedBodyRegion = useAppStore((s) => s.setSelectedBodyRegion)
  const { logs } = useHealthLogs()

  const mapDetailedToBroad = (region: string): BodyRegionId9 | null => {
    if (region === 'head') return 'head'
    if (region === 'neck') return 'neck'
    if (region === 'chest') return 'chest'
    if (region === 'back') return 'back'
    if (region === 'abdomen') return 'abdomen'
    if (region.startsWith('left_')) {
      if (region.includes('leg') || region.includes('foot')) return 'left_leg'
      return 'left_arm'
    }
    if (region.startsWith('right_')) {
      if (region.includes('leg') || region.includes('foot')) return 'right_leg'
      return 'right_arm'
    }
    return null
  }

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

  const [selectedDay, setSelectedDay] = useState(() => {
    const now = new Date()
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset())
    return now.toISOString().slice(0, 10)
  })

  const painTypeColors: Record<PainType, string> = {
    sharp: '#e11d48',
    dull: '#f97316',
    throbbing: '#db2777',
    burning: '#dc2626',
    aching: '#f59e0b',
    numbness: '#475569',
    tingling: '#06b6d4',
    stiffness: '#eab308',
    other: '#dc2626',
  }

  const normalizePainType = (value: string): PainType => {
    const normalized = value
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '')
    if ((PAIN_TYPES as readonly string[]).includes(normalized)) {
      return normalized as PainType
    }
    return 'other'
  }

  const heatmapRegionCounts = useMemo(() => {
    const counts: Partial<Record<BodyRegionId20, number>> = {}
    const selectedMs = selectedDay ? Date.parse(`${selectedDay}T00:00:00`) : Date.now()
    const WINDOW_MS = 1000 * 60 * 60 * 24 * 7 // 7 days window centered on selected day

    for (const log of logs) {
      const logMs = log.date ? Date.parse(log.date) : NaN
      if (!Number.isFinite(logMs)) continue
      const dt = Math.abs(logMs - selectedMs)
      if (dt > WINDOW_MS) continue
      const timeWeight = 1 - dt / WINDOW_MS
      const severityWeight =
        typeof log.severity === 'number'
          ? Math.pow(Math.max(0, Math.min(1, log.severity / 10)), 0.6)
          : 1
      const weight = timeWeight * severityWeight

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
        counts[region] = (counts[region] ?? 0) + weight
      }
    }

    return counts
  }, [logs, selectedDay])

  const clickableRegions = useMemo(() => {
    const set = new Set<BodyRegionId20>()
    for (const [region, count] of Object.entries(heatmapRegionCounts)) {
      if ((count ?? 0) > 0) set.add(region as BodyRegionId20)
    }
    return set
  }, [heatmapRegionCounts])

  const heatmapRegionColors = useMemo(() => {
    const colors: Partial<Record<BodyRegionId20, string>> = {}
    const maxSeverity: Partial<Record<BodyRegionId20, number>> = {}
    const selectedMs = selectedDay ? Date.parse(`${selectedDay}T00:00:00`) : Date.now()
    const WINDOW_MS = 1000 * 60 * 60 * 24 * 7

    for (const log of logs) {
      const logMs = log.date ? Date.parse(log.date) : NaN
      if (!Number.isFinite(logMs)) continue
      const dt = Math.abs(logMs - selectedMs)
      if (dt > WINDOW_MS) continue

      const severity = typeof log.severity === 'number' ? log.severity : 0
      const painType =
        typeof log.pain_type === 'string' ? normalizePainType(log.pain_type) : 'other'

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
        if ((maxSeverity[region] ?? -1) < severity) {
          maxSeverity[region] = severity
          colors[region] = painTypeColors[painType] ?? painTypeColors.other
        }
      }
    }

    return colors
  }, [logs, selectedDay])

  const highlightedHeatmapRegion = selectedBodyRegion

  const [lowIntensityBlend, setLowIntensityBlend] = useState(0)
  const controlsRef = useRef<any>(null)

  const recenterCamera = () => {
    const controls = controlsRef.current
    if (!controls) return
    const camera = controls.object
    camera.position.set(0, 1.2, 10)
    controls.target.set(0, 1, 0)
    controls.update()
  }
  const painTypeLegend: Array<{ type: PainType; label: string; color: string }> = [
    { type: 'sharp', label: 'Sharp', color: '#e11d48' },
    { type: 'dull', label: 'Dull', color: '#f97316' },
    { type: 'throbbing', label: 'Throbbing', color: '#db2777' },
    { type: 'burning', label: 'Burning', color: '#dc2626' },
    { type: 'aching', label: 'Aching', color: '#f59e0b' },
    { type: 'numbness', label: 'Numbness', color: '#475569' },
    { type: 'tingling', label: 'Tingling', color: '#06b6d4' },
    { type: 'stiffness', label: 'Stiffness', color: '#eab308' },
    { type: 'other', label: 'Other', color: '#dc2626' },
  ]
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
            heatmapRegionColors={heatmapRegionColors}
            highlightedHeatmapRegion={highlightedHeatmapRegion}
            lowIntensityBlend={lowIntensityBlend}
            clickableRegions={clickableRegions}
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
          ref={controlsRef}
        />
        <Html fullscreen>
          <div
            style={{
              position: 'absolute',
              top: 12,
              right: 12,
              padding: '8px 10px',
              width: 300,
              maxWidth: 'calc(100vw - 32px)',
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
            <div style={{ fontWeight: 600, marginBottom: 6 }}>Heatmap Legend</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span>Low</span>
              <span
                style={{
                  width: 70,
                  height: 8,
                  borderRadius: 999,
                  background: 'linear-gradient(90deg, rgba(226,232,240,0.2), rgba(226,232,240,1))',
                  border: '1px solid rgba(148,163,184,0.4)',
                }}
              />
              <span>High</span>
            </div>
            <div style={{ marginTop: 6, color: '#cbd5f5' }}>
              Logs: {logs.length} • Regions:{' '}
              {Object.values(heatmapRegionCounts).filter((v) => (v ?? 0) > 0).length}
            </div>
            <div style={{ marginTop: 8, fontWeight: 600 }}>Pain Types</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 6 }}>
              {painTypeLegend.map((item) => (
                <span
                  key={item.type}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '4px 6px',
                    borderRadius: 6,
                    background: 'rgba(15, 23, 42, 0.4)',
                    border: '1px solid rgba(148, 163, 184, 0.2)',
                  }}
                >
                  <span
                    style={{
                      width: 10,
                      height: 10,
                      borderRadius: 3,
                      background: item.color,
                    }}
                  />
                  {item.label}
                </span>
              ))}
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
              width: 300,
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
            <div style={{ marginTop: 10, fontWeight: 600 }}>Day View</div>
            <input
              type="date"
              value={selectedDay}
              onChange={(e) => setSelectedDay(e.target.value)}
              className="date-input"
              style={{
                marginTop: 6,
                width: '100%',
                padding: '6px 8px',
                borderRadius: 6,
                border: '1px solid rgba(148, 163, 184, 0.4)',
                background: 'rgba(15, 23, 42, 0.4)',
                color: '#e2e8f0',
              }}
            />
            <button
              type="button"
              onClick={recenterCamera}
              style={{
                marginTop: 10,
                width: '100%',
                padding: '6px 10px',
                borderRadius: 6,
                border: '1px solid rgba(148, 163, 184, 0.4)',
                background: 'rgba(15, 23, 42, 0.6)',
                color: '#e2e8f0',
                fontWeight: 600,
              }}
            >
              Recenter Camera
            </button>
          </div>
        </Html>
      </Canvas>
    </div>
  )
}
