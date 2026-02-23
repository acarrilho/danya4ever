import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

interface NotifyAdminParams {
  messageId: string
  name: string
  content: string
  createdAt: string
  moderationToken: string
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'UTC',
    timeZoneName: 'short',
  })
}

export async function sendAdminNotification(params: NotifyAdminParams): Promise<void> {
  const { messageId, name, content, createdAt, moderationToken } = params
  const baseUrl = process.env.APP_BASE_URL ?? 'http://localhost:3000'
  const adminEmail = process.env.ADMIN_EMAIL

  if (!adminEmail) throw new Error('ADMIN_EMAIL is not set')

  const approveUrl = `${baseUrl}/api/approve?id=${messageId}&token=${moderationToken}`
  const rejectUrl = `${baseUrl}/api/reject?id=${messageId}&token=${moderationToken}`
  const adminDashboard = `${baseUrl}/admin`

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <style>
    body { font-family: Georgia, serif; background: #faf7f0; color: #1c1917; margin: 0; padding: 0; }
    .wrapper { max-width: 560px; margin: 40px auto; background: #fff; border: 1px solid #e7e0d4; border-radius: 16px; overflow: hidden; }
    .header { background: #1c1917; padding: 28px 32px; text-align: center; }
    .header h1 { color: #faf7f0; font-size: 18px; margin: 0; font-weight: 400; letter-spacing: 0.04em; }
    .header p { color: #b89a5c; font-size: 12px; margin: 6px 0 0; letter-spacing: 0.08em; text-transform: uppercase; }
    .body { padding: 32px; }
    .label { font-size: 10px; text-transform: uppercase; letter-spacing: 0.1em; color: #78716c; margin-bottom: 4px; font-family: system-ui, sans-serif; }
    .value { font-size: 15px; color: #1c1917; margin-bottom: 20px; }
    .message-box { background: #faf7f0; border: 1px solid #e7e0d4; border-radius: 12px; padding: 16px 20px; margin-bottom: 24px; }
    .message-box p { font-style: italic; font-size: 15px; line-height: 1.6; color: #44403c; margin: 0; }
    .actions { display: flex; gap: 12px; margin-top: 28px; }
    .btn { display: inline-block; padding: 12px 24px; border-radius: 10px; text-decoration: none; font-family: system-ui, sans-serif; font-size: 13px; font-weight: 500; text-align: center; }
    .btn-approve { background: #166534; color: #fff; }
    .btn-reject { background: #fef2f2; color: #991b1b; border: 1px solid #fecaca; }
    .divider { border: none; border-top: 1px solid #e7e0d4; margin: 24px 0; }
    .footer { font-family: system-ui, sans-serif; font-size: 11px; color: #a8a29e; text-align: center; padding: 0 32px 24px; }
    .footer a { color: #b89a5c; text-decoration: none; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <h1>New Memorial Message</h1>
      <p>Awaiting your approval</p>
    </div>
    <div class="body">
      <div class="label">From</div>
      <div class="value">${escapeHtml(name)}</div>

      <div class="label">Submitted</div>
      <div class="value">${formatDate(createdAt)}</div>

      <div class="label">Message</div>
      <div class="message-box">
        <p>${escapeHtml(content)}</p>
      </div>

      <div class="actions">
        <a href="${approveUrl}" class="btn btn-approve">✓ Approve Message</a>
        <a href="${rejectUrl}" class="btn btn-reject">✕ Reject Message</a>
      </div>

      <hr class="divider" />
      <p style="font-family: system-ui, sans-serif; font-size: 12px; color: #78716c; margin: 0;">
        Or visit the <a href="${adminDashboard}" style="color: #b89a5c;">admin dashboard</a> to manage all pending messages.
      </p>
    </div>
    <div class="footer">
      <p>In Memory of Daniel Naroditsky &mdash; Memorial Board</p>
    </div>
  </div>
</body>
</html>
  `.trim()

  await resend.emails.send({
    from: 'Memorial Board <notifications@yourdomain.com>',
    to: adminEmail,
    subject: `New memorial message from ${name} — awaiting approval`,
    html,
  })
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}
