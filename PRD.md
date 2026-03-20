# Franklin AI Web — 产品需求文档（v1.1）

## 项目背景

极简 AI 对话 Web 应用，对标豆包 / 千问，通过第三方中转接入 xAI Grok（grok-4.2）。
用户打开网页即可对话，关闭页面后对话清空（不保存历史，节省成本）。

**核心决策：**
- 架构：前后端分离，API Key 存服务端，用户不可见
- 无会话管理、无历史持久化
- 上下文窗口：默认保留最近 5 轮（10 条消息）
- 用户关闭 / 刷新页面 → 当前对话全部清空
- API：第三方中转，端点 `https://api.vectorengine.ai`，协议 OpenAI Completions

---

## 当前功能（v1.1 已实现）

| 功能 | 描述 | 状态 |
|------|------|------|
| AI 流式对话 | 用户输入消息，AI 打字机效果逐字返回 | ✅ |
| 上下文记忆 | 保留最近 5 轮（10 条）发给 API，节省 Token | ✅ |
| Markdown 渲染 | 代码块高亮、表格、列表、加粗、行内代码等 | ✅ |
| 代码复制 | 代码块右上角 hover 显示复制按钮 | ✅ |
| 停止生成 | 流式输出中可随时中断 | ✅ |
| 清空对话 | 顶栏垃圾桶按钮，有消息时显示 | ✅ |
| 亮 / 暗主题 | 跟随系统或手动切换，顶栏 Sun/Moon 图标 | ✅ |
| 角色切换侧边栏 | 左侧栏切换不同 AI 人格，切换时自动清空对话 | ✅ |
| 内置角色（3个） | Franklin / 粘人的小女友 / 西格玛（详见下方） | ✅ |
| 自定义角色 | 点击 + 新建角色，填写名称 + 提示词，保存到 localStorage | ✅ |
| 自定义角色删除 | hover 显示 × 按钮，内置角色不可删除 | ✅ |
| 页面关闭清空 | 消息仅存 React state 内存，不写 localStorage | ✅ |

## 不做的功能

- ~~会话列表 / 多会话管理~~
- ~~历史对话持久化~~
- ~~用户登录~~
- ~~自定义模型参数~~

---

## 内置角色

| 角色 | 图标 | 人格定位 |
|------|------|----------|
| Franklin | 🤖 | 全能个人助手（默认），回答用户各类问题 |
| 粘人的小女友 | 🌸 | 御姐女友人格，粘人懂事，说话嗲，多撒娇，有生活感 |
| 西格玛 | 🧠 | 全能哲学家，以哲学视角分析和回答问题 |

自定义角色图标固定为 ✨，支持填写名称（最多 20 字）和提示词（最多 500 字）。

---

## 技术架构

```
用户浏览器 (Next.js 前端)
       ↓ POST /api/chat  { messages, systemPrompt }
Next.js API Route (服务端代理)
       ↓ Authorization: Bearer $GROK_API_KEY
第三方中转 api.vectorengine.ai → grok-4.2
```

- **框架**：Next.js 14（App Router）+ TypeScript
- **UI**：Tailwind CSS + shadcn/ui + lucide-react
- **Markdown**：react-markdown + remark-gfm + rehype-highlight
- **状态**：React useState（无 Zustand）
- **流式**：服务端 SSE 直接 pipe 给前端 ReadableStream
- **持久化**：自定义角色存 localStorage（key: `franklin_custom_personas`）

---

## 目录结构

```
d:\Franklin_AI_web\
├── src/
│   ├── app/
│   │   ├── layout.tsx                  # 根布局 + ThemeProvider
│   │   ├── page.tsx                    # 主页面，角色状态管理 + 对话逻辑
│   │   ├── globals.css                 # Tailwind + 代码高亮 + 滚动条样式
│   │   └── api/
│   │       └── chat/
│   │           └── route.ts            # 后端代理，注入 systemPrompt，流式转发
│   ├── components/
│   │   ├── PersonaSidebar.tsx          # 左侧角色切换栏
│   │   ├── CreatePersonaModal.tsx      # 新建自定义角色弹窗
│   │   ├── ChatWindow.tsx              # 消息滚动区 + 欢迎屏
│   │   ├── MessageBubble.tsx           # 单条消息（Markdown + 代码复制）
│   │   ├── MessageInput.tsx            # 底部输入框（自动扩高 + 三态按钮）
│   │   └── ThemeToggle.tsx             # 亮/暗主题切换
│   └── types/
│       └── index.ts                    # Message、Persona 类型定义
├── PRD.md                              # 本文档
├── .env.local                          # GROK_API_KEY / GROK_API_BASE（不提交）
├── package.json
├── tailwind.config.ts
└── tsconfig.json
```

---

## 关键实现细节

### System Prompt 注入（route.ts）
```ts
const { messages, systemPrompt } = await req.json()
const apiMessages = systemPrompt
  ? [{ role: 'system', content: systemPrompt }, ...messages.slice(-CONTEXT_SIZE * 2)]
  : messages.slice(-CONTEXT_SIZE * 2)
```

### 角色切换行为（page.tsx）
```ts
const handleSelectPersona = (persona: Persona) => {
  if (isStreaming) abortRef.current?.abort()
  setMessages([])        // 清空对话
  setActivePersona(persona)
}
```

### 自定义角色持久化（page.tsx）
```ts
// 读取
const saved = localStorage.getItem('franklin_custom_personas')
// 写入（新增 / 删除时）
localStorage.setItem('franklin_custom_personas', JSON.stringify(updated))
```

---

## UI 布局

```
┌──────────┬──────────────────────────────────────────┐
│  角色     │  Franklin AI · 粘人的小女友    [🌙][🗑️]  │
│ ──────── │ ──────────────────────────────────────── │
│ 🤖 Franklin│                                          │
│ 🌸 粘人的│   对话消息区域（流式打字机输出）            │
│    小女友 │                                          │
│ 🧠 西格玛│                                          │
│ ──────── │                                          │
│ 自定义    │                                          │
│ ✨ 我的角色│                                          │
│ ──────── │ ──────────────────────────────────────── │
│ [+]新建  │  [输入消息... Shift+Enter 换行]  [发送]   │
└──────────┴──────────────────────────────────────────┘
```

---

## 验证方式

1. `npm run dev` 启动，访问 `http://localhost:3000`
2. 左侧栏默认选中 Franklin，顶栏显示 `Franklin AI · Franklin`
3. 切换到"粘人的小女友"，对话自动清空，发消息确认回复风格符合设定
4. 切换到"西格玛"，发哲学问题，确认以哲学视角回答
5. 点击 `+` 新建自定义角色，填写名称和提示词，确认出现在列表
6. 刷新页面，自定义角色仍存在；hover 显示 × 可删除
7. 连续对话 6+ 轮，网络面板确认只传最近 10 条消息 + systemPrompt
8. 流式输出中点击停止按钮，确认中断
9. 发含代码的请求，验证代码高亮 + 复制按钮

---

## 版本记录

| 版本 | 日期 | 变更内容 |
|------|------|----------|
| v1.0 | 2026-03 | 初始版本：基础 AI 对话、流式输出、Markdown、亮暗主题 |
| v1.1 | 2026-03 | 新增角色切换侧边栏（3 个内置角色 + 自定义角色） |
