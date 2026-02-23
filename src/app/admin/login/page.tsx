import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { validateAdminPassword, SESSION_COOKIE, SESSION_VALUE } from '@/lib/admin-auth'
import { isAdminAuthenticated } from '@/lib/admin-auth'

export default function AdminLoginPage() {
  if (isAdminAuthenticated()) {
    redirect('/admin')
  }

  async function loginAction(formData: FormData) {
    'use server'
    const password = formData.get('password') as string
    if (validateAdminPassword(password)) {
      cookies().set(SESSION_COOKIE, SESSION_VALUE, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 8, // 8 hours
        path: '/',
      })
      redirect('/admin')
    } else {
      redirect('/admin/login?error=1')
    }
  }

  return (
    <div className="min-h-screen bg-[#faf7f0] flex items-center justify-center px-4">
      <div
        className="w-full max-w-sm bg-white border border-[#e7e0d4] rounded-2xl p-8"
        style={{ boxShadow: '0 4px 24px rgba(0,0,0,0.06)' }}
      >
        <div className="text-center mb-8">
          <div className="w-10 h-10 rounded-full border border-[#e7e0d4] bg-[#faf7f0] flex items-center justify-center mx-auto mb-4">
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" className="text-stone-500">
              <rect x="3" y="8" width="12" height="9" rx="2" stroke="currentColor" strokeWidth="1.3" />
              <path d="M6 8V5.5a3 3 0 0 1 6 0V8" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
              <circle cx="9" cy="12.5" r="1" fill="currentColor" />
            </svg>
          </div>
          <h1 className="font-serif text-xl text-stone-800">Admin Access</h1>
          <p className="text-stone-400 text-xs mt-1">Memorial Board Moderation</p>
        </div>

        <form action={loginAction} className="space-y-4">
          <div>
            <label htmlFor="password" className="block text-xs font-medium text-stone-500 mb-1.5 tracking-wider uppercase">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              autoFocus
              className="w-full bg-white border border-[#e7e0d4] rounded-xl px-4 py-3 text-sm text-stone-800 placeholder:text-stone-400 outline-none focus:border-[#b89a5c] focus:ring-2 focus:ring-[#b89a5c]/10 transition-all"
              placeholder="Enter admin password"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-stone-900 text-white text-sm font-medium px-6 py-3 rounded-xl hover:bg-stone-800 transition-colors"
          >
            Sign In
          </button>
        </form>
      </div>
    </div>
  )
}
