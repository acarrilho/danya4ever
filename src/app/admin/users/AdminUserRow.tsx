'use client'

import { useState, useTransition } from 'react'
import { AdminUser } from '@/lib/types'
import { toggleAdminUserActive, deleteAdminUser, changeAdminPassword } from '../actions'

interface Props {
  user: AdminUser
  currentAdminId: string | null
}

export default function AdminUserRow({ user, currentAdminId }: Props) {
  const [isPending, startTransition] = useTransition()
  const [isActive, setIsActive] = useState(user.is_active)
  const [error, setError] = useState<string | null>(null)
  const [showPasswordForm, setShowPasswordForm] = useState(false)
  const [newPassword, setNewPassword] = useState('')
  const [pwStatus, setPwStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [pwError, setPwError] = useState('')

  const isSelf = user.id === currentAdminId

  function handleToggle() {
    setError(null)
    startTransition(async () => {
      const res = await toggleAdminUserActive(user.id, !isActive)
      if (res.error) setError(res.error)
      else setIsActive((v) => !v)
    })
  }

  function handleDelete() {
    if (!confirm(`Remove ${user.name} as an approver? This cannot be undone.`)) return
    setError(null)
    startTransition(async () => {
      const res = await deleteAdminUser(user.id)
      if (res.error) setError(res.error)
    })
  }

  async function handlePasswordChange(e: React.FormEvent) {
    e.preventDefault()
    setPwError('')
    setPwStatus('idle')
    const res = await changeAdminPassword(user.id, newPassword)
    if (res.error) { setPwStatus('error'); setPwError(res.error) }
    else { setPwStatus('success'); setNewPassword(''); setTimeout(() => { setShowPasswordForm(false); setPwStatus('idle') }, 2000) }
  }

  return (
    <div className={`bg-white border border-[#e7e0d4] rounded-xl p-5 transition-opacity ${isPending ? 'opacity-50' : ''}`}>
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-0.5 flex-wrap">
            <span className="font-medium text-stone-800 text-sm">{user.name}</span>
            {isSelf && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-[#faf7f0] border border-[#e7e0d4] text-stone-400">You</span>
            )}
            <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${
              isActive ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-stone-50 text-stone-400 border-stone-200'
            }`}>
              {isActive ? 'Active' : 'Inactive'}
            </span>
          </div>
          <p className="text-xs text-stone-400 font-mono">{user.email}</p>
          <p className="text-xs text-stone-300 mt-0.5">
            Added {new Date(user.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setShowPasswordForm((v) => !v)}
            disabled={isPending}
            className="text-xs px-3 py-1.5 rounded-lg bg-stone-50 text-stone-600 border border-stone-200 hover:bg-stone-100 transition-colors disabled:opacity-50"
          >
            Change Password
          </button>
          {!isSelf && (
            <>
              <button
                onClick={handleToggle}
                disabled={isPending}
                className={`text-xs px-3 py-1.5 rounded-lg border transition-colors disabled:opacity-50 ${
                  isActive
                    ? 'bg-stone-50 text-stone-600 border-stone-200 hover:bg-stone-100'
                    : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                }`}
              >
                {isActive ? 'Deactivate' : 'Activate'}
              </button>
              <button
                onClick={handleDelete}
                disabled={isPending}
                className="text-xs px-2.5 py-1.5 rounded-lg text-stone-400 hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
                title="Remove approver"
              >
                <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                  <path d="M2 3h9M5 3V2h3v1M4 3l.5 7.5h4L9 3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </>
          )}
        </div>
      </div>

      {error && <p className="mt-2 text-xs text-red-500">{error}</p>}

      {showPasswordForm && (
        <form onSubmit={handlePasswordChange} className="mt-4 pt-4 border-t border-[#e7e0d4] flex items-end gap-2">
          <div className="flex-1">
            <label className="block text-xs font-medium text-stone-400 mb-1.5 tracking-wider uppercase">
              New Password
            </label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              minLength={8}
              required
              placeholder="Min. 8 characters"
              className="w-full bg-white border border-[#e7e0d4] rounded-xl px-4 py-2.5 text-sm text-stone-800 placeholder:text-stone-400 outline-none focus:border-[#b89a5c] focus:ring-2 focus:ring-[#b89a5c]/10 transition-all"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2.5 rounded-xl text-sm bg-stone-900 text-white hover:bg-stone-800 transition-colors"
          >
            {pwStatus === 'success' ? '✓ Saved' : 'Save'}
          </button>
          <button
            type="button"
            onClick={() => { setShowPasswordForm(false); setPwStatus('idle'); setNewPassword('') }}
            className="px-4 py-2.5 rounded-xl text-sm text-stone-400 border border-[#e7e0d4] hover:bg-stone-50 transition-colors"
          >
            Cancel
          </button>
          {pwStatus === 'error' && <p className="text-xs text-red-500 mt-1">{pwError}</p>}
        </form>
      )}
    </div>
  )
}
