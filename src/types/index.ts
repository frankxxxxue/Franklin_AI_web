export type Role = 'user' | 'assistant'

export interface Message {
  id: string
  role: Role
  content: string
}

export interface Persona {
  id: string
  name: string
  systemPrompt: string
  isBuiltin: boolean
  icon: string
}
