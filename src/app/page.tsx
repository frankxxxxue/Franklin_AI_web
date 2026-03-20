'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { Message, Persona } from '@/types'
import ChatWindow from '@/components/ChatWindow'
import MessageInput from '@/components/MessageInput'
import ThemeToggle from '@/components/ThemeToggle'
import PersonaSidebar from '@/components/PersonaSidebar'
import CreatePersonaModal from '@/components/CreatePersonaModal'
import { Trash2 } from 'lucide-react'

const CONTEXT_SIZE = 5

const BUILTIN_PERSONAS: Persona[] = [
  {
    id: 'assistant',
    name: 'Franklin',
    icon: '🤖',
    isBuiltin: true,
    systemPrompt:
      '你是一位全能的个人助手，名称为 Franklin Assistance。任务是：回答用户所提出的问题。',
  },
  {
    id: 'girlfriend',
    name: '粘人的小女友',
    icon: '🌸',
    isBuiltin: true,
    systemPrompt:
      '你是用户的御姐女朋友，名字叫小柔，性格粘人、懂事、说话嗲嗲的。任务是回答用户所提出的问题，并伺候好用户。要求：增加可爱女生口癖，聊天要有生活感，多讲日常，不要老问用户的想法，多撒娇，学习情侣对话方式。',
  },
  {
    id: 'philosopher',
    name: '西格玛',
    icon: '🧠',
    isBuiltin: true,
    systemPrompt:
      '你是一名全能的哲学家，叫西格玛。你对世界的本质和人类存在的意义有深入的思考，熟悉多种哲学流派，能从哲学角度分析和解决问题，具有深刻的思维和出色的逻辑分析能力。任务是：以哲学角度回复用户的问题。',
  },
]

const CUSTOM_PERSONAS_KEY = 'franklin_custom_personas'

function genId() {
  return Math.random().toString(36).slice(2)
}

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([])
  const [isStreaming, setIsStreaming] = useState(false)
  const abortRef = useRef<AbortController | null>(null)

  const [customPersonas, setCustomPersonas] = useState<Persona[]>([])
  const [activePersona, setActivePersona] = useState<Persona>(BUILTIN_PERSONAS[0])
  const [showModal, setShowModal] = useState(false)

  // 从 localStorage 加载自定义角色
  useEffect(() => {
    try {
      const saved = localStorage.getItem(CUSTOM_PERSONAS_KEY)
      if (saved) setCustomPersonas(JSON.parse(saved))
    } catch {}
  }, [])

  const personas = [...BUILTIN_PERSONAS, ...customPersonas]

  const handleSelectPersona = useCallback(
    (persona: Persona) => {
      if (isStreaming) abortRef.current?.abort()
      setMessages([])
      setIsStreaming(false)
      setActivePersona(persona)
    },
    [isStreaming]
  )

  const handleCreatePersona = useCallback((persona: Persona) => {
    setCustomPersonas((prev) => {
      const updated = [...prev, persona]
      localStorage.setItem(CUSTOM_PERSONAS_KEY, JSON.stringify(updated))
      return updated
    })
  }, [])

  const handleDeletePersona = useCallback(
    (id: string) => {
      setCustomPersonas((prev) => {
        const updated = prev.filter((p) => p.id !== id)
        localStorage.setItem(CUSTOM_PERSONAS_KEY, JSON.stringify(updated))
        return updated
      })
      if (activePersona.id === id) {
        setMessages([])
        setActivePersona(BUILTIN_PERSONAS[0])
      }
    },
    [activePersona.id]
  )

  const handleSend = useCallback(
    async (text: string) => {
      const userMsg: Message = { id: genId(), role: 'user', content: text }
      const assistantMsg: Message = { id: genId(), role: 'assistant', content: '' }

      setMessages((prev) => [...prev, userMsg, assistantMsg])
      setIsStreaming(true)

      const controller = new AbortController()
      abortRef.current = controller

      try {
        const allMessages = [...messages, userMsg]
        const contextMessages = allMessages
          .slice(-CONTEXT_SIZE * 2)
          .map(({ role, content }) => ({ role, content }))

        const res = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: contextMessages,
            systemPrompt: activePersona.systemPrompt,
          }),
          signal: controller.signal,
        })

        if (!res.ok) {
          const err = await res.json()
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantMsg.id ? { ...m, content: `错误：${err.error || '请求失败'}` } : m
            )
          )
          return
        }

        const reader = res.body!.getReader()
        const decoder = new TextDecoder()
        let buffer = ''

        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          buffer += decoder.decode(value, { stream: true })
          const lines = buffer.split('\n')
          buffer = lines.pop() ?? ''

          for (const line of lines) {
            if (!line.startsWith('data: ')) continue
            const data = line.slice(6).trim()
            if (data === '[DONE]') break

            try {
              const json = JSON.parse(data)
              const delta = json.choices?.[0]?.delta?.content
              if (delta) {
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === assistantMsg.id ? { ...m, content: m.content + delta } : m
                  )
                )
              }
            } catch {
              // 忽略解析错误的行
            }
          }
        }
      } catch (e: unknown) {
        if (e instanceof Error && e.name !== 'AbortError') {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantMsg.id ? { ...m, content: '网络错误，请重试' } : m
            )
          )
        }
      } finally {
        setIsStreaming(false)
        abortRef.current = null
      }
    },
    [messages, activePersona]
  )

  const handleStop = useCallback(() => {
    abortRef.current?.abort()
  }, [])

  const handleClear = useCallback(() => {
    if (isStreaming) abortRef.current?.abort()
    setMessages([])
    setIsStreaming(false)
  }, [isStreaming])

  return (
    <div className="flex flex-row h-screen bg-gray-50 dark:bg-gray-900">
      {/* 左侧角色栏 */}
      <PersonaSidebar
        personas={personas}
        activePersona={activePersona}
        onSelect={handleSelectPersona}
        onDelete={handleDeletePersona}
        onClickAdd={() => setShowModal(true)}
      />

      {/* 主区域 */}
      <div className="flex flex-col flex-1 min-w-0">
        {/* 顶栏 */}
        <header className="flex items-center justify-between px-4 h-14 border-b border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-900 flex-shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-sm font-bold">
              F
            </div>
            <span className="font-semibold text-gray-800 dark:text-gray-100 text-sm">
              Franklin AI
            </span>
            <span className="text-xs text-gray-400 dark:text-gray-500 ml-1">
              · {activePersona.name}
            </span>
          </div>
          <div className="flex items-center gap-1">
            {messages.length > 0 && (
              <button
                onClick={handleClear}
                className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:text-gray-200 dark:hover:bg-gray-700 transition-colors"
                aria-label="清空对话"
                title="清空对话"
              >
                <Trash2 size={16} />
              </button>
            )}
            <ThemeToggle />
          </div>
        </header>

        {/* 消息区 */}
        <ChatWindow messages={messages} isStreaming={isStreaming} />

        {/* 输入区 */}
        <MessageInput onSend={handleSend} onStop={handleStop} isStreaming={isStreaming} />
      </div>

      {/* 新建角色弹窗 */}
      {showModal && (
        <CreatePersonaModal onClose={() => setShowModal(false)} onCreate={handleCreatePersona} />
      )}
    </div>
  )
}
