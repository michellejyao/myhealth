import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { BodyViewer } from '../features/body-viewer/BodyViewer'
import BookModel from '../features/book/BookModel'
import { useAppStore } from '../store'
import { PageContainer } from '../components/PageContainer'

function Page1() {
  return <div style={{ padding: 20 }}>📄 This is page 1 content!</div>;
}

function Page2() {
  return <div style={{ padding: 20 }}>📄 Page 2 content, maybe some images!</div>;
}

function Page3() {
  return <div style={{ padding: 20 }}>📄 Page 3 content, maybe some images!</div>;
}


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
      {/* Full height wrapper */}
      <div className="flex flex-col min-h-screen px-8 py-6">
        
        {/* Header (optional) */}
        {/* <div className="mb-4">
          <h1 className="text-2xl font-bold text-slate-900">Body Viewer</h1>
          <p className="text-slate-600 mt-1">Click on a body region to log symptoms</p>
        </div> */}

        {/* Main content flex */}
        <div className="flex flex-1 bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          
          {/* Left section */}
          <div className="w-1/2 flex items-center justify-center p-6">
            <BookModel projectName="Health Tracker" bookmarks={[
    { label: 'Records', component: <Page1 /> },
    { label: 'Family History', component: <Page2 /> },
    { label: 'Medications', component: <Page3 /> },
  ]} />
          </div>

          {/* Divider */}
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
