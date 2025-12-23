import { Route, Routes } from 'react-router-dom'
import ProtectedRoute from './routes/ProtectedRoute'
import AppLayout from './layouts/AppLayout'
import Login from './pages/Login'
// import Signup from './pages/Signup' // Commented out - signup functionality disabled
import Dashboard from './pages/Dashboard'
import FIRs from './pages/FIRs'
import FIRDetail from './pages/FIRDetail'
import Proceedings from './pages/Proceedings'
import ProceedingDetail from './pages/ProceedingDetail'
import EditProceeding from './pages/EditProceeding'
import NotFound from './pages/NotFound'
import UserManagement from './pages/UserManagement'
import AuditLogs from './pages/AuditLogs'
import ConfigManagement from './pages/ConfigManagement'

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      {/* Signup route commented out - signup functionality disabled
      <Route path="/signup" element={<Signup />} />
      */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="firs" element={<FIRs />} />
        <Route path="firs/:firId" element={<FIRDetail />} />
        <Route path="proceedings" element={<Proceedings />} />
        <Route path="proceedings/:proceedingId" element={<ProceedingDetail />} />
        <Route path="proceedings/:proceedingId/edit" element={<EditProceeding />} />
        <Route path="admin/users" element={<UserManagement />} />
        <Route path="admin/audit-logs" element={<AuditLogs />} />
        <Route path="admin/config" element={<ConfigManagement />} />
      </Route>
      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}
