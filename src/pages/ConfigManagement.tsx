import { useEffect, useState } from 'react'
import { fetchConfig, updateConfig } from '../lib/adminApi'
import type { SystemConfig } from '../types'

export default function ConfigManagement() {
  const [configs, setConfigs] = useState<SystemConfig[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [editingKey, setEditingKey] = useState<string | null>(null)
  const [editForm, setEditForm] = useState({ key: '', value: '', description: '' })

  useEffect(() => {
    loadConfig()
  }, [])

  async function loadConfig() {
    try {
      setLoading(true)
      const data = await fetchConfig()
      setConfigs(data)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load config')
    } finally {
      setLoading(false)
    }
  }

  function startEdit(config: SystemConfig) {
    setEditingKey(config.key)
    setEditForm({
      key: config.key,
      value: typeof config.value === 'string' ? config.value : JSON.stringify(config.value),
      description: config.description || '',
    })
  }

  async function handleSave() {
    try {
      let parsedValue: any = editForm.value
      try {
        parsedValue = JSON.parse(editForm.value)
      } catch {
        // If not valid JSON, keep as string
      }

      await updateConfig(editForm.key, parsedValue, editForm.description)
      setEditingKey(null)
      setSuccess('Config updated successfully')
      setTimeout(() => setSuccess(null), 3000)
      await loadConfig()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update config')
    }
  }

  function handleAddNew() {
    setEditingKey('NEW')
    setEditForm({ key: '', value: '', description: '' })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-gray-500">Loading config...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">System Configuration</h1>
        <button
          onClick={handleAddNew}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700"
        >
          + Add Config
        </button>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 p-4 text-red-600">{error}</div>
      )}

      {success && (
        <div className="rounded-lg bg-green-50 p-4 text-green-600">{success}</div>
      )}

      <div className="card-soft space-y-4 p-6">
        {editingKey && (
          <div className="rounded-lg border-2 border-indigo-200 bg-indigo-50 p-4">
            <h3 className="mb-4 font-semibold">
              {editingKey === 'NEW' ? 'Add New Config' : 'Edit Config'}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium">Key</label>
                <input
                  type="text"
                  value={editForm.key}
                  onChange={(e) => setEditForm({ ...editForm, key: e.target.value })}
                  className="w-full rounded-lg border px-3 py-2"
                  disabled={editingKey !== 'NEW'}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium">Value (JSON or string)</label>
                <textarea
                  value={editForm.value}
                  onChange={(e) => setEditForm({ ...editForm, value: e.target.value })}
                  className="w-full rounded-lg border px-3 py-2 font-mono text-sm"
                  rows={4}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium">Description</label>
                <input
                  type="text"
                  value={editForm.description}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  className="w-full rounded-lg border px-3 py-2"
                />
              </div>
            </div>
            <div className="mt-4 flex gap-4">
              <button
                onClick={() => {
                  setEditingKey(null)
                  setEditForm({ key: '', value: '', description: '' })
                }}
                className="flex-1 rounded-lg border px-4 py-2"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="flex-1 rounded-lg bg-indigo-600 px-4 py-2 text-white"
              >
                Save
              </button>
            </div>
          </div>
        )}

        <div className="space-y-2">
          {configs.map((config) => (
            <div
              key={config.key}
              className="flex items-center justify-between rounded-lg border p-4 hover:bg-gray-50"
            >
              <div className="flex-1">
                <div className="font-semibold">{config.key}</div>
                <div className="text-sm text-gray-600">
                  {typeof config.value === 'string'
                    ? config.value
                    : JSON.stringify(config.value)}
                </div>
                {config.description && (
                  <div className="mt-1 text-xs text-gray-500">{config.description}</div>
                )}
                <div className="mt-1 text-xs text-gray-400">
                  Updated by {config.updatedBy} on{' '}
                  {new Date(config.updatedAt).toLocaleString()}
                </div>
              </div>
              <button
                onClick={() => startEdit(config)}
                className="ml-4 text-indigo-600 hover:underline"
              >
                Edit
              </button>
            </div>
          ))}
          {configs.length === 0 && (
            <div className="p-8 text-center text-gray-500">No configuration found</div>
          )}
        </div>
      </div>
    </div>
  )
}

