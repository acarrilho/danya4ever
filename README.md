# 🕊️ In Memory of Daniel Naroditsky — v3

Memorial board with CAPTCHA protection, multi-approver moderation, email notifications, and a full admin dashboard.

---

## What's New in v3

- **Multiple approvers** — any number of admin users, each notified by email
- **First-to-act wins** — one approval/rejection is enough; no quorum needed  
- **Approver tracking** — every message records *who* approved or rejected it (admin-only, never public)
- **Admin user management** — CRUD for approvers at `/admin/users`  
- **Per-user sessions** — each admin logs in with their own email + password  
- **Signed session cookies** — HMAC-SHA256 prevents cookie forgery  
- **PBKDF2-SHA512 passwords** — 100k iterations, salted hashes

---

## Architecture

```
Visitor submits message
  → Cloudflare Turnstile verified server-side
  → Message saved as status='pending'
  → ALL active approvers notified by email (parallel)
    → Each email contains unique links: approve?...&approver=<id>
  → First approver to click wins
    → status updated to 'approved'/'rejected'
    → approved_by_admin_id recorded (internal only)
  → Approved messages appear on the public board
```

---

## Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── submit/route.ts          POST: CAPTCHA + insert + notify all approvers
│   │   ├── approve/route.ts         GET:  email token link → approve + record who
│   │   ├── reject/route.ts          GET:  email token link → reject + record who
│   │   └── bootstrap/route.ts       POST: one-time first admin creation
│   ├── admin/
│   │   ├── login/page.tsx           Email + password login
│   │   ├── page.tsx                 Message moderation dashboard
│   │   ├── actions.ts               Server actions: messages + admin users
│   │   ├── AdminMessageRow.tsx      Row with approve/reject + shows who acted
│   │   └── users/
│   │       ├── page.tsx             Approver management page
│   │       ├── AdminUserRow.tsx     Row with toggle/delete/password controls
│   │       └── AddAdminUserForm.tsx Inline form to add new approver
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx                     Public board (approved messages only)
├── components/
│   ├── DanyaLogo.tsx
│   ├── MessageCard.tsx
│   ├── MessageFeed.tsx
│   ├── MessageForm.tsx              Expandable form with Turnstile CAPTCHA
│   └── TurnstileWidget.tsx
├── lib/
│   ├── admin-auth.ts                Per-user sessions, PBKDF2 hashing, signed cookies
│   ├── crypto.ts                    Secure moderation token generation
│   ├── email.ts                     Resend: one email per active approver
│   ├── supabase.ts                  Public client (anon key)
│   ├── supabase-admin.ts            Service role client (bypasses RLS)
│   ├── turnstile.ts                 Server-side CAPTCHA verification
│   └── types.ts
└── middleware.ts                    Protects /admin routes with signed-cookie check
```

---

## Setup Instructions

### 1. Install

```bash
pnpm install
```

### 2. Supabase

1. Create project at [supabase.com](https://supabase.com)
2. SQL Editor → paste and run `supabase-schema.sql`
3. Copy from **Project Settings → API**:
   - Project URL → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` key → `SUPABASE_SERVICE_ROLE_KEY`

### 3. Cloudflare Turnstile

1. [Turnstile dashboard](https://dash.cloudflare.com/turnstile) → Add site
2. Site Key → `NEXT_PUBLIC_TURNSTILE_SITE_KEY`
3. Secret Key → `TURNSTILE_SECRET_KEY`

> **Local dev test keys** (always pass):
> - Site key: `1x00000000000000000000AA`  
> - Secret: `1x0000000000000000000000000000000AA`

### 4. Resend

1. [resend.com](https://resend.com) → verify your domain
2. Create API key → `RESEND_API_KEY`
3. Update the `from` address in `src/lib/email.ts`

### 5. Environment variables

```bash
cp .env.local.example .env.local
# Fill in all values
```

Generate `SESSION_SECRET`:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 6. Create first admin user

```bash
pnpm dev
```

Then in another terminal:
```bash
curl -X POST http://localhost:3000/api/bootstrap \
  -H "Content-Type: application/json" \
  -d '{
    "secret": "<your BOOTSTRAP_SECRET>",
    "name": "Your Name",
    "email": "you@example.com",
    "password": "yourpassword"
  }'
```

**After success, remove `BOOTSTRAP_SECRET` from `.env.local`.**  
Additional approvers can be added at `/admin/users`.

### 7. Run

```bash
pnpm dev
```

- Public board: http://localhost:3000
- Admin login: http://localhost:3000/admin/login
- Admin dashboard: http://localhost:3000/admin
- Manage approvers: http://localhost:3000/admin/users

---

## Security Model

| Layer | Detail |
|-------|--------|
| CAPTCHA | Cloudflare Turnstile, server-side verification |
| Passwords | PBKDF2-SHA512, 100k iterations, random salt |
| Sessions | Signed cookies (HMAC-SHA256 + SESSION_SECRET) |
| Middleware | Edge-level cookie verification before page renders |
| RLS | Public: insert pending only, select approved only |
| Moderation tokens | 64-char hex (32 random bytes) per message |
| admin_users table | RLS blocks all public access |
| approved_by_admin_id | Never returned by public Supabase client |
| Service role | Server-side only, never sent to browser |
| Input validation | Client + server |

---

## Deployment (Vercel)

1. Push to GitHub → Import at vercel.com
2. Add environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `NEXT_PUBLIC_TURNSTILE_SITE_KEY`
   - `TURNSTILE_SECRET_KEY`
   - `RESEND_API_KEY`
   - `APP_BASE_URL` (your Vercel URL)
   - `SESSION_SECRET`
   - `BOOTSTRAP_SECRET` (remove after bootstrapping)
3. Update Turnstile allowed domains
4. Deploy, bootstrap first admin, remove `BOOTSTRAP_SECRET`

---

## Admin Workflow

**Via email**: Each submission triggers parallel emails to all active approvers. Each email has personalized Approve/Reject links. First to click wins — subsequent clicks see "already approved/rejected."

**Via dashboard** (`/admin`): Approve, reject, or delete messages. See who acted on each one.

**Manage approvers** (`/admin/users`): Add approvers (name + email + temp password), toggle active status, change passwords, delete. You cannot deactivate or delete your own account.
