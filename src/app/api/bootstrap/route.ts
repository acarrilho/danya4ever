/**
 * ONE-TIME bootstrap endpoint to create the very first admin user.
 *
 * Usage (only works when no admin users exist yet):
 *   POST /api/bootstrap
 *   Body: { "secret": "<BOOTSTRAP_SECRET>", "name": "...", "email": "...", "password": "..." }
 *
 * Set BOOTSTRAP_SECRET in .env.local. Remove or disable this route after first use.
 * This route is disabled automatically once any admin user exists.
 */
import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { hashPassword } from '@/lib/admin-auth'

export async function POST(req: NextRequest) {
  const bootstrapSecret = process.env.BOOTSTRAP_SECRET
  if (!bootstrapSecret) {
    return NextResponse.json({ error: 'Bootstrap is disabled.' }, { status: 403 })
  }

  const body = await req.json() as {
    secret?: string; name?: string; email?: string; password?: string
  }

  if (body.secret !== bootstrapSecret) {
    return NextResponse.json({ error: 'Invalid bootstrap secret.' }, { status: 403 })
  }

  // Only allowed when no admin users exist
  const { count } = await supabaseAdmin
    .from('admin_users')
    .select('*', { count: 'exact', head: true })

  if ((count ?? 0) > 0) {
    return NextResponse.json(
      { error: 'Admin users already exist. Use the /admin/users dashboard to add more.' },
      { status: 403 }
    )
  }

  const { name, email, password } = body
  if (!name || !email || !password) {
    return NextResponse.json({ error: 'name, email, and password are required.' }, { status: 400 })
  }
  if (password.length < 8) {
    return NextResponse.json({ error: 'Password must be at least 8 characters.' }, { status: 400 })
  }

  const password_hash = hashPassword(password)
  const { data, error } = await supabaseAdmin
    .from('admin_users')
    .insert({ name: name.trim(), email: email.toLowerCase().trim(), password_hash, is_active: true })
    .select('id, name, email')
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({
    success: true,
    message: 'First admin user created. You can now log in at /admin/login. Remove BOOTSTRAP_SECRET from your env.',
    user: data,
  }, { status: 201 })
}
