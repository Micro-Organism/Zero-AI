import { Navigate, Route, Routes } from 'react-router-dom'
import { ProtectedRoute } from '@/auth/ProtectedRoute'
import { AppLayout } from '@/layout/AppLayout'
import { DashboardPage } from '@/pages/DashboardPage'
import { FilesTasksPage } from '@/pages/FilesTasksPage'
import { InsightsPage } from '@/pages/InsightsPage'
import { LoginPage } from '@/pages/LoginPage'
import { MasterResumePage } from '@/pages/MasterResumePage'
import { MatchingPage } from '@/pages/MatchingPage'
import { RecruitmentPage } from '@/pages/RecruitmentPage'
import { ReferenceResumePage } from '@/pages/ReferenceResumePage'
import { ResumeLibraryPage } from '@/pages/ResumeLibraryPage'
import { SystemSettingsPage } from '@/pages/SystemSettingsPage'
import { TargetedResumePage } from '@/pages/TargetedResumePage'

export default function App() {
  return <Routes>
    <Route path="/login" element={<LoginPage />} />
    <Route element={<ProtectedRoute />}>
      <Route element={<AppLayout />}>
        <Route index element={<DashboardPage />} />
        <Route path="matching" element={<MatchingPage />} />
        <Route path="resume/master" element={<MasterResumePage />} />
        <Route path="resume/library" element={<ResumeLibraryPage />} />
        <Route path="resume/references" element={<ReferenceResumePage />} />
        <Route path="resume/targeted" element={<TargetedResumePage />} />
        <Route path="recruitment" element={<RecruitmentPage />} />
        <Route path="insights" element={<InsightsPage />} />
        <Route path="files" element={<FilesTasksPage />} />
        <Route path="settings" element={<SystemSettingsPage />} />
      </Route>
    </Route>
    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes>
}
