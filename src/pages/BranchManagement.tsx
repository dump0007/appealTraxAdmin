import { useEffect, useState } from 'react'
import { fetchAllBranches, createBranch, updateBranch, checkBranchDeletion, deleteBranch } from '../lib/adminApi'

export default function BranchManagement() {
  const [branches, setBranches] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [newBranchName, setNewBranchName] = useState('')
  const [editingBranch, setEditingBranch] = useState<string | null>(null)
  const [editBranchName, setEditBranchName] = useState('')
  const [deletingBranch, setDeletingBranch] = useState<string | null>(null)
  const [deletionImpact, setDeletionImpact] = useState<{ firCount: number; proceedingCount: number } | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  useEffect(() => {
    loadBranches()
  }, [])

  async function loadBranches() {
    try {
      setLoading(true)
      const data = await fetchAllBranches()
      setBranches(data)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load branches')
    } finally {
      setLoading(false)
    }
  }

  async function handleCreate() {
    if (!newBranchName.trim()) {
      setError('Branch name is required')
      return
    }
    try {
      setError(null)
      await createBranch(newBranchName.trim())
      setNewBranchName('')
      await loadBranches()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create branch')
    }
  }

  async function handleStartEdit(branch: string) {
    setEditingBranch(branch)
    setEditBranchName(branch)
  }

  async function handleCancelEdit() {
    setEditingBranch(null)
    setEditBranchName('')
  }

  async function handleUpdate() {
    if (!editingBranch || !editBranchName.trim()) {
      setError('Branch name is required')
      return
    }
    if (editBranchName.trim() === editingBranch) {
      handleCancelEdit()
      return
    }
    try {
      setError(null)
      await updateBranch(editingBranch, editBranchName.trim())
      setEditingBranch(null)
      setEditBranchName('')
      await loadBranches()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update branch')
    }
  }

  async function handleStartDelete(branch: string) {
    try {
      setError(null)
      const impact = await checkBranchDeletion(branch)
      setDeletionImpact(impact)
      setDeletingBranch(branch)
      setShowDeleteConfirm(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to check deletion impact')
    }
  }

  async function handleConfirmDelete() {
    if (!deletingBranch) return
    try {
      setError(null)
      await deleteBranch(deletingBranch)
      setDeletingBranch(null)
      setDeletionImpact(null)
      setShowDeleteConfirm(false)
      await loadBranches()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete branch')
    }
  }

  function handleCancelDelete() {
    setDeletingBranch(null)
    setDeletionImpact(null)
    setShowDeleteConfirm(false)
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-gray-500">Loading branches...</div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Branch Management</h1>
      </div>

      {error && (
        <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-red-700">{error}</div>
      )}

      {/* Create Branch Section */}
      <div className="mb-6 rounded-lg border bg-white p-4 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold">Create New Branch</h2>
        <div className="flex gap-2">
          <input
            type="text"
            value={newBranchName}
            onChange={(e) => setNewBranchName(e.target.value)}
            placeholder="Enter branch name"
            className="flex-1 rounded-lg border px-3 py-2"
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                handleCreate()
              }
            }}
          />
          <button
            onClick={handleCreate}
            className="rounded-lg bg-indigo-600 px-6 py-2 text-white hover:bg-indigo-700"
          >
            Create
          </button>
        </div>
      </div>

      {/* Branches List */}
      <div className="rounded-lg border bg-white shadow-sm">
        <div className="border-b px-6 py-4">
          <h2 className="text-lg font-semibold">All Branches</h2>
        </div>
        <div className="divide-y">
          {branches.length === 0 ? (
            <div className="p-8 text-center text-gray-500">No branches found</div>
          ) : (
            branches.map((branch) => (
              <div key={branch} className="flex items-center justify-between px-6 py-4">
                {editingBranch === branch ? (
                  <div className="flex flex-1 items-center gap-2">
                    <input
                      type="text"
                      value={editBranchName}
                      onChange={(e) => setEditBranchName(e.target.value)}
                      className="flex-1 rounded-lg border px-3 py-2"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          handleUpdate()
                        } else if (e.key === 'Escape') {
                          handleCancelEdit()
                        }
                      }}
                      autoFocus
                    />
                    <button
                      onClick={handleUpdate}
                      className="rounded-lg bg-green-600 px-4 py-2 text-white hover:bg-green-700"
                    >
                      Save
                    </button>
                    <button
                      onClick={handleCancelEdit}
                      className="rounded-lg border px-4 py-2 hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="flex-1 font-medium">{branch}</div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleStartEdit(branch)}
                        className="rounded-lg border px-4 py-2 text-indigo-600 hover:bg-indigo-50"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleStartDelete(branch)}
                        className="rounded-lg border px-4 py-2 text-red-600 hover:bg-red-50"
                      >
                        Delete
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && deletingBranch && deletionImpact && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="w-full max-w-md rounded-lg bg-white p-6">
            <h2 className="mb-4 text-xl font-bold text-red-600">Confirm Branch Deletion</h2>
            <div className="mb-4 space-y-2">
              <p className="text-gray-700">
                Are you sure you want to delete branch <strong>"{deletingBranch}"</strong>?
              </p>
              <div className="rounded-lg bg-red-50 p-4">
                <p className="font-semibold text-red-800">Warning: This action will delete:</p>
                <ul className="mt-2 list-disc pl-5 text-red-700">
                  <li>{deletionImpact.firCount} FIR(s)</li>
                  <li>{deletionImpact.proceedingCount} Proceeding(s)</li>
                </ul>
                <p className="mt-2 text-sm text-red-600">
                  This action cannot be undone.
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              <button
                onClick={handleCancelDelete}
                className="flex-1 rounded-lg border px-4 py-2 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                className="flex-1 rounded-lg bg-red-600 px-4 py-2 text-white hover:bg-red-700"
              >
                Delete Branch
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}


