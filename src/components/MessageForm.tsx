'use client'

import { useState, useRef } from 'react'
import TurnstileWidget from './TurnstileWidget'

type FormStatus = 'idle' | 'loading' | 'success' | 'error'

export default function MessageForm() {
  const [name, setName] = useState('')
  const [content, setContent] = useState('')
  const [errors, setErrors] = useState<{ name?: string; content?: string; captcha?: string }>({})
  const [status, setStatus] = useState<FormStatus>('idle')
  const [errorMessage, setErrorMessage] = useState('')
  const captchaTokenRef = useRef<string | null>(null)
  const [captchaReady, setCaptchaReady] = useState(false)

  function validate(): boolean {
    const newErrors: typeof errors = {}
    if (!name.trim()) newErrors.name = 'Please enter your name.'
    else if (name.trim().length > 80) newErrors.name = 'Name must be 80 characters or fewer.'
    if (!content.trim()) newErrors.content = 'Please write a message.'
    else if (content.trim().length < 10) newErrors.content = 'Message must be at least 10 characters.'
    if (!captchaTokenRef.current) newErrors.captcha = 'Please complete the CAPTCHA.'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return

    setStatus('loading')
    setErrorMessage('')

    try {
      const res = await fetch('/api/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          content: content.trim(),
          captchaToken: captchaTokenRef.current,
        }),
      })

      const data = (await res.json()) as { success?: boolean; error?: string }

      if (!res.ok || !data.success) {
        setStatus('error')
        setErrorMessage(data.error ?? 'Something went wrong. Please try again.')
        captchaTokenRef.current = null
        setCaptchaReady(false)
        return
      }

      setStatus('success')
      setName('')
      setContent('')
      setErrors({})
      captchaTokenRef.current = null
      setCaptchaReady(false)
    } catch {
      setStatus('error')
      setErrorMessage('Network error. Please check your connection and try again.')
      captchaTokenRef.current = null
      setCaptchaReady(false)
    }
  }

  if (status === 'success') {
    return (
      <div className="card-message mb-10 text-center py-10 animate-fade-in relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-[#b89a5c]/40 to-transparent" />
        <div className="w-12 h-12 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center mx-auto mb-4">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <circle cx="10" cy="10" r="9" stroke="#166534" strokeWidth="1.3" />
            <path d="M6.5 10l2.5 2.5 4.5-4.5" stroke="#166534" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <h3 className="font-serif text-lg text-stone-800 mb-2">Thank you.</h3>
        <p className="text-stone-500 text-sm max-w-xs mx-auto leading-relaxed">
          Your message has been received and will appear on the board once approved.
        </p>
        <button
          onClick={() => setStatus('idle')}
          className="mt-6 text-xs text-stone-400 hover:text-stone-600 transition-colors underline underline-offset-2"
        >
          Submit another message
        </button>
      </div>
    )
  }

  const isLoading = status === 'loading'

  return (
    <div className="card-message mb-10 relative overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-[#b89a5c]/40 to-transparent" />

      <h2 className="font-serif text-xl text-stone-800 mb-1">Leave a message</h2>
      <p className="text-stone-400 text-xs mb-5">Messages are reviewed before appearing publicly.</p>

      {status === 'error' && (
        <div className="mb-5 flex items-center gap-3 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl animate-fade-in">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
            <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.2" />
            <path d="M8 5v4M8 11v.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
          </svg>
          {errorMessage}
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate className="space-y-4">
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
            disabled={isLoading}
          />
          {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name}</p>}
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
            disabled={isLoading}
          />
          <div className="flex justify-between items-center mt-1">
            {errors.content ? (
              <p className="text-xs text-red-500">{errors.content}</p>
            ) : <span />}
            <span className="text-xs text-stone-300 ml-auto">{content.length}/1000</span>
          </div>
        </div>

        <div>
          <TurnstileWidget
            onVerify={(token) => {
              captchaTokenRef.current = token
              setCaptchaReady(true)
              setErrors((p) => ({ ...p, captcha: undefined }))
            }}
            onError={() => {
              captchaTokenRef.current = null
              setCaptchaReady(false)
              setErrors((p) => ({ ...p, captcha: 'CAPTCHA error. Please refresh and try again.' }))
            }}
            onExpire={() => {
              captchaTokenRef.current = null
              setCaptchaReady(false)
            }}
          />
          {errors.captcha && (
            <p className="mt-1 text-xs text-red-500 text-center">{errors.captcha}</p>
          )}
        </div>

        <button
          type="submit"
          className="btn-primary w-full"
          disabled={isLoading || !captchaReady}
        >
          {isLoading ? (
            <>
              <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none" aria-hidden>
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" opacity="0.25" />
                <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
              Sending...
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
