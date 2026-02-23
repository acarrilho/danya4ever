export interface Message {
  id: string
  name: string
  content: string
  created_at: string
}

export interface MessageInsert {
  name: string
  content: string
}
