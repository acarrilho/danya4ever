'use client'

import { useState, useTransition, useRef } from 'react'
import { createAdminUser } from '../actions'

export default function AddAdminUserForm() {
  const [isOpen, setIsOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const formRef = useRef<HTMLFormElement>(null)

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    const formData = new FormData(e.currentTarget)
    startTransition(async () => {
      const res = await createAdminUser(formData)
      if (res.error) {
        setError(res.error)
      } else {
        setSuccess(true)
        formRef.current?.reset()
        setTimeout(() => { setSuccess(false); setIsOpen(false) }, 2000)
      }
    })
  }

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-stone-900 text-white text-sm font-medium hover:bg-stone-800 transition-colors"
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path d="M7 2v10M2 7h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
        Add Approver
      </button>
    )
  }

  return (
    <div className="bg-white border border-[#d5c9b5] rounded-xl p-5" style={{ boxShadow: '0 4px 16px rgba(0,0,0,0.05)' }}>
      <h3 className="font-medium text-stone-800 text-sm mb-4">Add New Approver</h3>

      {success && (
        <div className="mb-4 flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs px-3.5 py-3 rounded-xl">
          <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
            <circle cx="6.5" cy="6.5" r="5.5" stroke="currentColor" strokeWidth="1.2"/>
            <path d="M4 6.5l2 2 3.5-3.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Approver added successfully.
        </div>
      )}

      {error && (
        <div className="mb-4 flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 text-xs px-3.5 py-3 rounded-xl">
          <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
            <circle cx="6.5" cy="6.5" r="5.5" stroke="currentColor" strokeWidth="1.2"/>
            <path d="M6.5 4v3M6.5 8.5v.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
          </svg>
          {error}
        </div>
      )}

      <form ref={formRef} onSubmit={handleSubmit} className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-stone-400 mb-1.5 tracking-wider uppercase">Name</label>
            <input
              name="name"
              type="text"
              required
              maxLength={80}
              placeholder="Jane Doe"
              disabled={isPending}
              className="w-full bg-white border border-[#e7e0d4] rounded-xl px-4 py-2.5 text-sm text-stone-800 placeholder:text-stone-400 outline-none focus:border-[#b89a5c] focus:ring-2 focus:ring-[#b89a5c]/10 transition-all"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-stone-400 mb-1.5 tracking-wider uppercase">Email</label>
            <input
              name="email"
              type="email"
              required
              placeholder="jane@example.com"
              disabled={isPending}
              className="w-full bg-white border border-[#e7e0d4] rounded-xl px-4 py-2.5 text-sm text-stone-800 placeholder:text-stone-400 outline-none focus:border-[#b89a5c] focus:ring-2 focus:ring-[#b89a5c]/10 transition-all"
            />
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium text-stone-400 mb-1.5 tracking-wider uppercase">Temporary Password</label>
          <input
            name="password"
            type="password"
            required
            minLength={8}
            placeholder="Min. 8 characters"
            disabled={isPending}
            className="w-full bg-white border border-[#e7e0d4] rounded-xl px-4 py-2.5 text-sm text-stone-800 placeholder:text-stone-400 outline-none focus:border-[#b89a5c] focus:ring-2 focus:ring-[#b89a5c]/10 transition-all"
          />
          <p className="text-xs text-stone-400 mt-1">Share this securely. The approver can change it after logging in.</p>
        </div>

        <div className="flex items-center gap-2 pt-1">
          <button
            type="submit"
            disabled={isPending}
            className="px-5 py-2.5 rounded-xl text-sm bg-stone-900 text-white hover:bg-stone-800 transition-colors disabled:opacity-50"
          >
            {isPending ? 'Adding...' : 'Add Approver'}
          </button>
          <button
            type="button"
            onClick={() => { setIsOpen(false); setError(null) }}
            disabled={isPending}
            className="px-4 py-2.5 rounded-xl text-sm text-stone-400 border border-[#e7e0d4] hover:bg-stone-50 transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}
