import { cookies } from 'next/headers'

const SESSION_COOKIE = 'admin_session'
const SESSION_VALUE = 'authenticated'

export function isAdminAuthenticated(): boolean {
  try {
    const cookieStore = cookies()
    const session = cookieStore.get(SESSION_COOKIE)
    return session?.value === SESSION_VALUE
  } catch {
    return false
  }
}

export function validateAdminPassword(password: string): boolean {
  const adminPassword = process.env.ADMIN_PASSWORD
  if (!adminPassword) return false
  return password === adminPassword
}

export { SESSION_COOKIE, SESSION_VALUE }
