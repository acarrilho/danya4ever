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

/**
 * Extract a YouTube video ID from any common YouTube URL format.
 */
function extractYouTubeId(text: string): string | null {
  const patterns = [
    /(?:https?:\/\/)?(?:www\.)?youtu\.be\/([a-zA-Z0-9_-]{11})/,
    /(?:https?:\/\/)?(?:www\.)?youtube\.com\/watch\?(?:[^#&\s]*&)*v=([a-zA-Z0-9_-]{11})/,
    /(?:https?:\/\/)?(?:www\.)?youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/,
    /(?:https?:\/\/)?(?:www\.)?youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/,
    /(?:https?:\/\/)?(?:www\.)?youtube\.com\/live\/([a-zA-Z0-9_-]{11})/,
  ]
  for (const pattern of patterns) {
    const match = text.match(pattern)
    if (match?.[1]) return match[1]
  }
  return null
}

/** Remove YouTube URLs from display text so they don't duplicate the embed. */
function stripYouTubeUrl(text: string): string {
  return text
    .replace(/(?:https?:\/\/)?(?:www\.)?youtu\.be\/[a-zA-Z0-9_-]{11}[^\s]*/g, '')
    .replace(/(?:https?:\/\/)?(?:www\.)?youtube\.com\/(?:watch|embed|shorts|live)[^\s]*/g, '')
    .trim()
    .replace(/\s{2,}/g, ' ')
}

interface Props {
  message: Message
  index: number
}

export default function MessageCard({ message, index }: Props) {
  const initials = getInitials(message.name)
  const youtubeId = extractYouTubeId(message.content)
  const displayText = youtubeId ? stripYouTubeUrl(message.content) : message.content

  const hasMedia = !!youtubeId || !!message.image_url

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
            <time className="shrink-0 text-xs text-stone-400 font-mono" dateTime={message.created_at}>
              {formatDate(message.created_at)}
            </time>
          </div>

          {/* Message text */}
          {displayText && (
            <p className={`text-stone-600 text-sm leading-relaxed font-sans ${hasMedia ? 'mb-3' : ''}`}>
              {displayText}
            </p>
          )}

          {/* Uploaded image */}
          {message.image_url && (
            <div className={`rounded-xl overflow-hidden border border-[#e7e0d4] ${youtubeId ? 'mb-3' : ''}`}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={message.image_url}
                alt={`Photo shared by ${message.name}`}
                className="w-full object-cover max-h-80"
                loading="lazy"
              />
            </div>
          )}

          {/* YouTube embed */}
          {youtubeId && (
            <div
              className="rounded-xl overflow-hidden border border-[#e7e0d4] bg-black"
              style={{ aspectRatio: '16/9' }}
            >
              <iframe
                src={`https://www.youtube-nocookie.com/embed/${youtubeId}?rel=0&modestbranding=1`}
                title="YouTube video"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                loading="lazy"
                className="w-full h-full"
                style={{ border: 'none', display: 'block' }}
              />
            </div>
          )}
        </div>
      </div>
    </article>
  )
}
