import { Routes, Route } from 'react-router-dom'
import { useAuth0 } from '@auth0/auth0-react'
import { Layout } from './components/Layout'
import { LoginPage } from './pages/LoginPage'
import { HomePage } from './pages/HomePage'
import { LogsPage } from './pages/LogsPage'
import { LogDetailPage } from './pages/LogDetailPage'
import { NewLogPage } from './pages/NewLogPage'
import { EditLogPage } from './pages/EditLogPage'
import { AppointmentsPage } from './pages/AppointmentsPage'
import { FamilyHistoryPage } from './pages/FamilyHistoryPage'
import { ProfilePage } from './pages/ProfilePage'
import { LoadingSpinner } from './components/LoadingSpinner'

function App() {
  const { isAuthenticated, isLoading } = useAuth0()

  if (isLoading) {
    return <LoadingSpinner />
  }

  if (!isAuthenticated) {
    return <LoginPage />
  }

  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<HomePage />} />
        <Route path="logs" element={<LogsPage />} />
        <Route path="logs/new" element={<NewLogPage />} />
        <Route path="logs/:id/edit" element={<EditLogPage />} />
        <Route path="logs/:id" element={<LogDetailPage />} />
        <Route path="appointments" element={<AppointmentsPage />} />
        <Route path="family-history" element={<FamilyHistoryPage />} />
        <Route path="profile" element={<ProfilePage />} />
      </Route>
    </Routes>
  )
}

export default App
