import { useEffect, useState } from 'react'
import { fetchAllUsers, createUser, updateUser, deleteUser, fetchAdminCount, fetchAllBranches } from '../lib/adminApi'
import type { User, UserRole } from '../types'

export default function UserManagement() {
  const [users, setUsers] = useState<User[]>([])
  const [adminCount, setAdminCount] = useState<number>(0)
  const [branches, setBranches] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [filterRole, setFilterRole] = useState<UserRole | 'ALL'>('ALL')
  const [filterBranch, setFilterBranch] = useState<string>('')
  const [searchQuery, setSearchQuery] = useState('')
  const [branchError, setBranchError] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    role: 'USER' as UserRole,
    branch: '',
  })

  useEffect(() => {
    if (showEditModal && selectedUser) {
      setFormData({
        email: selectedUser.email?.toLowerCase().trim() || selectedUser.email,
        password: '',
        role: selectedUser.role,
        branch: selectedUser.branch,
      })
      setBranchError(null)
    }
  }, [showEditModal, selectedUser])

  useEffect(() => {
    loadUsers()
    loadAdminCount()
    loadBranches()
  }, [])

  async function loadBranches() {
    try {
      const branchList = await fetchAllBranches()
      setBranches(branchList)
    } catch (err) {
      console.error('Failed to load branches:', err)
    }
  }

  async function loadUsers() {
    try {
      setLoading(true)
      const data = await fetchAllUsers()
      setUsers(data)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load users')
    } finally {
      setLoading(false)
    }
  }

  async function loadAdminCount() {
    try {
      const count = await fetchAdminCount()
      setAdminCount(count)
    } catch (err) {
      console.error('Failed to load admin count:', err)
    }
  }

  async function handleCreate() {
    try {
      // Normalize email to lowercase - password remains case-sensitive
      const normalizedEmail = formData.email.toLowerCase().trim()
      await createUser({ ...formData, email: normalizedEmail })
      setShowCreateModal(false)
      setFormData({ email: '', password: '', role: 'USER', branch: '' })
      await loadUsers()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create user')
    }
  }

  async function handleUpdate() {
    if (!selectedUser) return
    if (branchError) {
      return
    }
    try {
      // Normalize email to lowercase - password remains case-sensitive
      const normalizedEmail = formData.email.toLowerCase().trim()
      const branchToSave = formData.branch || selectedUser.branch
      await updateUser(selectedUser._id, { ...formData, branch: branchToSave, email: normalizedEmail })
      setShowEditModal(false)
      setSelectedUser(null)
      setFormData({ email: '', password: '', role: 'USER', branch: '' })
      setBranchError(null)
      await loadUsers()
      await loadAdminCount()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update user'
      if (message.toLowerCase().includes('branch')) {
        setBranchError(message)
      } else {
        setError(message)
      }
    }
  }

  async function handleDelete(id: string) {
    const userToDelete = users.find((u) => u._id === id)
    if (!userToDelete) return

    if (userToDelete.role === 'ADMIN' && adminCount <= 1) {
      setError('Cannot delete the last admin. At least one admin must exist.')
      return
    }

    if (!confirm('Are you sure you want to delete this user?')) return
    try {
      await deleteUser(id)
      await loadUsers()
      await loadAdminCount()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete user')
    }
  }

  function openEditModal(user: User) {
    setSelectedUser(user)
    // Normalize email for display consistency (already stored in lowercase, but ensure it)
    setFormData({
      email: user.email?.toLowerCase().trim() || user.email,
      password: '',
      role: user.role,
      branch: user.branch,
    })
    setBranchError(null)
    setShowEditModal(true)
  }

  function validateBranchChange(nextBranch: string) {
    if (!selectedUser) return
    if (!nextBranch || nextBranch === selectedUser.branch) {
      setBranchError(null)
      return
    }
    const remainingUsersInCurrentBranch = users.filter(
      (u) => u.branch === selectedUser.branch && u._id !== selectedUser._id
    ).length
    if (remainingUsersInCurrentBranch === 0) {
      setBranchError('Cannot change branch. This is the only user for this branch.')
    } else {
      setBranchError(null)
    }
  }

  const filteredUsers = users.filter((user) => {
    if (filterRole !== 'ALL' && user.role !== filterRole) return false
    if (filterBranch && !user.branch.toLowerCase().includes(filterBranch.toLowerCase())) return false
    if (searchQuery && !user.email.toLowerCase().includes(searchQuery.toLowerCase())) return false
    return true
  })

  const uniqueBranches = Array.from(new Set(users.map((u) => u.branch).filter(Boolean)))

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-gray-500">Loading users...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
        <button
          onClick={() => {
            setFormData({ email: '', password: '', role: 'USER', branch: '' })
            setShowCreateModal(true)
          }}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700"
        >
          + Create User
        </button>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 p-4 text-red-600">{error}</div>
      )}

      <div className="card-soft space-y-4 p-6">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <input
              type="text"
              placeholder="Search by email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-lg border px-3 py-2"
            />
          </div>
          <select
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value as UserRole | 'ALL')}
            className="rounded-lg border px-3 py-2"
          >
            <option value="ALL">All Roles</option>
            <option value="USER">User</option>
            <option value="ADMIN">Admin</option>
          </select>
          <select
            value={filterBranch}
            onChange={(e) => setFilterBranch(e.target.value)}
            className="rounded-lg border px-3 py-2"
          >
            <option value="">All Branches</option>
            {uniqueBranches.map((branch) => (
              <option key={branch} value={branch}>
                {branch}
              </option>
            ))}
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="px-4 py-2 text-left">Email</th>
                <th className="px-4 py-2 text-left">Role</th>
                <th className="px-4 py-2 text-left">Branch</th>
                <th className="px-4 py-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => (
                <tr key={user._id} className="border-b hover:bg-gray-50">
                  <td className="px-4 py-2">{user.email}</td>
                  <td className="px-4 py-2">
                    <span
                      className={`rounded-full px-2 py-1 text-xs ${
                        user.role === 'ADMIN'
                          ? 'bg-purple-100 text-purple-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {user.role}
                    </span>
                  </td>
                  <td className="px-4 py-2">{user.branch}</td>
                  <td className="px-4 py-2 text-right">
                    <button
                      onClick={() => openEditModal(user)}
                      className="mr-2 text-indigo-600 hover:underline"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(user._id)}
                      disabled={user.role === 'ADMIN' && adminCount <= 1}
                      className={`${
                        user.role === 'ADMIN' && adminCount <= 1
                          ? 'cursor-not-allowed text-gray-400'
                          : 'text-red-600 hover:underline'
                      }`}
                      title={
                        user.role === 'ADMIN' && adminCount <= 1
                          ? 'Cannot delete the last admin'
                          : ''
                      }
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredUsers.length === 0 && (
            <div className="p-8 text-center text-gray-500">No users found</div>
          )}
        </div>
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="w-full max-w-md rounded-lg bg-white p-6">
            <h2 className="mb-4 text-xl font-bold">Create User</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full rounded-lg border px-3 py-2"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium">Password</label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full rounded-lg border px-3 py-2"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium">Role</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
                  className="w-full rounded-lg border px-3 py-2"
                >
                  <option value="USER">User</option>
                  <option value="ADMIN">Admin</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium">Branch</label>
                <select
                  value={formData.branch}
                  onChange={(e) => setFormData({ ...formData, branch: e.target.value })}
                  className="w-full rounded-lg border px-3 py-2"
                  required
                >
                  <option value="">Select Branch</option>
                  {branches.map((branch) => (
                    <option key={branch} value={branch}>
                      {branch}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="mt-6 flex gap-4">
              <button
                onClick={() => setShowCreateModal(false)}
                className="flex-1 rounded-lg border px-4 py-2"
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                className="flex-1 rounded-lg bg-indigo-600 px-4 py-2 text-white"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="w-full max-w-md rounded-lg bg-white p-6">
            <h2 className="mb-4 text-xl font-bold">Edit User</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full rounded-lg border px-3 py-2"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium">Password (leave blank to keep current)</label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full rounded-lg border px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium">Role</label>
                <select
                  value={formData.role}
                  onChange={(e) => {
                    if (selectedUser?.role === 'ADMIN' && adminCount <= 1 && e.target.value === 'USER') {
                      setError('Cannot convert the last admin to user. At least one admin must exist.')
                      return
                    }
                    setFormData({ ...formData, role: e.target.value as UserRole })
                    setError(null)
                  }}
                  className="w-full rounded-lg border px-3 py-2"
                  disabled={selectedUser?.role === 'ADMIN' && adminCount <= 1}
                >
                  <option value="USER">User</option>
                  <option value="ADMIN">Admin</option>
                </select>
                {selectedUser?.role === 'ADMIN' && adminCount <= 1 && (
                  <p className="mt-1 text-xs text-red-600">
                    Cannot convert the last admin to user. At least one admin must exist.
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium">Branch</label>
                <select
                  value={formData.branch}
                  onChange={(e) => {
                    const nextBranch = e.target.value
                    setFormData({ ...formData, branch: nextBranch })
                    validateBranchChange(nextBranch)
                  }}
                  className="w-full rounded-lg border px-3 py-2"
                >
                  <option value="">Select Branch</option>
                  {branches.map((branch) => (
                    <option key={branch} value={branch}>
                      {branch}
                    </option>
                  ))}
                </select>
                {branchError && (
                  <p className="mt-1 text-xs text-red-600">{branchError}</p>
                )}
              </div>
            </div>
            <div className="mt-6 flex gap-4">
              <button
                onClick={() => {
                  setShowEditModal(false)
                  setSelectedUser(null)
                  setBranchError(null)
                }}
                className="flex-1 rounded-lg border px-4 py-2"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdate}
                className="flex-1 rounded-lg bg-indigo-600 px-4 py-2 text-white"
              >
                Update
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

