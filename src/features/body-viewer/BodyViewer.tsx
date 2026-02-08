import { Suspense, useMemo, useState, useRef, useEffect } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { BodyModel } from './BodyModel'
import { useAppStore } from '../../store'
import { useHealthLogs } from '../../hooks/useHealthLogs'
import {
  BODY_REGIONS,
  BODY_REGION_LABELS,
  PAIN_TYPES,
  type BodyRegionId as BodyRegionId20,
  type PainType,
} from '../../types'
import { type BodyRegionId as BodyRegionId9 } from './bodyRegions'
import { useAuth0 } from '@auth0/auth0-react'
import { healthProfileService, formatHeight, formatWeight } from '../../services/healthProfileService'
import type { HealthProfile } from '../../types'

/**
 * PR-01: 3D body viewer with GLB model and ~20 clickable regions.
 * PR-02: Click → region mapping via invisible proxy meshes.
 */
export function BodyViewer() {
  const selectedBodyRegion = useAppStore((s) => s.selectedBodyRegion)
  const setSelectedBodyRegion = useAppStore((s) => s.setSelectedBodyRegion)
  const { logs } = useHealthLogs()
  const { user } = useAuth0()
  const [profile, setProfile] = useState<HealthProfile | null>(null)
  const [profileError, setProfileError] = useState<string | null>(null)

  useEffect(() => {
    let isActive = true
    const loadProfile = async () => {
      if (!user?.sub) return
      try {
        const data = await healthProfileService.getProfile(user.sub)
        if (isActive) {
          setProfile(data)
          setProfileError(null)
        }
      } catch (err) {
        if (isActive) {
          setProfileError(err instanceof Error ? err.message : 'Failed to load profile')
        }
      }
    }
    loadProfile()
    return () => {
      isActive = false
    }
  }, [user?.sub])

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
  const [selectedMs, setSelectedMs] = useState<number>(() => Date.now())

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
    const centerMs = Number.isFinite(selectedMs) ? selectedMs : Date.now()
    const WINDOW_MS = 1000 * 60 * 60 * 24 * 7 // 7 days window centered on selected day

    for (const log of logs) {
      const logMs = log.date ? Date.parse(log.date) : NaN
      if (!Number.isFinite(logMs)) continue
      const dt = Math.abs(logMs - centerMs)
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
  }, [logs, selectedMs])


  const heatmapRegionColors = useMemo(() => {
    const colors: Partial<Record<BodyRegionId20, string>> = {}
    const maxSeverity: Partial<Record<BodyRegionId20, number>> = {}
    const centerMs = Number.isFinite(selectedMs) ? selectedMs : Date.now()
    const WINDOW_MS = 1000 * 60 * 60 * 24 * 7

    for (const log of logs) {
      const logMs = log.date ? Date.parse(log.date) : NaN
      if (!Number.isFinite(logMs)) continue
      const dt = Math.abs(logMs - centerMs)
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
  }, [logs, selectedMs])

  const timeline = useMemo(() => {
    const times = logs
      .map((log) => (log.date ? Date.parse(log.date) : NaN))
      .filter((t) => Number.isFinite(t)) as number[]
    if (times.length === 0) {
      const now = Date.now()
      return { min: now - 1000 * 60 * 60 * 24 * 7, max: now, step: 1000 * 60 * 30 }
    }
    const min = Math.min(...times)
    const max = Math.max(...times)
    const step = 1000 * 60 * 30
    return { min, max, step }
  }, [logs])

  const filteredLogCount = useMemo(() => {
    const WINDOW_MS = 1000 * 60 * 60 * 24 * 7
    const centerMs = Number.isFinite(selectedMs) ? selectedMs : Date.now()
    return logs.filter((log) => {
      const logMs = log.date ? Date.parse(log.date) : NaN
      if (!Number.isFinite(logMs)) return false
      return Math.abs(logMs - centerMs) <= WINDOW_MS
    }).length
  }, [logs, selectedMs])

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

  const severityTrend = useMemo(() => {
    if (!selectedBodyRegion) return []
    const entries: Array<{ dateMs: number; severity: number }> = []
    for (const log of logs) {
      const logMs = log.date ? Date.parse(log.date) : NaN
      if (!Number.isFinite(logMs)) continue
      const severityValue =
        typeof log.severity === 'number' ? log.severity : Number(log.severity)
      if (!Number.isFinite(severityValue)) continue
      const regions = new Set<BodyRegionId20>()
      if (log.body_region) {
        for (const r of expandToDetailed(log.body_region)) regions.add(r)
      }
      if (Array.isArray(log.body_parts)) {
        for (const part of log.body_parts) {
          for (const r of expandToDetailed(part)) regions.add(r)
        }
      }
      if (regions.has(selectedBodyRegion)) {
        entries.push({ dateMs: logMs, severity: severityValue })
      }
    }
    return entries.sort((a, b) => a.dateMs - b.dateMs)
  }, [logs, selectedBodyRegion])
  return (
    <div className="flex flex-col lg:flex-row gap-4 items-stretch">
      <div className="w-full lg:w-60 space-y-4 h-[580px] overflow-y-auto">
        <div className="rounded-xl border border-white/20 bg-white/5 p-4 text-white/90">
          <div className="text-sm font-semibold mb-3">User Profile</div>
          <div className="space-y-1 text-sm text-white/80">
            <div>Name: {user?.name || '—'}</div>
            <div>
              Height:{' '}
              {profile?.height && profile.height_unit
                ? formatHeight(profile.height, profile.height_unit)
                : '—'}
            </div>
            <div>
              Weight:{' '}
              {profile?.weight && profile.weight_unit
                ? formatWeight(profile.weight, profile.weight_unit)
                : '—'}
            </div>
            <div>
              DOB:{' '}
              {profile?.date_of_birth ? new Date(profile.date_of_birth).toLocaleDateString() : '—'}
            </div>
            <div>Blood Type: {profile?.blood_type || '—'}</div>
            <div>
              Chronic:{' '}
              {profile?.chronic_conditions && profile.chronic_conditions.length > 0
                ? profile.chronic_conditions.join(', ')
                : '—'}
            </div>
            <div>
              Meds:{' '}
              {profile?.medications && profile.medications.length > 0
                ? profile.medications.join(', ')
                : '—'}
            </div>
            {profileError && <div className="text-red-300 mt-2">{profileError}</div>}
          </div>
        </div>
        <div className="rounded-xl border border-white/20 bg-white/5 p-2 text-white/90">
          <div className="text-sm font-semibold mb-3">Severity Over Time</div>
          <div className="text-xs text-white/50 mb-2">
            Selected: {selectedBodyRegion ?? '—'} • Points: {severityTrend.length}
          </div>
          <select
            value={selectedBodyRegion ?? ''}
            onChange={(e) =>
              setSelectedBodyRegion(e.target.value ? (e.target.value as BodyRegionId20) : null)
            }
            className="w-full rounded-lg border border-white/20 bg-white/5 px-2 py-1 text-sm text-white/90 mb-3"
          >
            <option value="">Select a body region</option>
            {BODY_REGIONS.map((region) => (
              <option key={region} value={region}>
                {BODY_REGION_LABELS[region] ?? region}
              </option>
            ))}
          </select>
          <div>
            <div className="text-xs text-white/60 mb-2">
              {selectedBodyRegion
                ? BODY_REGION_LABELS[selectedBodyRegion] ?? selectedBodyRegion
                : 'Select a body region'}
            </div>
            <svg viewBox="0 0 320 140" className="w-full h-48" style={{ pointerEvents: 'none' }}>
              <defs>
                <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="rgba(125, 211, 252, 0.35)" />
                  <stop offset="100%" stopColor="rgba(125, 211, 252, 0)" />
                </linearGradient>
              </defs>
              {(() => {
                const padLeft = 28
                const padRight = 6
                const padTop = 6
                const padBottom = 18
                const width = 320 - padLeft - padRight
                const height = 140 - padTop - padBottom
                const minY = 0
                const maxY = 10
                const axis = (
                  <>
                    <line
                      x1={padLeft}
                      y1={padTop + height}
                      x2={padLeft + width}
                      y2={padTop + height}
                      stroke="rgba(226,232,240,0.25)"
                      strokeWidth="1"
                    />
                    <line
                      x1={padLeft}
                      y1={padTop}
                      x2={padLeft}
                      y2={padTop + height}
                      stroke="rgba(226,232,240,0.25)"
                      strokeWidth="1"
                    />
                    <text x={2} y={padTop + 6} fill="rgba(226,232,240,0.6)" fontSize="8">
                      10
                    </text>
                    <text x={6} y={padTop + height} fill="rgba(226,232,240,0.6)" fontSize="8">
                      0
                    </text>
                  </>
                )
                if (!selectedBodyRegion || severityTrend.length === 0) {
                  return axis
                }
                const times = severityTrend.map((d) => d.dateMs)
                const minX = Math.min(...times)
                const maxX = Math.max(...times)
                const toX = (t: number) =>
                  padLeft + (maxX === minX ? 0 : ((t - minX) / (maxX - minX)) * width)
                const toY = (v: number) =>
                  padTop + (1 - (v - minY) / (maxY - minY)) * height
                const points = severityTrend
                  .map((d) => `${toX(d.dateMs)},${toY(d.severity)}`)
                  .join(' ')
                const areaPoints = `${points} ${padLeft + width},${padTop + height} ${padLeft},${padTop + height}`
                const startLabel = new Date(minX).toLocaleDateString()
                const endLabel = new Date(maxX).toLocaleDateString()
                return (
                  <>
                    {axis}
                    <polyline
                      points={points}
                      fill="none"
                      stroke="#7dd3fc"
                      strokeWidth="2"
                      strokeLinejoin="round"
                      strokeLinecap="round"
                    />
                    <polygon points={areaPoints} fill="url(#trendFill)" />
                    {severityTrend.map((d, i) => (
                      <circle
                        key={`pt-${i}`}
                        cx={toX(d.dateMs)}
                        cy={toY(d.severity)}
                        r="2.5"
                        fill="#bae6fd"
                      />
                    ))}
                    <text
                      x={padLeft}
                      y={padTop + height + 12}
                      fill="rgba(226,232,240,0.6)"
                      fontSize="8"
                    >
                      {startLabel}
                    </text>
                    <text
                      x={padLeft + width}
                      y={padTop + height + 12}
                      fill="rgba(226,232,240,0.6)"
                      fontSize="8"
                      textAnchor="end"
                    >
                      {endLabel}
                    </text>
                  </>
                )
              })()}
            </svg>
          </div>
        </div>
      </div>
      <div
        className="rounded-xl overflow-hidden border border-white/20 bg-white/5 flex-[6] h-[580px]"
        style={{ width: '100%' }}
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
            proxyScale={45}
            proxyZOffset={0}
            heatmapRegionCounts={heatmapRegionCounts}
            heatmapRegionColors={heatmapRegionColors}
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
          ref={controlsRef}
        />
        </Canvas>
      </div>
      <div className="w-full lg:w-80 space-y-4 h-[580px] overflow-y-auto">
        <div className="rounded-xl border border-white/20 bg-white/5 p-4 text-white/90">
          <div className="text-sm font-semibold mb-3">Controls</div>
          <div className="text-sm mb-2">Low Intensity Color</div>
          <div className="flex items-center gap-2 text-xs text-white/70">
            <span>Neutral</span>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={lowIntensityBlend}
              onChange={(e) => setLowIntensityBlend(Number(e.target.value))}
              className="flex-1"
            />
            <span>Green</span>
          </div>
          <div className="text-sm mt-4">Day View</div>
          <input
            type="date"
            value={selectedDay}
            onChange={(e) => {
              const next = e.target.value
              setSelectedDay(next)
              const nextMs = Date.parse(`${next}T00:00:00`)
              if (Number.isFinite(nextMs)) setSelectedMs(nextMs)
            }}
            className="date-input mt-2 w-full rounded-lg border border-white/20 bg-white/5 px-2 py-1 text-white/90"
          />
          <div className="text-sm mt-4">Playback Timeline</div>
          <div className="text-xs text-white/60 mt-1">
            {new Date(selectedMs).toLocaleString()} • Logs: {filteredLogCount}
          </div>
          <input
            type="range"
            min={timeline.min}
            max={timeline.max}
            step={timeline.step}
            value={selectedMs}
            onChange={(e) => setSelectedMs(Number(e.target.value))}
            className="w-full mt-2"
          />
          <button
            type="button"
            onClick={recenterCamera}
            className="mt-3 w-full rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-sm font-semibold text-white/90"
          >
            Recenter Camera
          </button>
        </div>
        <div className="rounded-xl border border-white/20 bg-white/5 p-4 text-white/90">
          <div className="text-sm font-semibold mb-3">Heatmap Legend</div>
          <div className="flex items-center gap-2 text-xs">
            <span>Low</span>
            <span className="h-2 w-20 rounded-full border border-white/20 bg-gradient-to-r from-white/20 to-white" />
            <span>High</span>
          </div>
          <div className="mt-2 text-xs text-white/60">
            Logs: {logs.length} • Regions:{' '}
            {Object.values(heatmapRegionCounts).filter((v) => (v ?? 0) > 0).length}
          </div>
          <div className="mt-3 text-xs font-semibold">Pain Types</div>
          <div className="mt-2 flex flex-wrap gap-2">
            {painTypeLegend.map((item) => (
              <span
                key={item.type}
                className="inline-flex items-center gap-2 rounded-md border border-white/10 bg-white/5 px-2 py-1 text-xs"
              >
                <span
                  className="h-2.5 w-2.5 rounded-sm"
                  style={{ background: item.color }}
                />
                {item.label}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
