import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { isAdminAuthenticated, SESSION_COOKIE, getCurrentAdmin } from '@/lib/admin-auth'
import { supabaseAdmin } from '@/lib/supabase-admin'
import AdminMessageRow from './AdminMessageRow'
import { AdminMessage, AdminUser } from '@/lib/types'

async function getAllMessages() {
  const { data, error } = await supabaseAdmin
    .from('messages')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) return { messages: [], error: error.message }
  return { messages: (data as AdminMessage[]) ?? [], error: null }
}

async function getAllAdminUsers(): Promise<AdminUser[]> {
  const { data } = await supabaseAdmin
    .from('admin_users')
    .select('id, name, email, is_active, created_at')
    .order('created_at', { ascending: true })
  return (data as AdminUser[]) ?? []
}

async function logoutAction() {
  'use server'
  cookies().delete(SESSION_COOKIE)
  redirect('/admin/login')
}

export default async function AdminPage() {
  if (!isAdminAuthenticated()) redirect('/admin/login')

  const [{ messages, error }, adminUsers, currentAdmin] = await Promise.all([
    getAllMessages(),
    getAllAdminUsers(),
    getCurrentAdmin(),
  ])

  const pending  = messages.filter((m) => m.status === 'pending')
  const approved = messages.filter((m) => m.status === 'approved')
  const rejected = messages.filter((m) => m.status === 'rejected')

  // Build a lookup map: admin_id -> name (for showing who approved each message)
  const approverMap = Object.fromEntries(adminUsers.map((u) => [u.id, u.name]))

  return (
    <div className="min-h-screen bg-[#faf7f0]">
      <header className="bg-white border-b border-[#e7e0d4] sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="font-serif text-lg text-stone-800">Moderation Dashboard</h1>
            <p className="text-xs text-stone-400">
              {currentAdmin ? `Signed in as ${currentAdmin.name}` : 'In Memory of Daniel Naroditsky'}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <a href="/admin/users" className="text-xs text-stone-500 hover:text-stone-800 transition-colors">
              Manage Approvers
            </a>
            <a href="/" className="text-xs text-stone-500 hover:text-stone-800 transition-colors">
              ← View Board
            </a>
            <form action={logoutAction}>
              <button type="submit" className="text-xs text-stone-400 hover:text-red-500 transition-colors">
                Sign Out
              </button>
            </form>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { label: 'Pending',  count: pending.length,  color: 'text-amber-600',  bg: 'bg-amber-50',  border: 'border-amber-200' },
            { label: 'Approved', count: approved.length, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200' },
            { label: 'Rejected', count: rejected.length, color: 'text-red-600',     bg: 'bg-red-50',    border: 'border-red-200' },
          ].map(({ label, count, color, bg, border }) => (
            <div key={label} className={`${bg} border ${border} rounded-xl p-4 text-center`}>
              <div className={`text-2xl font-serif font-light ${color}`}>{count}</div>
              <div className={`text-xs ${color} font-medium mt-0.5`}>{label}</div>
            </div>
          ))}
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 text-sm text-red-600">
            Error loading messages: {error}
          </div>
        )}

        <section className="mb-8">
          <h2 className="text-xs font-medium text-stone-500 tracking-wider uppercase mb-3 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-400 inline-block" />
            Pending Review ({pending.length})
          </h2>
          {pending.length === 0 ? (
            <div className="bg-white border border-[#e7e0d4] rounded-xl p-8 text-center text-stone-400 text-sm font-serif italic">
              No messages awaiting review.
            </div>
          ) : (
            <div className="space-y-3">
              {pending.map((msg) => <AdminMessageRow key={msg.id} message={msg} approverMap={approverMap} />)}
            </div>
          )}
        </section>

        {approved.length > 0 && (
          <section className="mb-8">
            <h2 className="text-xs font-medium text-stone-500 tracking-wider uppercase mb-3 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />
              Approved ({approved.length})
            </h2>
            <div className="space-y-3">
              {approved.map((msg) => <AdminMessageRow key={msg.id} message={msg} approverMap={approverMap} />)}
            </div>
          </section>
        )}

        {rejected.length > 0 && (
          <section>
            <h2 className="text-xs font-medium text-stone-500 tracking-wider uppercase mb-3 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-red-400 inline-block" />
              Rejected ({rejected.length})
            </h2>
            <div className="space-y-3">
              {rejected.map((msg) => <AdminMessageRow key={msg.id} message={msg} approverMap={approverMap} />)}
            </div>
          </section>
        )}
      </div>
    </div>
  )
}
