'use client'

import { useState, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { Message, MessageInsert } from '@/lib/types'

interface Props {
  onMessageAdded: (message: Message) => void
}

export default function MessageForm({ onMessageAdded }: Props) {
  const [name, setName] = useState('')
  const [content, setContent] = useState('')
  const [errors, setErrors] = useState<{ name?: string; content?: string }>({})
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState('')
  const formRef = useRef<HTMLFormElement>(null)

  function validate(): boolean {
    const newErrors: { name?: string; content?: string } = {}
    if (!name.trim()) newErrors.name = 'Please enter your name.'
    if (!content.trim()) newErrors.content = 'Please write a message.'
    else if (content.trim().length < 10) newErrors.content = 'Message must be at least 10 characters.'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return

    setStatus('loading')
    setErrorMessage('')

    const insert: MessageInsert = { name: name.trim(), content: content.trim() }

    const { data, error } = await supabase
      .from('messages')
      .insert(insert)
      .select()
      .single()

    if (error || !data) {
      setStatus('error')
      setErrorMessage(error?.message ?? 'Something went wrong. Please try again.')
      return
    }

    onMessageAdded(data as Message)
    setStatus('success')
    setName('')
    setContent('')
    setErrors({})

    setTimeout(() => setStatus('idle'), 4000)
  }

  return (
    <div className="card-message mb-10 relative overflow-hidden">
      {/* Decorative top border */}
      <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-[#b89a5c]/40 to-transparent" />

      <h2 className="font-serif text-xl text-stone-800 mb-1">Leave a message</h2>
      <p className="text-stone-400 text-xs mb-5">Your words will be shared with all who visit this space.</p>

      {status === 'success' && (
        <div className="mb-5 flex items-center gap-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm px-4 py-3 rounded-xl animate-fade-in">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
            <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.2" />
            <path d="M5 8l2 2 4-4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Your message has been shared. Thank you for remembering Danya.
        </div>
      )}

      {status === 'error' && (
        <div className="mb-5 flex items-center gap-3 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl animate-fade-in">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
            <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.2" />
            <path d="M8 5v4M8 11v0.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
          </svg>
          {errorMessage}
        </div>
      )}

      <form ref={formRef} onSubmit={handleSubmit} noValidate className="space-y-4">
        <div>
          <label htmlFor="name" className="block text-xs font-medium text-stone-500 mb-1.5 tracking-wider uppercase">
            Your Name
          </label>
          <input
            id="name"
            type="text"
            className={`input-base ${errors.name ? 'border-red-300 ring-2 ring-red-100' : ''}`}
            placeholder="e.g. Magnus Carlsen"
            value={name}
            onChange={(e) => {
              setName(e.target.value)
              if (errors.name) setErrors((p) => ({ ...p, name: undefined }))
            }}
            maxLength={80}
            disabled={status === 'loading'}
          />
          {errors.name && (
            <p className="mt-1 text-xs text-red-500">{errors.name}</p>
          )}
        </div>

        <div>
          <label htmlFor="content" className="block text-xs font-medium text-stone-500 mb-1.5 tracking-wider uppercase">
            Your Message
          </label>
          <textarea
            id="content"
            rows={4}
            className={`input-base resize-none ${errors.content ? 'border-red-300 ring-2 ring-red-100' : ''}`}
            placeholder="Share a memory, a word of gratitude, or simply say his name..."
            value={content}
            onChange={(e) => {
              setContent(e.target.value)
              if (errors.content) setErrors((p) => ({ ...p, content: undefined }))
            }}
            maxLength={1000}
            disabled={status === 'loading'}
          />
          <div className="flex justify-between items-center mt-1">
            {errors.content ? (
              <p className="text-xs text-red-500">{errors.content}</p>
            ) : (
              <span />
            )}
            <span className="text-xs text-stone-300 ml-auto">{content.length}/1000</span>
          </div>
        </div>

        <button
          type="submit"
          className="btn-primary w-full"
          disabled={status === 'loading'}
        >
          {status === 'loading' ? (
            <>
              <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none" aria-hidden>
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" opacity="0.25" />
                <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
              Sharing your message...
            </>
          ) : (
            <>
              <svg width="15" height="15" viewBox="0 0 15 15" fill="none" aria-hidden>
                <path d="M7.5 2v11M2 7.5h11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
              Share Message
            </>
          )}
        </button>
      </form>
    </div>
  )
}
