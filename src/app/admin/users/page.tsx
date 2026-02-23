import { redirect } from 'next/navigation'
import { isAdminAuthenticated, getCurrentAdmin, getSessionAdminId } from '@/lib/admin-auth'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { AdminUser } from '@/lib/types'
import AdminUserRow from './AdminUserRow'
import AddAdminUserForm from './AddAdminUserForm'

async function getAllAdminUsers(): Promise<AdminUser[]> {
  const { data } = await supabaseAdmin
    .from('admin_users')
    .select('id, name, email, is_active, created_at')
    .order('created_at', { ascending: true })
  return (data as AdminUser[]) ?? []
}

export default async function AdminUsersPage() {
  if (!isAdminAuthenticated()) redirect('/admin/login')

  const [adminUsers, currentAdmin] = await Promise.all([
    getAllAdminUsers(),
    getCurrentAdmin(),
  ])

  const currentAdminId = getSessionAdminId()
  const activeCount = adminUsers.filter((u) => u.is_active).length

  return (
    <div className="min-h-screen bg-[#faf7f0]">
      <header className="bg-white border-b border-[#e7e0d4] sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="font-serif text-lg text-stone-800">Manage Approvers</h1>
            <p className="text-xs text-stone-400">
              {activeCount} active approver{activeCount !== 1 ? 's' : ''} — all receive notification emails
            </p>
          </div>
          <div className="flex items-center gap-4">
            <a href="/admin" className="text-xs text-stone-500 hover:text-stone-800 transition-colors">
              ← Dashboard
            </a>
            <a href="/" className="text-xs text-stone-500 hover:text-stone-800 transition-colors">
              View Board
            </a>
          </div>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 py-8">

        {/* Info banner */}
        <div className="bg-[#faf7f0] border border-[#e7e0d4] rounded-xl p-4 mb-6 flex gap-3">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-[#b89a5c] shrink-0 mt-0.5">
            <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.2"/>
            <path d="M8 5v4M8 11v.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
          </svg>
          <p className="text-xs text-stone-500 leading-relaxed">
            Every active approver receives an email when a new message is submitted. 
            <strong className="text-stone-700"> Only one approval is needed</strong> — the first approver to act determines the outcome.
            Inactive approvers are not notified and cannot log in.
          </p>
        </div>

        {/* Add form */}
        <div className="mb-6">
          <AddAdminUserForm />
        </div>

        {/* User list */}
        <div>
          <h2 className="text-xs font-medium text-stone-500 tracking-wider uppercase mb-3 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-stone-400 inline-block" />
            All Approvers ({adminUsers.length})
          </h2>

          {adminUsers.length === 0 ? (
            <div className="bg-white border border-[#e7e0d4] rounded-xl p-8 text-center text-stone-400 text-sm font-serif italic">
              No approvers yet. Add one above.
            </div>
          ) : (
            <div className="space-y-3">
              {adminUsers.map((user) => (
                <AdminUserRow
                  key={user.id}
                  user={user}
                  currentAdminId={currentAdminId}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
