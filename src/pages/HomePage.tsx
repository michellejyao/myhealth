import { useEffect, useMemo } from 'react'
import { BodyViewer } from '../features/body-viewer/BodyViewer'
import BookModel from '../features/book/BookModel'
import {
  BodyRegionLogPage,
  FamilyHealthHistoryPage,
  DoctorAppointmentPage,
  BookTimelinePage,
  AIInsightsPage,
  AttachmentsPage,
} from '../features/book/pages'
import { useAppStore } from '../store'
import { PageContainer } from '../components/PageContainer'

export function HomePage() {
  const selectedBodyRegion = useAppStore((s) => s.selectedBodyRegion)
  const setSelectedBodyRegion = useAppStore((s) => s.setSelectedBodyRegion)
  const openBookTo = useAppStore((s) => s.openBookTo)
  const setOpenBookTo = useAppStore((s) => s.setOpenBookTo)

  // When user clicks a body region: open the book and show body region log page
  useEffect(() => {
    if (selectedBodyRegion) {
      setOpenBookTo({ type: 'body_region', region: selectedBodyRegion })
      setSelectedBodyRegion(null)
    }
  }, [selectedBodyRegion, setSelectedBodyRegion, setOpenBookTo])

  const bookmarks = useMemo(
    () => [
      { label: 'Timeline', component: <BookTimelinePage /> },
      { label: 'Family history', component: <FamilyHealthHistoryPage /> },
      { label: 'Appointments', component: <DoctorAppointmentPage /> },
      { label: 'AI insights', component: <AIInsightsPage /> },
      { label: 'Attachments', component: <AttachmentsPage /> },
    ],
    []
  )

  const openWithContent = useMemo(() => {
    if (openBookTo?.type !== 'body_region') return undefined
    return (
      <BodyRegionLogPage
        bodyRegion={openBookTo.region}
        onSaved={() => setOpenBookTo(null)}
        onCancel={() => setOpenBookTo(null)}
      />
    )
  }, [openBookTo])


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
            <BookModel
              projectName="Health Tracker"
              authorName="Personal Health Journal"
              bookmarks={bookmarks}
              openWithContent={openWithContent}
              onClose={() => setOpenBookTo(null)}
            />
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
