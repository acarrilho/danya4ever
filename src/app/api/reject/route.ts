import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  const token = searchParams.get('token')

  if (!id || !token) {
    return new NextResponse(errorPage('Invalid rejection link.'), {
      status: 400,
      headers: { 'Content-Type': 'text/html' },
    })
  }

  const { data: message, error: fetchError } = await supabaseAdmin
    .from('messages')
    .select('id, status, moderation_token')
    .eq('id', id)
    .single()

  if (fetchError || !message) {
    return new NextResponse(errorPage('Message not found.'), {
      status: 404,
      headers: { 'Content-Type': 'text/html' },
    })
  }

  if (message.moderation_token !== token) {
    return new NextResponse(errorPage('Invalid or expired token.'), {
      status: 403,
      headers: { 'Content-Type': 'text/html' },
    })
  }

  if (message.status === 'rejected') {
    return new NextResponse(successPage('Message was already rejected.'), {
      status: 200,
      headers: { 'Content-Type': 'text/html' },
    })
  }

  const { error: updateError } = await supabaseAdmin
    .from('messages')
    .update({ status: 'rejected' })
    .eq('id', id)

  if (updateError) {
    return new NextResponse(errorPage('Failed to reject message. Please try again.'), {
      status: 500,
      headers: { 'Content-Type': 'text/html' },
    })
  }

  return new NextResponse(successPage('Message has been rejected and will not appear publicly.'), {
    status: 200,
    headers: { 'Content-Type': 'text/html' },
  })
}

function successPage(msg: string): string {
  const baseUrl = process.env.APP_BASE_URL ?? ''
  return page('✓ Done', msg, '#92400e', '#fffbeb', `<a href="${baseUrl}/admin" style="color:#b89a5c;">Go to admin dashboard</a>`)
}

function errorPage(msg: string): string {
  return page('✕ Error', msg, '#991b1b', '#fef2f2', '')
}

function page(title: string, msg: string, color: string, bg: string, extra: string): string {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>${title} — Memorial Board</title>
<style>body{font-family:Georgia,serif;background:#faf7f0;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0}
.card{background:#fff;border:1px solid #e7e0d4;border-radius:16px;padding:40px 48px;text-align:center;max-width:400px}
h2{color:${color};margin:0 0 12px;font-size:22px}
p{color:#44403c;font-size:14px;margin:0 0 16px;line-height:1.6;background:${bg};padding:12px 16px;border-radius:8px}
a{color:#b89a5c;font-size:13px}</style></head>
<body><div class="card"><h2>${title}</h2><p>${msg}</p>${extra}</div></body>
</html>`
}
