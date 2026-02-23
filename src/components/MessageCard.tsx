import { Message } from '@/lib/types'

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

function getInitials(name: string): string {
  return name
    .trim()
    .split(' ')
    .map((n) => n[0]?.toUpperCase() ?? '')
    .slice(0, 2)
    .join('')
}

interface Props {
  message: Message
  index: number
}

export default function MessageCard({ message, index }: Props) {
  const initials = getInitials(message.name)

  return (
    <article
      className="card-message animate-fade-up"
      style={{ animationDelay: `${index * 80}ms`, animationFillMode: 'both', opacity: 0 }}
    >
      <div className="flex items-start gap-4">
        {/* Avatar */}
        <div
          className="shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-xs font-medium tracking-wide text-stone-600 border border-[#e7e0d4]"
          style={{ background: 'linear-gradient(135deg, #f4ede0, #ead9c4)' }}
        >
          {initials}
        </div>

        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-baseline justify-between gap-2 mb-2">
            <h3 className="font-medium text-stone-800 text-sm tracking-wide truncate">
              {message.name}
            </h3>
            <time
              className="shrink-0 text-xs text-stone-400 font-mono"
              dateTime={message.created_at}
            >
              {formatDate(message.created_at)}
            </time>
          </div>

          {/* Content */}
          <p className="text-stone-600 text-sm leading-relaxed font-serif italic">
            &ldquo;{message.content}&rdquo;
          </p>
        </div>
      </div>
    </article>
  )
}
