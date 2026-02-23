'use client'

import { useState, useTransition } from 'react'
import { Message } from '@/lib/types'
import { approveMessage, rejectMessage, deleteMessage } from './actions'

interface Props {
  message: Message & { moderation_token: string }
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const STATUS_STYLES: Record<string, string> = {
  pending: 'bg-amber-50 text-amber-700 border-amber-200',
  approved: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  rejected: 'bg-red-50 text-red-600 border-red-200',
}

export default function AdminMessageRow({ message }: Props) {
  const [isPending, startTransition] = useTransition()
  const [localStatus, setLocalStatus] = useState(message.status)
  const [error, setError] = useState<string | null>(null)

  async function handleApprove() {
    setError(null)
    startTransition(async () => {
      const res = await approveMessage(message.id)
      if (res.error) setError(res.error)
      else setLocalStatus('approved')
    })
  }

  async function handleReject() {
    setError(null)
    startTransition(async () => {
      const res = await rejectMessage(message.id)
      if (res.error) setError(res.error)
      else setLocalStatus('rejected')
    })
  }

  async function handleDelete() {
    if (!confirm('Permanently delete this message?')) return
    setError(null)
    startTransition(async () => {
      const res = await deleteMessage(message.id)
      if (res.error) setError(res.error)
    })
  }

  return (
    <div
      className={`bg-white border border-[#e7e0d4] rounded-xl p-5 transition-opacity ${isPending ? 'opacity-50' : ''}`}
    >
      <div className="flex items-start justify-between gap-4 mb-3">
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <span className="font-medium text-stone-800 text-sm">{message.name}</span>
            <span
              className={`text-xs px-2 py-0.5 rounded-full border font-medium ${STATUS_STYLES[localStatus] ?? STATUS_STYLES.pending}`}
            >
              {localStatus}
            </span>
          </div>
          <time className="text-xs text-stone-400 font-mono">{formatDate(message.created_at)}</time>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {localStatus === 'pending' && (
            <>
              <button
                onClick={handleApprove}
                disabled={isPending}
                className="text-xs px-3 py-1.5 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition-colors disabled:opacity-50"
              >
                Approve
              </button>
              <button
                onClick={handleReject}
                disabled={isPending}
                className="text-xs px-3 py-1.5 rounded-lg bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 transition-colors disabled:opacity-50"
              >
                Reject
              </button>
            </>
          )}
          {localStatus === 'rejected' && (
            <button
              onClick={handleApprove}
              disabled={isPending}
              className="text-xs px-3 py-1.5 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition-colors disabled:opacity-50"
            >
              Approve
            </button>
          )}
          {localStatus === 'approved' && (
            <button
              onClick={handleReject}
              disabled={isPending}
              className="text-xs px-3 py-1.5 rounded-lg bg-stone-100 text-stone-600 hover:bg-stone-200 transition-colors disabled:opacity-50"
            >
              Revoke
            </button>
          )}
          <button
            onClick={handleDelete}
            disabled={isPending}
            className="text-xs px-3 py-1.5 rounded-lg text-stone-400 hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
            title="Delete permanently"
          >
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
              <path d="M2 3h9M5 3V2h3v1M4 3l.5 7.5h4L9 3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
      </div>

      <p className="text-stone-600 text-sm leading-relaxed font-serif italic border-l-2 border-[#e7e0d4] pl-3">
        &ldquo;{message.content}&rdquo;
      </p>

      {error && (
        <p className="mt-2 text-xs text-red-500">{error}</p>
      )}
    </div>
  )
}
