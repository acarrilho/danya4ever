'use client'

import MessageCard from './MessageCard'
import { Message } from '@/lib/types'

interface Props {
  messages: Message[]
}

export default function MessageFeed({ messages }: Props) {
  if (messages.length === 0) return <EmptyState />

  return (
    <section aria-label="Memorial messages">
      <p className="text-xs text-stone-400 text-center mb-6">
        {messages.length} {messages.length === 1 ? 'message' : 'messages'} of remembrance
      </p>

      {/*
        CSS masonry layout using `columns`.
        - 1 col on mobile
        - 2 cols on md (768px+)
        - 3 cols on xl (1280px+)
        - 4 cols on 2xl (1536px+)
        `break-inside: avoid` on each card keeps them from splitting.
        Cards stack top-to-bottom within each column (Pinterest style).
      */}
      <div className="columns-1 md:columns-2 xl:columns-3 2xl:columns-4 gap-4">
        {messages.map((msg, i) => (
          <div key={msg.id} className="break-inside-avoid mb-4">
            <MessageCard message={msg} index={i} />
          </div>
        ))}
      </div>
    </section>
  )
}

function EmptyState() {
  return (
    <div className="text-center py-20 animate-fade-in">
      <div className="w-12 h-12 rounded-full border border-[#e7e0d4] flex items-center justify-center mx-auto mb-4">
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="text-stone-300">
          <path d="M10 3a7 7 0 1 0 0 14A7 7 0 0 0 10 3Z" stroke="currentColor" strokeWidth="1.2" />
          <path d="M10 7v4M10 13v.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
        </svg>
      </div>
      <p className="font-serif text-lg text-stone-400 italic">No messages yet.</p>
      <p className="text-sm text-stone-400 mt-1">Be the first to share a memory.</p>
    </div>
  )
}
