'use server'

import { revalidatePath } from 'next/cache'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { isAdminAuthenticated } from '@/lib/admin-auth'

export async function approveMessage(id: string): Promise<{ error?: string }> {
  if (!isAdminAuthenticated()) return { error: 'Unauthorized' }

  const { error } = await supabaseAdmin
    .from('messages')
    .update({ status: 'approved', approved_at: new Date().toISOString() })
    .eq('id', id)

  if (error) return { error: error.message }

  revalidatePath('/admin')
  revalidatePath('/')
  return {}
}

export async function rejectMessage(id: string): Promise<{ error?: string }> {
  if (!isAdminAuthenticated()) return { error: 'Unauthorized' }

  const { error } = await supabaseAdmin
    .from('messages')
    .update({ status: 'rejected' })
    .eq('id', id)

  if (error) return { error: error.message }

  revalidatePath('/admin')
  return {}
}

export async function deleteMessage(id: string): Promise<{ error?: string }> {
  if (!isAdminAuthenticated()) return { error: 'Unauthorized' }

  const { error } = await supabaseAdmin.from('messages').delete().eq('id', id)

  if (error) return { error: error.message }

  revalidatePath('/admin')
  revalidatePath('/')
  return {}
}
