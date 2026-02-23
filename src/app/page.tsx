import { supabase } from '@/lib/supabase'
import { Message } from '@/lib/types'
import DanyaLogo from '@/components/DanyaLogo'
import MessageFeed from '@/components/MessageFeed'
import MessageForm from '@/components/MessageForm'

async function getApprovedMessages(): Promise<{ messages: Message[]; error: string | null }> {
  const { data, error } = await supabase
    .from('messages')
    .select('id, name, content, status, created_at, approved_at')
    .eq('status', 'approved')
    .order('created_at', { ascending: false })

  if (error) return { messages: [], error: error.message }
  return { messages: (data as Message[]) ?? [], error: null }
}

export const revalidate = 60

export default async function Home() {
  const { messages, error } = await getApprovedMessages()

  return (
    <div className="relative min-h-screen">
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 80% 60% at 50% -10%, rgba(184,154,92,0.06) 0%, transparent 70%), radial-gradient(ellipse 60% 40% at 80% 100%, rgba(184,154,92,0.04) 0%, transparent 60%)',
        }}
      />

      <div className="relative z-10 max-w-2xl mx-auto px-4 py-16">
        <header className="text-center mb-14 animate-fade-up" style={{ animationFillMode: 'both' }}>
          <div className="flex justify-center mb-6">
            <div className="relative">
              <div className="absolute inset-0 rounded-full bg-[#b89a5c]/8 scale-150 blur-2xl" />
              <DanyaLogo />
            </div>
          </div>

          <div className="relative">
            <h1 className="font-serif text-3xl sm:text-4xl text-stone-800 leading-tight">
              In Memory of
              <br />
              <span className="text-4xl sm:text-5xl font-light tracking-tight">Daniel Naroditsky</span>
            </h1>
          </div>

          <div className="mt-4 flex items-center justify-center gap-3">
            <div className="h-px w-12 bg-gradient-to-r from-transparent to-[#b89a5c]/40" />
            <p className="text-stone-500 text-sm font-serif italic">
              A place to share words, gratitude, and remembrance.
            </p>
            <div className="h-px w-12 bg-gradient-to-l from-transparent to-[#b89a5c]/40" />
          </div>

          <div className="mt-6 flex items-center justify-center gap-1.5 opacity-30">
            {['♙','♘','♗','♖','♕','♔'].map((piece, i) => (
              <span key={i} className="text-stone-600 text-sm">{piece}</span>
            ))}
          </div>
        </header>

        <main>
          <MessageForm />

          {error ? (
            <div className="card-message border-red-200 bg-red-50/50 text-center py-8">
              <p className="text-red-600 text-sm">Unable to load messages. Please try again later.</p>
            </div>
          ) : (
            <MessageFeed messages={messages} />
          )}
        </main>

        <footer className="mt-20 text-center">
          <div className="h-px w-24 bg-[#e7e0d4] mx-auto mb-6" />
          <p className="text-stone-400 text-xs font-serif italic">
            Rest in peace, Danya. Your brilliance lives on.
          </p>
          <p className="text-stone-300 text-xs mt-2">{new Date().getFullYear()}</p>
        </footer>
      </div>
    </div>
  )
}
