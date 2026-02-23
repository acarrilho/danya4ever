'use client'

import { useState, useRef, useCallback } from 'react'
import TurnstileWidget from './TurnstileWidget'

type FormStatus = 'idle' | 'loading' | 'success' | 'error'

const MAX_IMAGE_DIMENSION = 1200  // px — max width or height after resize
const TARGET_SIZE_BYTES = 400_000 // 400KB target for final image
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']

/**
 * Resize and compress an image file using the Canvas API.
 * Returns a base64 data URI, or throws on failure.
 */
async function resizeImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const objectUrl = URL.createObjectURL(file)

    img.onload = () => {
      URL.revokeObjectURL(objectUrl)

      let { width, height } = img

      // Scale down if needed, keeping aspect ratio
      if (width > MAX_IMAGE_DIMENSION || height > MAX_IMAGE_DIMENSION) {
        const scale = MAX_IMAGE_DIMENSION / Math.max(width, height)
        width = Math.round(width * scale)
        height = Math.round(height * scale)
      }

      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext('2d')
      if (!ctx) { reject(new Error('Canvas not supported')); return }
      ctx.drawImage(img, 0, 0, width, height)

      // Try progressively lower quality until under TARGET_SIZE_BYTES
      let quality = 0.85
      let dataUrl = canvas.toDataURL('image/jpeg', quality)

      while (dataUrl.length * 0.75 > TARGET_SIZE_BYTES && quality > 0.3) {
        quality -= 0.1
        dataUrl = canvas.toDataURL('image/jpeg', quality)
      }

      resolve(dataUrl)
    }

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl)
      reject(new Error('Failed to load image'))
    }

    img.src = objectUrl
  })
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export default function MessageForm() {
  const [isOpen, setIsOpen] = useState(false)
  const [name, setName] = useState('')
  const [content, setContent] = useState('')
  const [errors, setErrors] = useState<{ name?: string; content?: string; captcha?: string; image?: string }>({})
  const [status, setStatus] = useState<FormStatus>('idle')
  const [errorMessage, setErrorMessage] = useState('')
  const captchaTokenRef = useRef<string | null>(null)
  const [captchaReady, setCaptchaReady] = useState(false)

  // Image state
  const [imagePreview, setImagePreview] = useState<string | null>(null)   // displayed preview (original or resized)
  const [imageDataUri, setImageDataUri] = useState<string | null>(null)   // what gets sent to server
  const [imageInfo, setImageInfo] = useState<{ originalSize: number; finalSize: number; resized: boolean } | null>(null)
  const [imageProcessing, setImageProcessing] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleImageChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setErrors((p) => ({ ...p, image: undefined }))

    if (!ACCEPTED_TYPES.includes(file.type)) {
      setErrors((p) => ({ ...p, image: 'Please select a JPEG, PNG, WebP, or GIF image.' }))
      return
    }

    const MAX_RAW = 20 * 1024 * 1024 // 20MB raw file limit
    if (file.size > MAX_RAW) {
      setErrors((p) => ({ ...p, image: 'Image must be smaller than 20MB.' }))
      return
    }

    setImageProcessing(true)

    try {
      const needsResize = file.size > TARGET_SIZE_BYTES
      let dataUri: string

      if (needsResize) {
        dataUri = await resizeImage(file)
      } else {
        // Small enough — read as-is
        dataUri = await new Promise<string>((res, rej) => {
          const reader = new FileReader()
          reader.onload = () => res(reader.result as string)
          reader.onerror = () => rej(new Error('Failed to read file'))
          reader.readAsDataURL(file)
        })
      }

      const finalSize = Math.round(dataUri.length * 0.75) // base64 to bytes approx

      setImagePreview(dataUri)
      setImageDataUri(dataUri)
      setImageInfo({ originalSize: file.size, finalSize, resized: needsResize })
    } catch {
      setErrors((p) => ({ ...p, image: 'Failed to process image. Please try another file.' }))
    } finally {
      setImageProcessing(false)
    }
  }, [])

  function removeImage() {
    setImagePreview(null)
    setImageDataUri(null)
    setImageInfo(null)
    setErrors((p) => ({ ...p, image: undefined }))
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

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
          imageDataUri: imageDataUri ?? null,
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
      removeImage()
      captchaTokenRef.current = null
      setCaptchaReady(false)
    } catch {
      setStatus('error')
      setErrorMessage('Network error. Please check your connection and try again.')
      captchaTokenRef.current = null
      setCaptchaReady(false)
    }
  }

  function handleClose() {
    setIsOpen(false)
    if (status === 'error') {
      setStatus('idle')
      setErrorMessage('')
    }
  }

  const isLoading = status === 'loading'

  return (
    <div className="mb-10">
      {/* ── Collapsed trigger ──────────────────────────────────── */}
      <button
        type="button"
        onClick={() => (isOpen && status !== 'loading') ? handleClose() : setIsOpen(true)}
        className="w-full group relative"
        aria-expanded={isOpen}
      >
        <div
          className={`
            relative flex items-center justify-between gap-4 px-5 py-4 rounded-2xl border transition-all duration-300
            ${isOpen
              ? 'bg-white/80 border-[#d5c9b5] rounded-b-none border-b-transparent'
              : 'bg-white/50 border-[#e7e0d4] hover:bg-white/80 hover:border-[#d5c9b5] hover:shadow-sm'
            }
          `}
          style={{ boxShadow: isOpen ? '0 1px 4px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.03)' : undefined }}
        >
          <div className={`absolute top-0 left-6 right-6 h-px bg-gradient-to-r from-transparent via-[#b89a5c]/50 to-transparent transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 group-hover:opacity-60'}`} />

          <div className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-full border flex items-center justify-center flex-shrink-0 transition-all duration-300 ${isOpen ? 'bg-stone-900 border-stone-900' : 'bg-[#faf7f0] border-[#e7e0d4] group-hover:border-[#d5c9b5]'}`}>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className={`transition-colors duration-300 ${isOpen ? 'text-white' : 'text-stone-400 group-hover:text-stone-600'}`}>
                <path d="M9.5 1.5 C10.5 0.5 12.5 0.5 13 2 C13.5 3.5 12 5 10.5 5.5 L3 13 L1 13 L1 11 Z" stroke="currentColor" strokeWidth="1.1" strokeLinejoin="round" fill="none"/>
                <path d="M8 3 L11 6" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round"/>
              </svg>
            </div>
            <div className="text-left">
              <p className={`text-sm font-medium transition-colors duration-200 ${isOpen ? 'text-stone-700' : 'text-stone-500 group-hover:text-stone-700'}`}>
                {status === 'success' ? 'Message received — thank you' : 'Share a memory or word of remembrance'}
              </p>
              {!isOpen && (
                <p className="text-xs text-stone-400 mt-0.5">Click to leave a message for Danya</p>
              )}
            </div>
          </div>

          <div className={`flex-shrink-0 transition-all duration-300 ${isOpen ? 'rotate-180 text-stone-400' : 'text-stone-300 group-hover:text-stone-400'}`}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        </div>
      </button>

      {/* ── Expandable form body ────────────────────────────────── */}
      <div className={`form-body ${isOpen ? 'open' : ''}`}>
        <div className="form-inner">
          <div
            className="bg-white/80 border border-[#d5c9b5] border-t-0 rounded-b-2xl px-5 pb-5 pt-4"
            style={{ boxShadow: '0 4px 16px rgba(0,0,0,0.05), 0 8px 32px rgba(0,0,0,0.03)' }}
          >
            {status === 'success' ? (
              <div className="py-6 text-center animate-fade-in">
                <div className="w-10 h-10 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center mx-auto mb-3">
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                    <circle cx="9" cy="9" r="8" stroke="#166534" strokeWidth="1.3" />
                    <path d="M5.5 9l2.5 2.5 4.5-4.5" stroke="#166534" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <p className="font-serif text-base text-stone-700 mb-1">Your message is awaiting approval.</p>
                <p className="text-xs text-stone-400">It will appear on the board once reviewed.</p>
                <button
                  onClick={() => { setStatus('idle'); setIsOpen(false) }}
                  className="mt-4 text-xs text-stone-400 hover:text-stone-600 transition-colors underline underline-offset-2"
                >
                  Close
                </button>
              </div>
            ) : (
              <>
                <div className="h-px bg-gradient-to-r from-transparent via-[#e7e0d4] to-transparent mb-4" />

                {status === 'error' && (
                  <div className="mb-4 flex items-start gap-2.5 bg-red-50 border border-red-200 text-red-700 text-xs px-3.5 py-3 rounded-xl animate-fade-in">
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="shrink-0 mt-0.5" aria-hidden>
                      <circle cx="7" cy="7" r="6" stroke="currentColor" strokeWidth="1.2" />
                      <path d="M7 4.5v3M7 9.5v.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
                    </svg>
                    {errorMessage}
                  </div>
                )}

                <form onSubmit={handleSubmit} noValidate className="space-y-3.5">
                  {/* Name */}
                  <div>
                    <label htmlFor="name" className="block text-xs font-medium text-stone-400 mb-1.5 tracking-wider uppercase">
                      Your Name
                    </label>
                    <input
                      id="name"
                      type="text"
                      className={`input-base text-sm ${errors.name ? 'border-red-300 ring-2 ring-red-100' : ''}`}
                      placeholder="e.g. Magnus Carlsen"
                      value={name}
                      onChange={(e) => { setName(e.target.value); if (errors.name) setErrors((p) => ({ ...p, name: undefined })) }}
                      maxLength={80}
                      disabled={isLoading}
                    />
                    {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name}</p>}
                  </div>

                  {/* Message */}
                  <div>
                    <label htmlFor="content" className="block text-xs font-medium text-stone-400 mb-1.5 tracking-wider uppercase">
                      Your Message
                    </label>
                    <textarea
                      id="content"
                      rows={4}
                      className={`input-base resize-none text-sm ${errors.content ? 'border-red-300 ring-2 ring-red-100' : ''}`}
                      placeholder="Share a memory, a word of gratitude, or simply say his name..."
                      value={content}
                      onChange={(e) => { setContent(e.target.value); if (errors.content) setErrors((p) => ({ ...p, content: undefined })) }}
                      maxLength={1000}
                      disabled={isLoading}
                    />
                    <div className="flex justify-between items-center mt-1">
                      {errors.content ? <p className="text-xs text-red-500">{errors.content}</p> : <span />}
                      <span className="text-xs text-stone-300 ml-auto">{content.length}/1000</span>
                    </div>
                  </div>

                  {/* Image upload */}
                  <div>
                    <label className="block text-xs font-medium text-stone-400 mb-1.5 tracking-wider uppercase">
                      Photo <span className="normal-case text-stone-300 font-normal">(optional)</span>
                    </label>

                    {!imagePreview ? (
                      <label
                        className={`flex items-center justify-center gap-2.5 w-full border-2 border-dashed rounded-xl px-4 py-4 cursor-pointer transition-all duration-200
                          ${imageProcessing
                            ? 'border-[#e7e0d4] bg-stone-50 cursor-wait'
                            : 'border-[#e7e0d4] hover:border-[#b89a5c]/50 hover:bg-[#faf7f0]'
                          }
                          ${errors.image ? 'border-red-300 bg-red-50/30' : ''}
                        `}
                      >
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/jpeg,image/png,image/webp,image/gif"
                          className="sr-only"
                          onChange={handleImageChange}
                          disabled={isLoading || imageProcessing}
                        />
                        {imageProcessing ? (
                          <>
                            <svg className="animate-spin w-4 h-4 text-stone-400" viewBox="0 0 24 24" fill="none">
                              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" opacity="0.25" />
                              <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                            </svg>
                            <span className="text-xs text-stone-400">Processing image…</span>
                          </>
                        ) : (
                          <>
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-stone-400 shrink-0">
                              <rect x="1" y="3" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="1.2"/>
                              <circle cx="5.5" cy="7" r="1.5" stroke="currentColor" strokeWidth="1.1"/>
                              <path d="M1 11l3.5-3.5L8 11l3-3 4 4" stroke="currentColor" strokeWidth="1.1" strokeLinejoin="round"/>
                            </svg>
                            <span className="text-xs text-stone-400">
                              Click to add a photo
                              <span className="text-stone-300 ml-1">· JPEG, PNG, WebP, GIF · max 20MB</span>
                            </span>
                          </>
                        )}
                      </label>
                    ) : (
                      /* Image preview */
                      <div className="relative rounded-xl overflow-hidden border border-[#e7e0d4] bg-stone-50">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={imagePreview}
                          alt="Preview"
                          className="w-full max-h-56 object-cover"
                        />
                        {/* Remove button */}
                        <button
                          type="button"
                          onClick={removeImage}
                          disabled={isLoading}
                          className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/70 transition-colors"
                          title="Remove image"
                        >
                          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                            <path d="M2 2l8 8M10 2l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                          </svg>
                        </button>
                        {/* Size info */}
                        {imageInfo && (
                          <div className="px-3 py-2 bg-white/90 border-t border-[#e7e0d4] flex items-center gap-2">
                            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="text-emerald-600 shrink-0">
                              <circle cx="6" cy="6" r="5" stroke="currentColor" strokeWidth="1.1"/>
                              <path d="M3.5 6l2 2 3-3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                            <span className="text-xs text-stone-500">
                              {imageInfo.resized
                                ? `Resized from ${formatBytes(imageInfo.originalSize)} → ${formatBytes(imageInfo.finalSize)}`
                                : `${formatBytes(imageInfo.finalSize)}`
                              }
                            </span>
                          </div>
                        )}
                      </div>
                    )}

                    {errors.image && <p className="mt-1 text-xs text-red-500">{errors.image}</p>}
                  </div>

                  {/* CAPTCHA */}
                  <div>
                    <TurnstileWidget
                      onVerify={(token) => { captchaTokenRef.current = token; setCaptchaReady(true); setErrors((p) => ({ ...p, captcha: undefined })) }}
                      onError={() => { captchaTokenRef.current = null; setCaptchaReady(false); setErrors((p) => ({ ...p, captcha: 'CAPTCHA error. Please refresh and try again.' })) }}
                      onExpire={() => { captchaTokenRef.current = null; setCaptchaReady(false) }}
                    />
                    {errors.captcha && <p className="mt-1 text-xs text-red-500 text-center">{errors.captcha}</p>}
                  </div>

                  {/* Submit */}
                  <div className="flex gap-2.5 pt-0.5">
                    <button
                      type="button"
                      onClick={handleClose}
                      disabled={isLoading}
                      className="px-4 py-2.5 rounded-xl text-sm text-stone-400 hover:text-stone-600 border border-[#e7e0d4] hover:border-[#d5c9b5] bg-transparent transition-all duration-200 disabled:opacity-40"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="btn-primary flex-1"
                      disabled={isLoading || !captchaReady || imageProcessing}
                    >
                      {isLoading ? (
                        <>
                          <svg className="animate-spin w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" aria-hidden>
                            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" opacity="0.25" />
                            <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                          </svg>
                          {imageDataUri ? 'Uploading…' : 'Sending…'}
                        </>
                      ) : (
                        'Share Message'
                      )}
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
