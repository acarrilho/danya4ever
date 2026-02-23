'use server'

import { revalidatePath } from 'next/cache'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { isAdminAuthenticated, getSessionAdminId, hashPassword, verifyPassword, getAdminUserByEmail } from '@/lib/admin-auth'

function requireAuth() {
  if (!isAdminAuthenticated()) throw new Error('Unauthorized')
}

// ── Message moderation ───────────────────────────────────────────────────────

export async function approveMessage(id: string): Promise<{ error?: string }> {
  requireAuth()
  const adminId = getSessionAdminId()
  const { error } = await supabaseAdmin
    .from('messages')
    .update({
      status: 'approved',
      approved_at: new Date().toISOString(),
      approved_by_admin_id: adminId,
    })
    .eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/admin')
  revalidatePath('/')
  return {}
}

export async function rejectMessage(id: string): Promise<{ error?: string }> {
  requireAuth()
  const adminId = getSessionAdminId()
  const { error } = await supabaseAdmin
    .from('messages')
    .update({ status: 'rejected', approved_by_admin_id: adminId })
    .eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/admin')
  return {}
}

export async function deleteMessage(id: string): Promise<{ error?: string }> {
  requireAuth()
  const { error } = await supabaseAdmin.from('messages').delete().eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/admin')
  revalidatePath('/')
  return {}
}

// ── Admin user management ────────────────────────────────────────────────────

export async function createAdminUser(formData: FormData): Promise<{ error?: string }> {
  requireAuth()
  const name = (formData.get('name') as string)?.trim()
  const email = (formData.get('email') as string)?.trim().toLowerCase()
  const password = formData.get('password') as string

  if (!name || !email || !password) return { error: 'All fields are required.' }
  if (password.length < 8) return { error: 'Password must be at least 8 characters.' }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { error: 'Invalid email address.' }

  const existing = await getAdminUserByEmail(email)
  if (existing) return { error: 'An admin with this email already exists.' }

  const password_hash = hashPassword(password)
  const { error } = await supabaseAdmin
    .from('admin_users')
    .insert({ name, email, password_hash, is_active: true })

  if (error) return { error: error.message }
  revalidatePath('/admin/users')
  return {}
}

export async function toggleAdminUserActive(id: string, is_active: boolean): Promise<{ error?: string }> {
  requireAuth()
  const currentAdminId = getSessionAdminId()
  if (id === currentAdminId) return { error: 'You cannot deactivate your own account.' }

  const { error } = await supabaseAdmin
    .from('admin_users')
    .update({ is_active })
    .eq('id', id)

  if (error) return { error: error.message }
  revalidatePath('/admin/users')
  return {}
}

export async function deleteAdminUser(id: string): Promise<{ error?: string }> {
  requireAuth()
  const currentAdminId = getSessionAdminId()
  if (id === currentAdminId) return { error: 'You cannot delete your own account.' }

  const { error } = await supabaseAdmin.from('admin_users').delete().eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/admin/users')
  return {}
}

export async function changeAdminPassword(
  targetId: string,
  newPassword: string
): Promise<{ error?: string }> {
  requireAuth()
  if (newPassword.length < 8) return { error: 'Password must be at least 8 characters.' }

  const password_hash = hashPassword(newPassword)
  const { error } = await supabaseAdmin
    .from('admin_users')
    .update({ password_hash })
    .eq('id', targetId)

  if (error) return { error: error.message }
  return {}
}
