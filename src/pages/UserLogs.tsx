import { useEffect, useState } from 'react'
import { fetchUserActivityLogs, fetchAllBranches, fetchAllUsers } from '../lib/adminApi'
import type { AuditLog, User } from '../types'

export default function UserLogs() {
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [branches, setBranches] = useState<string[]>([])
  const [users, setUsers] = useState<Array<{ email: string }>>([])
  const [filters, setFilters] = useState({
    userEmail: '',
    branch: '',
    action: '',
    resourceType: '',
    startDate: '',
    endDate: '',
  })

  useEffect(() => {
    loadBranches()
    loadUsers()
    loadLogs()
  }, [])

  async function loadBranches() {
    try {
      const data = await fetchAllBranches()
      setBranches(data)
    } catch (err) {
      console.error('Failed to load branches:', err)
    }
  }

  async function loadUsers() {
    try {
      const data = await fetchAllUsers()
      setUsers(data.map((u: User) => ({ email: u.email })))
    } catch (err) {
      console.error('Failed to load users:', err)
    }
  }

  async function loadLogs() {
    try {
      setLoading(true)
      const data = await fetchUserActivityLogs({
        ...filters,
        limit: 100,
      })
      setLogs(data)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load user activity logs')
    } finally {
      setLoading(false)
    }
  }

  function handleFilterChange(key: string, value: string) {
    setFilters({ ...filters, [key]: value })
  }

  function handleApplyFilters() {
    loadLogs()
  }

  function handleExport() {
    const csv = [
      ['Timestamp', 'Action', 'User Email', 'Branch', 'Resource Type', 'Resource ID', 'Details'].join(','),
      ...logs.map((log) =>
        [
          log.timestamp,
          log.action,
          log.userEmail,
          log.details?.branch || '',
          log.resourceType,
          log.resourceId || '',
          JSON.stringify(log.details).replace(/"/g, '""'),
        ].join(',')
      ),
    ].join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `user-activity-logs-${new Date().toISOString()}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  if (loading && logs.length === 0) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-gray-500">Loading user activity logs...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">User Activity Logs</h1>
        <button
          onClick={handleExport}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700"
        >
          Export CSV
        </button>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 p-4 text-red-600">{error}</div>
      )}

      <div className="card-soft space-y-4 p-6">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3 lg:grid-cols-6">
          <select
            value={filters.userEmail}
            onChange={(e) => handleFilterChange('userEmail', e.target.value)}
            className="rounded-lg border px-3 py-2"
          >
            <option value="">All Users</option>
            {users.map((user) => (
              <option key={user.email} value={user.email}>
                {user.email}
              </option>
            ))}
          </select>

          <select
            value={filters.branch}
            onChange={(e) => handleFilterChange('branch', e.target.value)}
            className="rounded-lg border px-3 py-2"
          >
            <option value="">All Branches</option>
            {branches.map((branch) => (
              <option key={branch} value={branch}>
                {branch}
              </option>
            ))}
          </select>

          <select
            value={filters.action}
            onChange={(e) => handleFilterChange('action', e.target.value)}
            className="rounded-lg border px-3 py-2"
          >
            <option value="">All Actions</option>
            <option value="CREATE_FIR">Create FIR</option>
            <option value="UPDATE_FIR">Update FIR</option>
            <option value="DELETE_FIR">Delete FIR</option>
            <option value="CREATE_PROCEEDING">Create Proceeding</option>
            <option value="UPDATE_PROCEEDING">Update Proceeding</option>
            <option value="DELETE_PROCEEDING">Delete Proceeding</option>
          </select>

          <select
            value={filters.resourceType}
            onChange={(e) => handleFilterChange('resourceType', e.target.value)}
            className="rounded-lg border px-3 py-2"
          >
            <option value="">All Resource Types</option>
            <option value="FIR">FIR</option>
            <option value="PROCEEDING">Proceeding</option>
          </select>

          <input
            type="date"
            placeholder="Start Date"
            value={filters.startDate}
            onChange={(e) => handleFilterChange('startDate', e.target.value)}
            className="rounded-lg border px-3 py-2"
          />

          <input
            type="date"
            placeholder="End Date"
            value={filters.endDate}
            onChange={(e) => handleFilterChange('endDate', e.target.value)}
            className="rounded-lg border px-3 py-2"
          />
        </div>

        <button
          onClick={handleApplyFilters}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700"
        >
          Apply Filters
        </button>
      </div>

      <div className="card-soft overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Timestamp
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  User Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Branch
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Action
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Resource Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Resource ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Details
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
                    No activity logs found
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log._id} className="hover:bg-gray-50">
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                      {log.userEmail}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                      {log.details?.branch || '-'}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                      {log.action}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                      {log.resourceType}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                      {log.resourceId || '-'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      <pre className="max-w-xs overflow-auto text-xs">
                        {JSON.stringify(log.details, null, 2)}
                      </pre>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

