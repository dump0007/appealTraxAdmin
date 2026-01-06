import type {
  User,
  AdminDashboardMetrics,
  AuditLog,
  SystemConfig,
  FIR,
  Proceeding,
} from '../types'
import { useAuthStore } from '../store'

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, '') || 'http://localhost:3000'

function getAuthToken(): string | null {
  const state = useAuthStore.getState()
  return state.currentUser?.token || null
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getAuthToken()
  if (!token) {
    throw new Error('Authentication required. Please login again.')
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'x-access-token': token,
    ...((options.headers as Record<string, string>) || {}),
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: options.method || 'GET',
    headers,
    ...options,
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    const message = errorData.message || `Request failed with status ${response.status}`
    
    if (response.status === 401 || response.status === 403) {
      const { logout } = useAuthStore.getState()
      logout()
      window.location.href = '/login'
      throw new Error('Authentication required. Please login again.')
    }
    
    throw new Error(message)
  }

  return response.json()
}

// User Management
export async function fetchAllUsers() {
  return request<User[]>('/v1/admin/users')
}

export async function fetchAdminCount() {
  const data = await request<{ count: number }>('/v1/admin/users-count/admins')
  return data.count
}

export async function fetchUser(id: string) {
  return request<User>(`/v1/admin/users/${id}`)
}

export async function createUser(userData: Partial<User> & { password: string }) {
  return request<User>('/v1/admin/users', {
    method: 'POST',
    body: JSON.stringify(userData),
  })
}

export async function updateUser(id: string, userData: Partial<User>) {
  return request<User>(`/v1/admin/users/${id}`, {
    method: 'PUT',
    body: JSON.stringify(userData),
  })
}

export async function deleteUser(id: string) {
  return request<User>(`/v1/admin/users/${id}`, {
    method: 'DELETE',
  })
}

// Data Access
export async function fetchAllFIRs(filters?: { startDate?: string; endDate?: string; branch?: string }) {
  const params = new URLSearchParams()
  if (filters?.startDate) params.append('startDate', filters.startDate)
  if (filters?.endDate) params.append('endDate', filters.endDate)
  if (filters?.branch) params.append('branch', filters.branch)
  const queryString = params.toString()
  return request<FIR[]>(`/v1/admin/firs${queryString ? `?${queryString}` : ''}`)
}

export async function fetchAllProceedings(filters?: { startDate?: string; endDate?: string; branch?: string }) {
  const params = new URLSearchParams()
  if (filters?.startDate) params.append('startDate', filters.startDate)
  if (filters?.endDate) params.append('endDate', filters.endDate)
  if (filters?.branch) params.append('branch', filters.branch)
  const queryString = params.toString()
  return request<Proceeding[]>(`/v1/admin/proceedings${queryString ? `?${queryString}` : ''}`)
}

// Analytics
export async function fetchSystemMetrics() {
  return request<AdminDashboardMetrics>('/v1/admin/metrics')
}

export async function fetchDashboardAnalytics() {
  return request<AdminDashboardMetrics>('/v1/admin/analytics/dashboard')
}

export async function fetchAdminDashboardMetrics(filters?: { startDate?: string; endDate?: string; branch?: string }) {
  const params = new URLSearchParams()
  if (filters?.startDate) params.append('startDate', filters.startDate)
  if (filters?.endDate) params.append('endDate', filters.endDate)
  if (filters?.branch) params.append('branch', filters.branch)
  const queryString = params.toString()
  return request<any>(`/v1/admin/dashboard-metrics${queryString ? `?${queryString}` : ''}`)
}

export async function fetchAdminCityGraph(filters?: { startDate?: string; endDate?: string; branch?: string }) {
  const params = new URLSearchParams()
  if (filters?.startDate) params.append('startDate', filters.startDate)
  if (filters?.endDate) params.append('endDate', filters.endDate)
  if (filters?.branch) params.append('branch', filters.branch)
  const queryString = params.toString()
  return request<Array<{ branch: string; count: number }>>(`/v1/admin/city-graph${queryString ? `?${queryString}` : ''}`)
}

export async function fetchAdminWritTypeDistribution(filters?: { startDate?: string; endDate?: string; branch?: string }) {
  const params = new URLSearchParams()
  if (filters?.startDate) params.append('startDate', filters.startDate)
  if (filters?.endDate) params.append('endDate', filters.endDate)
  if (filters?.branch) params.append('branch', filters.branch)
  const queryString = params.toString()
  return request<Array<{ type: string; count: number }>>(`/v1/admin/writ-type-distribution${queryString ? `?${queryString}` : ''}`)
}

export async function fetchAdminMotionMetrics(filters?: { startDate?: string; endDate?: string; branch?: string }) {
  const params = new URLSearchParams()
  if (filters?.startDate) params.append('startDate', filters.startDate)
  if (filters?.endDate) params.append('endDate', filters.endDate)
  if (filters?.branch) params.append('branch', filters.branch)
  const queryString = params.toString()
  return request<{ filed: number; pending: number; overdue: number }>(`/v1/admin/motion-metrics${queryString ? `?${queryString}` : ''}`)
}

export async function fetchAdminAffidavitMetrics(filters?: { startDate?: string; endDate?: string; branch?: string }) {
  const params = new URLSearchParams()
  if (filters?.startDate) params.append('startDate', filters.startDate)
  if (filters?.endDate) params.append('endDate', filters.endDate)
  if (filters?.branch) params.append('branch', filters.branch)
  const queryString = params.toString()
  return request<{ filed: number; pending: number; overdue: number }>(`/v1/admin/affidavit-metrics${queryString ? `?${queryString}` : ''}`)
}

// Audit Logs
export async function fetchAuditLogs(filters?: {
  userEmail?: string
  action?: string
  resourceType?: string
  startDate?: string
  endDate?: string
  limit?: number
  skip?: number
}) {
  const params = new URLSearchParams()
  if (filters?.userEmail) params.append('userEmail', filters.userEmail)
  if (filters?.action) params.append('action', filters.action)
  if (filters?.resourceType) params.append('resourceType', filters.resourceType)
  if (filters?.startDate) params.append('startDate', filters.startDate)
  if (filters?.endDate) params.append('endDate', filters.endDate)
  if (filters?.limit) params.append('limit', filters.limit.toString())
  if (filters?.skip) params.append('skip', filters.skip.toString())

  const queryString = params.toString()
  return request<AuditLog[]>(`/v1/admin/audit-logs${queryString ? `?${queryString}` : ''}`)
}

export async function fetchUserActivityLogs(filters?: {
  userEmail?: string
  branch?: string
  action?: string
  resourceType?: string
  startDate?: string
  endDate?: string
  limit?: number
  skip?: number
}) {
  const params = new URLSearchParams()
  if (filters?.userEmail) params.append('userEmail', filters.userEmail)
  if (filters?.branch) params.append('branch', filters.branch)
  if (filters?.action) params.append('action', filters.action)
  if (filters?.resourceType) params.append('resourceType', filters.resourceType)
  if (filters?.startDate) params.append('startDate', filters.startDate)
  if (filters?.endDate) params.append('endDate', filters.endDate)
  if (filters?.limit) params.append('limit', filters.limit.toString())
  if (filters?.skip) params.append('skip', filters.skip.toString())

  const queryString = params.toString()
  return request<AuditLog[]>(`/v1/admin/user-logs${queryString ? `?${queryString}` : ''}`)
}

// Config
export async function fetchConfig() {
  return request<SystemConfig[]>('/v1/admin/config')
}

export async function updateConfig(key: string, value: any, description?: string) {
  return request<SystemConfig>('/v1/admin/config', {
    method: 'PUT',
    body: JSON.stringify({ key, value, description }),
  })
}

// Branch Management
export async function fetchAllBranches() {
  return request<string[]>('/v1/admin/branches')
}

export async function createBranch(name: string) {
  return request<string[]>('/v1/admin/branches', {
    method: 'POST',
    body: JSON.stringify({ name }),
  })
}

export async function updateBranch(oldName: string, newName: string) {
  return request<string[]>('/v1/admin/branches/' + encodeURIComponent(oldName), {
    method: 'PUT',
    body: JSON.stringify({ name: newName }),
  })
}

export async function checkBranchDeletion(name: string) {
  return request<{ firCount: number; proceedingCount: number }>('/v1/admin/branches/' + encodeURIComponent(name) + '/check-deletion')
}

export async function deleteBranch(name: string) {
  return request<{ message: string }>('/v1/admin/branches/' + encodeURIComponent(name), {
    method: 'DELETE',
  })
}

