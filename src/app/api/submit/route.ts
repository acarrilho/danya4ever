import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { verifyTurnstileToken } from '@/lib/turnstile'
import { sendApproverNotifications } from '@/lib/email'
import { generateModerationToken } from '@/lib/crypto'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { name, content, captchaToken } = body as {
      name: unknown; content: unknown; captchaToken: unknown
    }

    if (typeof name !== 'string' || name.trim().length === 0)
      return NextResponse.json({ error: 'Name is required.' }, { status: 400 })
    if (name.trim().length > 80)
      return NextResponse.json({ error: 'Name must be 80 characters or fewer.' }, { status: 400 })
    if (typeof content !== 'string' || content.trim().length < 10)
      return NextResponse.json({ error: 'Message must be at least 10 characters.' }, { status: 400 })
    if (content.trim().length > 1000)
      return NextResponse.json({ error: 'Message must be 1000 characters or fewer.' }, { status: 400 })
    if (typeof captchaToken !== 'string' || !captchaToken)
      return NextResponse.json({ error: 'CAPTCHA verification required.' }, { status: 400 })

    const captchaValid = await verifyTurnstileToken(captchaToken)
    if (!captchaValid)
      return NextResponse.json({ error: 'CAPTCHA verification failed. Please try again.' }, { status: 400 })

    const moderationToken = generateModerationToken()

    const { data: message, error: dbError } = await supabaseAdmin
      .from('messages')
      .insert({
        name: name.trim(),
        content: content.trim(),
        status: 'pending',
        moderation_token: moderationToken,
      })
      .select()
      .single()

    if (dbError || !message) {
      console.error('Supabase insert error:', dbError)
      return NextResponse.json({ error: 'Failed to save message. Please try again.' }, { status: 500 })
    }

    // Notify ALL active approvers (non-fatal)
    sendApproverNotifications({
      messageId: message.id,
      name: message.name,
      content: message.content,
      createdAt: message.created_at,
      moderationToken,
    }).catch((err) => console.error('Email notification failed:', err))

    return NextResponse.json({ success: true }, { status: 201 })
  } catch (err) {
    console.error('Submit route error:', err)
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 })
  }
}
