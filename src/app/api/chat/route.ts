import { NextRequest } from 'next/server'

const CONTEXT_SIZE = 5 // 最近 5 轮对话

export async function POST(req: NextRequest) {
  const apiKey = process.env.GROK_API_KEY
  const apiBase = process.env.GROK_API_BASE || 'https://api.openai.com'
  const GROK_API_URL = `${apiBase}/v1/chat/completions`
  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'API key not configured' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const { messages, systemPrompt } = await req.json()

  // 截取最近 5 轮（每轮 user + assistant = 2 条），并前置 system prompt
  const contextMessages = messages.slice(-CONTEXT_SIZE * 2)
  const apiMessages = systemPrompt
    ? [{ role: 'system', content: systemPrompt }, ...contextMessages]
    : contextMessages

  const response = await fetch(GROK_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'grok-4.2',
      messages: apiMessages,
      stream: true,
      temperature: 0.7,
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    return new Response(JSON.stringify({ error }), {
      status: response.status,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  // 直接将 SSE 流管道化返回给前端
  return new Response(response.body, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  })
}
