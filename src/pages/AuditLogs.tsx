import { useEffect, useState } from 'react'
import { fetchAuditLogs } from '../lib/adminApi'
import type { AuditLog } from '../types'

export default function AuditLogs() {
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filters, setFilters] = useState({
    userEmail: '',
    action: '',
    resourceType: '',
    startDate: '',
    endDate: '',
  })

  useEffect(() => {
    loadLogs()
  }, [])

  async function loadLogs() {
    try {
      setLoading(true)
      const data = await fetchAuditLogs({
        ...filters,
        limit: 100,
      })
      setLogs(data)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load audit logs')
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
      ['Timestamp', 'Action', 'User Email', 'Resource Type', 'Resource ID', 'Details'].join(','),
      ...logs.map((log) =>
        [
          log.timestamp,
          log.action,
          log.userEmail,
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
    a.download = `audit-logs-${new Date().toISOString()}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-gray-500">Loading audit logs...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Audit Logs</h1>
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
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3 lg:grid-cols-5">
          <input
            type="text"
            placeholder="User Email"
            value={filters.userEmail}
            onChange={(e) => handleFilterChange('userEmail', e.target.value)}
            className="rounded-lg border px-3 py-2"
          />
          <input
            type="text"
            placeholder="Action"
            value={filters.action}
            onChange={(e) => handleFilterChange('action', e.target.value)}
            className="rounded-lg border px-3 py-2"
          />
          <input
            type="text"
            placeholder="Resource Type"
            value={filters.resourceType}
            onChange={(e) => handleFilterChange('resourceType', e.target.value)}
            className="rounded-lg border px-3 py-2"
          />
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

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="px-4 py-2 text-left">Timestamp</th>
                <th className="px-4 py-2 text-left">Action</th>
                <th className="px-4 py-2 text-left">User Email</th>
                <th className="px-4 py-2 text-left">Resource Type</th>
                <th className="px-4 py-2 text-left">Resource ID</th>
                <th className="px-4 py-2 text-left">Details</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log._id} className="border-b hover:bg-gray-50">
                  <td className="px-4 py-2 text-sm">
                    {new Date(log.timestamp).toLocaleString()}
                  </td>
                  <td className="px-4 py-2">
                    <span className="rounded-full bg-blue-100 px-2 py-1 text-xs text-blue-700">
                      {log.action}
                    </span>
                  </td>
                  <td className="px-4 py-2">{log.userEmail}</td>
                  <td className="px-4 py-2">{log.resourceType}</td>
                  <td className="px-4 py-2 text-sm text-gray-500">
                    {log.resourceId || '-'}
                  </td>
                  <td className="px-4 py-2 text-sm text-gray-600">
                    {JSON.stringify(log.details).substring(0, 100)}
                    {JSON.stringify(log.details).length > 100 ? '...' : ''}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {logs.length === 0 && (
            <div className="p-8 text-center text-gray-500">No audit logs found</div>
          )}
        </div>
      </div>
    </div>
  )
}

