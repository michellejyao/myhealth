import { Routes, Route } from 'react-router-dom'
import { Layout } from './components/Layout'
import { HomePage } from './pages/HomePage'
import { LogsPage } from './pages/LogsPage'
import { LogDetailPage } from './pages/LogDetailPage'
import { NewLogPage } from './pages/NewLogPage'
import { TimelinePage } from './pages/TimelinePage'
import { ProfilePage } from './pages/ProfilePage'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<HomePage />} />
        <Route path="logs" element={<LogsPage />} />
        <Route path="logs/new" element={<NewLogPage />} />
        <Route path="logs/:id" element={<LogDetailPage />} />
        <Route path="timeline" element={<TimelinePage />} />
        <Route path="profile" element={<ProfilePage />} />
      </Route>
    </Routes>
  )
}

export default App
