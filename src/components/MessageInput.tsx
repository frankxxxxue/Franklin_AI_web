'use client'

import { KeyboardEvent, useRef, useState } from 'react'
import { Send, Square } from 'lucide-react'

interface Props {
  onSend: (text: string) => void
  onStop: () => void
  isStreaming: boolean
}

export default function MessageInput({ onSend, onStop, isStreaming }: Props) {
  const [text, setText] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const handleSend = () => {
    const trimmed = text.trim()
    if (!trimmed || isStreaming) return
    onSend(trimmed)
    setText('')
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleInput = () => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = Math.min(el.scrollHeight, 160) + 'px'
  }

  return (
    <div className="border-t border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-4">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-end gap-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-2xl px-4 py-3 focus-within:border-blue-400 dark:focus-within:border-blue-500 transition-colors">
          <textarea
            ref={textareaRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            onInput={handleInput}
            placeholder="发送消息... (Enter 发送，Shift+Enter 换行)"
            rows={1}
            disabled={false}
            className="flex-1 bg-transparent resize-none outline-none text-sm text-gray-800 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 leading-relaxed max-h-40"
          />
          <button
            onClick={isStreaming ? onStop : handleSend}
            disabled={!isStreaming && !text.trim()}
            className={`flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center transition-colors ${
              isStreaming
                ? 'bg-red-500 hover:bg-red-600 text-white'
                : text.trim()
                ? 'bg-blue-600 hover:bg-blue-700 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-400 cursor-not-allowed'
            }`}
            aria-label={isStreaming ? '停止生成' : '发送'}
          >
            {isStreaming ? <Square size={14} fill="white" /> : <Send size={15} />}
          </button>
        </div>
        <p className="text-center text-xs text-gray-300 dark:text-gray-600 mt-2">
          AI 可能出错，请核实重要信息
        </p>
      </div>
    </div>
  )
}
