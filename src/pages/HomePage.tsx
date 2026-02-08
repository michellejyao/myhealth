import { useState } from 'react'
import { useAuth0 } from '@auth0/auth0-react'
import { BodyViewer } from '../features/body-viewer/BodyViewer'
import BookModel from '../features/book/BookModel'
import {
  FamilyHealthHistoryPage,
  DoctorAppointmentPage,
  MedicalLogsPage,
  HealthProfilePage,
} from '../features/book/pages'
import { PageContainer } from '../components/PageContainer'

/**
 * Home page with 3D body viewer and health book.
 * - Body part click → HTML overlay with BodyRegionLogPage
 * - My Health Book click → Even split screen: book (left 50%) + body (right 50%)
 */
export function HomePage() {
  const [bookVisible, setBookVisible] = useState(false)
  // Get user from Auth0
  const { user } = useAuth0()

  const userId = user?.sub ?? '';
  const bookmarks = [
    { label: 'Medical Logs', component: <MedicalLogsPage userId={userId} /> },
    { label: 'Appointments', component: <DoctorAppointmentPage /> },
    { label: 'Family history', component: <FamilyHealthHistoryPage recordedOnly userId={userId} /> },
    { label: 'Health Profile', component: <HealthProfilePage userId={userId} /> },
  ];

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
              <div className="w-1/2 flex items-center justify-center p-4 min-h-[600px]">
                <BookModel
                  projectName="Soma"
                  authorName={user?.name || "Personal Health Journal"}
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

            </>
          )}
        </div>
      </div>
    </PageContainer>
  )
}
