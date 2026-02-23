'use client'

import { useState } from 'react'
import MessageCard from './MessageCard'
import MessageForm from './MessageForm'
import { Message } from '@/lib/types'

interface Props {
  initialMessages: Message[]
}

export default function MessageFeed({ initialMessages }: Props) {
  const [messages, setMessages] = useState<Message[]>(initialMessages)

  function handleMessageAdded(message: Message) {
    setMessages((prev) => [message, ...prev])
  }

  return (
    <>
      <MessageForm onMessageAdded={handleMessageAdded} />

      {/* Feed */}
      <section aria-label="Memorial messages">
        {messages.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="space-y-4">
            <p className="text-xs text-stone-400 text-center mb-6">
              {messages.length} {messages.length === 1 ? 'message' : 'messages'} of remembrance
            </p>
            {messages.map((msg, i) => (
              <MessageCard key={msg.id} message={msg} index={i} />
            ))}
          </div>
        )}
      </section>
    </>
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
