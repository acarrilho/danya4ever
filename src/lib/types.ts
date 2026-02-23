export type MessageStatus = 'pending' | 'approved' | 'rejected'

export interface Message {
  id: string
  name: string
  content: string
  status: MessageStatus
  created_at: string
  approved_at: string | null
}

export interface MessageInsert {
  name: string
  content: string
}

export interface AdminMessage extends Message {
  moderation_token: string
}
