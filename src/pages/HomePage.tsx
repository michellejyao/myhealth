import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { BodyViewer } from '../features/body-viewer/BodyViewer'
import BookModel from '../features/BookModel'
import { useAppStore } from '../store'
import { PageContainer } from '../components/PageContainer'

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
    <PageContainer fullWidth>
      <div className="h-[calc(100vh-80px)] px-8 py-6">
        {/* Header */}
        <div className="mb-4">
          <h1 className="text-2xl font-bold text-slate-900">Body Viewer</h1>
          <p className="text-slate-600 mt-1">Click on a body region to log symptoms</p>
        </div>

        {/* Shared background container */}
        <div className="flex h-[calc(100%-64px)] bg-white rounded-xl shadow-sm border border-slate-200">
          
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
    </PageContainer>
  )
}
