import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { verifyTurnstileToken } from '@/lib/turnstile'
import { sendApproverNotifications } from '@/lib/email'
import { generateModerationToken } from '@/lib/crypto'
import { uploadImage } from '@/lib/cloudinary'

// 5MB limit for the incoming base64 payload (actual image after decode will be ~3.75MB)
export const maxDuration = 30

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { name, content, captchaToken, imageDataUri } = body as {
      name: unknown
      content: unknown
      captchaToken: unknown
      imageDataUri: unknown
    }

    // ── Input validation ─────────────────────────────────────────────────────
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

    // Validate image if provided
    if (imageDataUri !== undefined && imageDataUri !== null) {
      if (typeof imageDataUri !== 'string')
        return NextResponse.json({ error: 'Invalid image format.' }, { status: 400 })
      if (!imageDataUri.startsWith('data:image/'))
        return NextResponse.json({ error: 'Invalid image type.' }, { status: 400 })
      // Base64 payload size check: 5MB encoded ≈ 3.75MB actual
      if (imageDataUri.length > 5 * 1024 * 1024)
        return NextResponse.json({ error: 'Image is too large. Please use a smaller image.' }, { status: 400 })
    }

    // ── CAPTCHA verification ─────────────────────────────────────────────────
    const captchaValid = await verifyTurnstileToken(captchaToken)
    if (!captchaValid)
      return NextResponse.json({ error: 'CAPTCHA verification failed. Please try again.' }, { status: 400 })

    // ── Upload image if provided ─────────────────────────────────────────────
    let imageUrl: string | null = null
    let imagePublicId: string | null = null

    if (typeof imageDataUri === 'string' && imageDataUri.startsWith('data:image/')) {
      try {
        const uploaded = await uploadImage(imageDataUri)
        imageUrl = uploaded.url
        imagePublicId = uploaded.publicId
      } catch (err) {
        console.error('Image upload error:', err)
        return NextResponse.json(
          { error: 'Image upload failed. Please try again or submit without an image.' },
          { status: 500 }
        )
      }
    }

    // ── Insert message ───────────────────────────────────────────────────────
    const moderationToken = generateModerationToken()

    const { data: message, error: dbError } = await supabaseAdmin
      .from('messages')
      .insert({
        name: name.trim(),
        content: content.trim(),
        status: 'pending',
        moderation_token: moderationToken,
        image_url: imageUrl,
        image_public_id: imagePublicId,
      })
      .select()
      .single()

    if (dbError || !message) {
      console.error('Supabase insert error:', dbError)
      // If DB insert fails but image was uploaded, attempt cleanup
      if (imagePublicId) {
        const { deleteImage } = await import('@/lib/cloudinary')
        deleteImage(imagePublicId).catch(console.error)
      }
      return NextResponse.json({ error: 'Failed to save message. Please try again.' }, { status: 500 })
    }

    // ── Notify approvers (non-fatal) ─────────────────────────────────────────
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
