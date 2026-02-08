import { useEffect, useState } from 'react'
import type { BodyRegionId } from '../types'
import { BodyViewer } from '../features/body-viewer/BodyViewer'
import BookModel from '../features/book/BookModel'
import {
  BodyRegionLogPage,
  FamilyHealthHistoryPage,
  DoctorAppointmentPage,
  AIInsightsPage,
} from '../features/book/pages'
import { useAppStore } from '../store'
import { PageContainer } from '../components/PageContainer'

/**
 * Home page with 3D body viewer and health book.
 * - Body part click → HTML overlay with BodyRegionLogPage
 * - My Health Book click → Even split screen: book (left 50%) + body (right 50%)
 */
export function HomePage() {
  const [bookVisible, setBookVisible] = useState(false)
  const [bodyRegionOverlay, setBodyRegionOverlay] = useState<BodyRegionId | null>(null)
  const selectedBodyRegion = useAppStore((s) => s.selectedBodyRegion)
  const setSelectedBodyRegion = useAppStore((s) => s.setSelectedBodyRegion)

  // Body part click: show HTML overlay (no second Canvas) so body keeps working
  useEffect(() => {
    if (selectedBodyRegion) {
      setBodyRegionOverlay(selectedBodyRegion)
      setSelectedBodyRegion(null)
    }
  }, [selectedBodyRegion, setSelectedBodyRegion])

  const bookmarks = [
    { label: 'Family history', component: <FamilyHealthHistoryPage recordedOnly /> },
    { label: 'Appointments', component: <DoctorAppointmentPage /> },
    { label: 'AI insights', component: <AIInsightsPage /> },
  ]

  return (
    <PageContainer fullWidth>
      <div className="flex flex-col min-h-[calc(100vh-4rem)] px-4 py-4">
        <div className="flex flex-1 glass-card overflow-hidden relative">
          {/* My Health Book button - black when closed, white when book open */}
          <button
            type="button"
            onClick={() => setBookVisible((v) => !v)}
            className={`absolute top-8 left-8 z-10 px-4 py-2.5 font-medium rounded-lg shadow-lg shadow-black/20 backdrop-blur transition-colors focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2 focus:ring-offset-black ${
              bookVisible
                ? 'bg-white text-black hover:bg-white/95'
                : 'bg-black text-white hover:bg-black/90'
            }`}
          >
            My Health Book
          </button>

          {bookVisible ? (
            /* Even split: book left 50%, body right 50% */
            <div className="w-full flex flex-1 min-h-0">
              <div className="w-1/2 flex items-center justify-center p-4 min-h-[600px] border-r border-white/10">
                <BookModel
                  projectName="Health Tracker"
                  authorName="Personal Health Journal"
                  bookmarks={bookmarks}
                  onClose={() => setBookVisible(false)}
                />
              </div>
              <div className="w-1/2 flex items-center justify-center p-4 min-h-[600px]">
                <BodyViewer />
              </div>
            </div>
          ) : (
            /* Body only - single Canvas */
            <>
              <div className="w-full flex items-center justify-center p-6">
                <BodyViewer />
              </div>

              {/* Body region overlay - HTML only, no second Canvas */}
              {bodyRegionOverlay && (
                <div
                  className="absolute inset-0 z-20 flex items-center justify-center bg-black/50 backdrop-blur-sm"
                  role="dialog"
                  aria-modal="true"
                  onClick={() => setBodyRegionOverlay(null)}
                >
                  <div
                    className="glass-card max-w-lg w-full mx-4 max-h-[85vh] overflow-y-auto"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="sticky top-0 bg-slate-50 dark:bg-white/5 backdrop-blur border-b border-slate-100 dark:border-white/10 px-4 py-3 flex justify-between items-center">
                      <span className="font-semibold text-slate-800 dark:text-white/90">Recorded issues</span>
                      <button
                        type="button"
                        onClick={() => setBodyRegionOverlay(null)}
                        className="p-1.5 text-slate-600 dark:text-white/70 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 rounded transition-colors"
                        aria-label="Close"
                      >
                        ✕
                      </button>
                    </div>
                    <div className="p-4">
                      <BodyRegionLogPage
                        bodyRegion={bodyRegionOverlay}
                        recordedIssuesOnly
                        onSaved={() => setBodyRegionOverlay(null)}
                        onCancel={() => setBodyRegionOverlay(null)}
                      />
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </PageContainer>
  )
}
