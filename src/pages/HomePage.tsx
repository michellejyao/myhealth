import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { BodyViewer } from '../features/body-viewer/BodyViewer'
import { useAppStore } from '../store'

/**
 * PR-01: Body view; selecting a region opens New Log flow.
 */
export function HomePage() {
  const selectedBodyRegion = useAppStore((s) => s.selectedBodyRegion)
  const setSelectedBodyRegion = useAppStore((s) => s.setSelectedBodyRegion)
  const navigate = useNavigate()

  useEffect(() => {
    if (selectedBodyRegion) {
      navigate('/logs/new', { state: { bodyRegion: selectedBodyRegion } })
      setSelectedBodyRegion(null)
    }
  }, [selectedBodyRegion, navigate, setSelectedBodyRegion])

  return (
    <div>
      <h1 className="text-xl font-semibold text-slate-800 mb-4">Body Viewer</h1>
      <BodyViewer />
    </div>
  )
}
