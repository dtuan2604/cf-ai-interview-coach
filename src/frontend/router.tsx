import { Navigate, Route, Routes } from 'react-router-dom'
import { AppLayout } from './components/layout/AppLayout'
import { HistoryPage } from './pages/HistoryPage'
import { InterviewPage } from './pages/InterviewPage'
import { LandingPage } from './pages/LandingPage'
import { ReportPage } from './pages/ReportPage'
import { SetupPage } from './pages/SetupPage'

export function AppRouter() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route path="/" element={<LandingPage />} />
        <Route path="/setup" element={<SetupPage />} />
        <Route path="/interview/:sessionId" element={<InterviewPage />} />
        <Route path="/reports/:sessionId" element={<ReportPage />} />
        <Route path="/history" element={<HistoryPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}
