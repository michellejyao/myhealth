import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { BodyViewer } from '../features/body-viewer/BodyViewer'
import BookModel from '../features/BookModel'
import { useAppStore } from '../store'

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
    <div className="w-screen h-[calc(100vh-64px)] px-8 py-8 box-border">
      {/* Shared background container */}
      <div className="flex h-full bg-slate-100 rounded-lg">
        
        {/* Left section */}
        <div className="w-1/2 flex items-center justify-center p-6">
            <BookModel
              projectName="Health Tracker"
            />
        </div>

        {/* Optional divider */}
        <div className="w-px bg-slate-200" />

        {/* Right section */}
        <div className="w-1/2 flex items-center justify-center p-6">
          <BodyViewer />
        </div>
      </div>
    </div>
  )
}
