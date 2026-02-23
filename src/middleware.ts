import { NextRequest, NextResponse } from 'next/server'
import { verifySessionValue } from '@/lib/session'

const SESSION_COOKIE = 'admin_session'

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  if (pathname.startsWith('/admin') && !pathname.startsWith('/admin/login')) {
    const raw = req.cookies.get(SESSION_COOKIE)?.value
    const adminId = raw ? await verifySessionValue(raw) : null
    if (!adminId) {
      return NextResponse.redirect(new URL('/admin/login', req.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*'],
}
