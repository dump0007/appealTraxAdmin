import { Navigate } from 'react-router-dom'
import { useAuthStore } from '../store'

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const user = useAuthStore((s) => s.currentUser)
  const isAdmin = useAuthStore((s) => s.isAdmin)
  
  if (!user) return <Navigate to="/login" replace />
  
  // Admin panel requires ADMIN role - redirect to user panel if not admin
  if (!isAdmin()) {
    // Redirect to user panel (assuming it's on a different port/domain)
    // For now, show error message
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600">Access Denied</h1>
          <p className="mt-2 text-gray-600">Only administrators can access the admin panel.</p>
          <p className="mt-1 text-sm text-gray-500">Please use the user panel to access your account.</p>
        </div>
      </div>
    )
  }
  
  return <>{children}</>
}


