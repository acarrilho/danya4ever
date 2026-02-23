# 🕊️ In Memory of Daniel Naroditsky

A clean, minimalist memorial board web app for Danya — built with Next.js, Tailwind CSS, and Supabase.

---

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Database**: Supabase (PostgreSQL)
- **Package Manager**: pnpm

---

## Project Structure

```
danya-memorial/
├── src/
│   ├── app/
│   │   ├── globals.css          # Global styles + Google Fonts
│   │   ├── layout.tsx           # Root layout with metadata
│   │   └── page.tsx             # Homepage (server component)
│   ├── components/
│   │   ├── DanyaLogo.tsx        # Inline SVG portrait illustration
│   │   ├── MessageCard.tsx      # Individual message display
│   │   ├── MessageFeed.tsx      # Client component: list + optimistic updates
│   │   └── MessageForm.tsx      # Client component: form with validation
│   └── lib/
│       ├── supabase.ts          # Supabase client singleton
│       └── types.ts             # TypeScript interfaces
├── supabase-schema.sql          # Run this in Supabase SQL editor
├── .env.local.example           # Copy to .env.local and fill in values
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

---

## Setup Instructions

### 1. Clone & Install

```bash
git clone <your-repo>
cd danya-memorial

# Install pnpm if you don't have it
npm install -g pnpm

# Install dependencies
pnpm install
```

### 2. Set Up Supabase

1. Create a free project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** in your project dashboard
3. Paste and run the contents of `supabase-schema.sql`
4. Go to **Project Settings → API** and copy:
   - **Project URL**
   - **anon / public** key

### 3. Configure Environment Variables

```bash
cp .env.local.example .env.local
```

Edit `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

### 4. Run Locally

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Supabase RLS Policies

The schema sets up the following Row Level Security policies:

| Policy | Operation | Access |
|--------|-----------|--------|
| Public can read messages | SELECT | Anyone |
| Public can insert messages | INSERT | Anyone (with length validation) |
| No public updates | UPDATE | Blocked |
| No public deletes | DELETE | Blocked |

---

## Deployment (Vercel)

1. Push your code to GitHub
2. Import the project at [vercel.com](https://vercel.com)
3. Add environment variables in Vercel dashboard:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Deploy

Vercel auto-detects Next.js — no extra configuration needed.

---

## Features

- ✅ Server-rendered message feed (newest first)
- ✅ Optimistic UI update on message submit
- ✅ Client-side validation (name + content)
- ✅ Loading, success, and error states
- ✅ Empty state
- ✅ Character counter
- ✅ Illustrated SVG logo (line-art portrait)
- ✅ Elegant serif typography (Cormorant Garamond)
- ✅ Warm ivory color palette with grain texture
- ✅ Smooth card hover animations
- ✅ Fully typed (TypeScript)
- ✅ RLS-protected Supabase backend

---

## License

Built with love and respect. All rights reserved.
