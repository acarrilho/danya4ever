export type MessageStatus = 'pending' | 'approved' | 'rejected'

export interface Message {
  id: string
  name: string
  content: string
  status: MessageStatus
  created_at: string
  approved_at: string | null
  image_url: string | null
  // approved_by_admin_id and image_public_id are internal — never exposed on the public board
}

export interface MessageInsert {
  name: string
  content: string
  image_url?: string | null
  image_public_id?: string | null
}

export interface AdminMessage extends Message {
  moderation_token: string
  approved_by_admin_id: string | null
  image_public_id: string | null
}

// ── Admin users ──────────────────────────────────────────────────────────────

export interface AdminUser {
  id: string
  name: string
  email: string
  is_active: boolean
  created_at: string
}

// Returned from DB (password_hash never sent to client)
export interface AdminUserRow extends AdminUser {
  password_hash: string
}

export interface AdminUserInsert {
  name: string
  email: string
  password_hash: string
  is_active: boolean
}
