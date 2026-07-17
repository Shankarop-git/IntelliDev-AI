'use client'

/**
 * Full AI Chat page – Milestone 2.
 * Features:
 *  - Sidebar with conversation history (create, rename, delete)
 *  - Main chat area with streamed responses
 *  - Markdown + syntax-highlighted code rendering
 *  - Model selector
 *  - Export conversation to Markdown
 *  - Responsive layout
 */

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Terminal, Send, Plus, Trash2, Pencil, Check, X,
  MessageSquare, Code2, GitFork, Cpu, Settings as SettingsIcon,
  LogOut, Layout, User, Bot, Download, ChevronDown,
  RotateCcw, Sparkles
} from 'lucide-react'
import { signOut } from 'next-auth/react'
import MarkdownRenderer from '@/components/MarkdownRenderer'
import {
  fetchModels,
  streamChat,
  ChatMessage,
  LLMModel
} from '@/services/chat-service'

// ─── Types ─────────────────────────────────────────────────────────────────

interface Conversation {
  id: string
  title: string
  messages: ChatMessage[]
  createdAt: Date
}

// ─── Sidebar Nav Items ──────────────────────────────────────────────────────

const NAV_ITEMS = [
  { href: '/dashboard', icon: Layout, label: 'Dashboard' },
  { href: '/chat', icon: MessageSquare, label: 'AI Chat', active: true },
  { href: '/code', icon: Code2, label: 'Code Studio' },
  { href: '/github', icon: GitFork, label: 'Repo Analyzer' },
  { href: '/project', icon: Cpu, label: 'Project Explainer' },
  { href: '/settings', icon: SettingsIcon, label: 'Settings' },
]

// ─── Helpers ────────────────────────────────────────────────────────────────

function generateId() {
  return Math.random().toString(36).slice(2, 11)
}

function exportToMarkdown(conversation: Conversation) {
  let md = `# ${conversation.title}\n\n`
  for (const msg of conversation.messages) {
    md += `**${msg.role === 'user' ? 'You' : 'IntelliDev AI'}:**\n\n${msg.content}\n\n---\n\n`
  }
  const blob = new Blob([md], { type: 'text/markdown' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${conversation.title.replace(/\s+/g, '-')}.md`
  a.click()
  URL.revokeObjectURL(url)
}

// ─── Main Component ─────────────────────────────────────────────────────────

export default function ChatPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  // Auth guard
  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login')
  }, [status, router])

  // ── State ──
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [activeId, setActiveId] = useState<string | null>(null)
  const [input, setInput] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)
  const [models, setModels] = useState<LLMModel[]>([])
  const [selectedModel, setSelectedModel] = useState('groq:llama-3.3-70b-versatile')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [modelDropdownOpen, setModelDropdownOpen] = useState(false)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const streamingMessageRef = useRef('')

  // ── Derived state ──
  const activeConversation = conversations.find((c) => c.id === activeId)
  const geminiKey = typeof window !== 'undefined'
    ? localStorage.getItem('gemini_api_key') ?? undefined
    : undefined
  const groqKey = typeof window !== 'undefined'
    ? localStorage.getItem('groq_api_key') ?? undefined
    : undefined

  // ── Effects ──
  useEffect(() => {
    fetchModels()
      .then(setModels)
      .catch(() => console.warn('Could not fetch models – backend offline?'))
    // Auto-select saved model, or Groq if key exists, or Gemini
    const savedModel = localStorage.getItem('default_model')
    if (savedModel) {
      setSelectedModel(savedModel)
    } else if (localStorage.getItem('groq_api_key')) {
      setSelectedModel('groq:llama-3.3-70b-versatile')
    } else if (localStorage.getItem('gemini_api_key')) {
      setSelectedModel('gemini:gemini-2.5-flash')
    }
  }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [activeConversation?.messages, isStreaming])

  // ── Conversation management ──
  const createConversation = useCallback(() => {
    const conv: Conversation = {
      id: generateId(),
      title: 'New Chat',
      messages: [],
      createdAt: new Date(),
    }
    setConversations((prev) => [conv, ...prev])
    setActiveId(conv.id)
  }, [])

  useEffect(() => {
    if (conversations.length === 0) createConversation()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const deleteConversation = (id: string) => {
    setConversations((prev) => prev.filter((c) => c.id !== id))
    if (activeId === id) {
      const remaining = conversations.filter((c) => c.id !== id)
      setActiveId(remaining[0]?.id ?? null)
    }
  }

  const startRename = (conv: Conversation) => {
    setEditingId(conv.id)
    setEditTitle(conv.title)
  }

  const confirmRename = (id: string) => {
    setConversations((prev) =>
      prev.map((c) => (c.id === id ? { ...c, title: editTitle || c.title } : c))
    )
    setEditingId(null)
  }

  // ── Send message + stream ──
  const sendMessage = async () => {
    if (!input.trim() || isStreaming || !activeId) return

    const userMessage: ChatMessage = { role: 'user', content: input.trim() }
    const inputSnapshot = input.trim()
    setInput('')

    // Add user message and an empty assistant placeholder
    setConversations((prev) =>
      prev.map((c) => {
        if (c.id !== activeId) return c
        const title =
          c.messages.length === 0
            ? inputSnapshot.slice(0, 40) + (inputSnapshot.length > 40 ? '…' : '')
            : c.title
        return {
          ...c,
          title,
          messages: [
            ...c.messages,
            userMessage,
            { role: 'assistant', content: '' },
          ],
        }
      })
    )

    setIsStreaming(true)
    streamingMessageRef.current = ''

    const allMessages = [
      ...(activeConversation?.messages ?? []),
      userMessage,
    ]

    streamChat({
      messages: allMessages,
      model: selectedModel,
      geminiKey,
      groqKey,
      onChunk: (chunk) => {
        streamingMessageRef.current += chunk
        setConversations((prev) =>
          prev.map((c) => {
            if (c.id !== activeId) return c
            const msgs = [...c.messages]
            msgs[msgs.length - 1] = {
              role: 'assistant',
              content: streamingMessageRef.current,
            }
            return { ...c, messages: msgs }
          })
        )
      },
      onDone: () => {
        setIsStreaming(false)
      },
      onError: (err) => {
        setIsStreaming(false)
        setConversations((prev) =>
          prev.map((c) => {
            if (c.id !== activeId) return c
            const msgs = [...c.messages]
            msgs[msgs.length - 1] = {
              role: 'assistant',
              content: `⚠️ **Error:** ${err}\n\nMake sure your AI provider is running (Ollama) or check your API key in Settings.`,
            }
            return { ...c, messages: msgs }
          })
        )
      },
    })
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  // Auto-resize textarea
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value)
    e.target.style.height = 'auto'
    e.target.style.height = Math.min(e.target.scrollHeight, 160) + 'px'
  }

  if (status === 'loading') {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900" />
      </div>
    )
  }

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">

      {/* ── Left Sidebar ── */}
      <aside className="w-64 flex-shrink-0 border-r border-slate-200 bg-white/80 backdrop-blur-md flex flex-col">

        {/* Logo */}
        <div className="flex items-center gap-2 px-4 py-4 border-b border-slate-100">
          <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-slate-900 text-white">
            <Terminal className="h-4 w-4" />
          </div>
          <span className="font-bold text-base tracking-tight text-slate-900">IntelliDev AI</span>
        </div>

        {/* Navigation */}
        <nav className="p-3 space-y-1 border-b border-slate-100">
          {NAV_ITEMS.map(({ href, icon: Icon, label, active }) => (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                active
                  ? 'bg-slate-100 text-slate-900'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Icon className="h-4 w-4 text-slate-400" />
              {label}
            </Link>
          ))}
        </nav>

        {/* Chat History */}
        <div className="flex-1 overflow-y-auto p-3 space-y-1">
          <div className="flex items-center justify-between mb-2 px-1">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Chats</span>
            <button
              onClick={createConversation}
              className="h-6 w-6 flex items-center justify-center rounded-md hover:bg-slate-100 text-slate-500 hover:text-slate-900 transition-colors"
              title="New Chat"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>

          {conversations.map((conv) => (
            <div
              key={conv.id}
              className={`group flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-colors ${
                activeId === conv.id
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-700 hover:bg-slate-100'
              }`}
              onClick={() => setActiveId(conv.id)}
            >
              <MessageSquare className={`h-3.5 w-3.5 flex-shrink-0 ${activeId === conv.id ? 'text-slate-300' : 'text-slate-400'}`} />

              {editingId === conv.id ? (
                <div className="flex-1 flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                  <input
                    autoFocus
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && confirmRename(conv.id)}
                    className="flex-1 text-xs bg-white border border-slate-300 rounded px-1 py-0.5 text-slate-900 focus:outline-none"
                  />
                  <button onClick={() => confirmRename(conv.id)}><Check className="h-3 w-3 text-emerald-500" /></button>
                  <button onClick={() => setEditingId(null)}><X className="h-3 w-3 text-red-400" /></button>
                </div>
              ) : (
                <>
                  <span className="flex-1 text-xs truncate">{conv.title}</span>
                  <div className={`hidden group-hover:flex items-center gap-1`} onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => startRename(conv)}
                      className={`p-0.5 rounded hover:bg-white/20 ${activeId === conv.id ? 'text-slate-300' : 'text-slate-400'}`}
                    >
                      <Pencil className="h-3 w-3" />
                    </button>
                    <button
                      onClick={() => deleteConversation(conv.id)}
                      className={`p-0.5 rounded hover:bg-white/20 ${activeId === conv.id ? 'text-red-300' : 'text-red-400'}`}
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>

        {/* User Footer */}
        <div className="border-t border-slate-100 p-3 space-y-1">
          <div className="flex items-center gap-2 px-2 py-1">
            <div className="h-7 w-7 rounded-full bg-slate-200 flex items-center justify-center text-slate-500">
              <User className="h-4 w-4" />
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-xs font-semibold text-slate-800 truncate">{session?.user?.name || 'Developer'}</p>
            </div>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: '/' })}
            className="flex w-full items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium text-red-500 hover:bg-red-50 transition-colors"
          >
            <LogOut className="h-3.5 w-3.5" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* ── Main Chat Area ── */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* Topbar */}
        <header className="flex items-center justify-between px-6 py-3 border-b border-slate-200 bg-white/80 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <Sparkles className="h-5 w-5 text-indigo-500" />
            <h1 className="font-bold text-slate-900 text-sm">
              {activeConversation?.title || 'New Chat'}
            </h1>
          </div>

          <div className="flex items-center gap-3">
            {/* Model Selector */}
            <div className="relative">
              <button
                onClick={() => setModelDropdownOpen((v) => !v)}
                className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition-colors"
              >
                <span className="flex h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
                {models.find((m) => m.id === selectedModel)?.name ?? selectedModel}
                <ChevronDown className="h-3.5 w-3.5" />
              </button>

              {modelDropdownOpen && (
                <div className="absolute right-0 top-10 z-50 w-52 rounded-xl border border-slate-200 bg-white shadow-xl p-1.5">
                  {models.length === 0 ? (
                    <p className="px-3 py-2 text-xs text-slate-400">Loading models…</p>
                  ) : (
                    <>
                      {['ollama', 'gemini'].map((provider) => {
                        const group = models.filter((m) => m.provider === provider)
                        if (group.length === 0) return null
                        return (
                          <div key={provider}>
                            <p className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                              {provider}
                            </p>
                            {group.map((m) => (
                              <button
                                key={m.id}
                                onClick={() => { setSelectedModel(m.id); setModelDropdownOpen(false) }}
                                className={`w-full text-left px-3 py-2 text-xs rounded-lg transition-colors ${
                                  selectedModel === m.id
                                    ? 'bg-slate-900 text-white'
                                    : 'text-slate-700 hover:bg-slate-100'
                                }`}
                              >
                                {m.name}
                              </button>
                            ))}
                          </div>
                        )
                      })}
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Export */}
            {activeConversation && activeConversation.messages.length > 0 && (
              <button
                onClick={() => exportToMarkdown(activeConversation)}
                title="Export conversation"
                className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-500 hover:text-slate-900 transition-colors"
              >
                <Download className="h-4 w-4" />
              </button>
            )}

            {/* New Chat */}
            <button
              onClick={createConversation}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-900 text-white hover:bg-slate-800 transition-colors"
            >
              <Plus className="h-3.5 w-3.5" /> New Chat
            </button>
          </div>
        </header>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6">
          {!activeConversation || activeConversation.messages.length === 0 ? (
            /* Empty state */
            <div className="flex flex-col items-center justify-center h-full text-center py-20">
              <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center mb-4">
                <Bot className="h-8 w-8 text-indigo-600" />
              </div>
              <h2 className="text-xl font-bold text-slate-900 mb-2">Ask IntelliDev AI</h2>
              <p className="text-sm text-slate-500 max-w-sm mb-8">
                Generate code, explain concepts, debug errors, or discuss system design.
              </p>
              <div className="grid grid-cols-2 gap-3 max-w-md">
                {[
                  'Explain React Server Components',
                  'Write a FastAPI CRUD endpoint',
                  'Debug this Python error: ...',
                  'Create a PostgreSQL schema for a blog',
                ].map((prompt) => (
                  <button
                    key={prompt}
                    onClick={() => setInput(prompt)}
                    className="text-left text-xs px-3 py-2.5 rounded-xl border border-slate-200 hover:border-slate-400 hover:bg-white bg-white/60 text-slate-600 hover:text-slate-900 transition-all"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            activeConversation.messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
              >
                {/* Avatar */}
                <div className={`flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold ${
                  msg.role === 'user'
                    ? 'bg-slate-900 text-white'
                    : 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white'
                }`}>
                  {msg.role === 'user' ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                </div>

                {/* Bubble */}
                <div className={`max-w-[75%] rounded-2xl px-4 py-3 ${
                  msg.role === 'user'
                    ? 'bg-slate-900 text-white text-sm leading-relaxed'
                    : 'bg-white border border-slate-200 shadow-sm'
                }`}>
                  {msg.role === 'user' ? (
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                  ) : msg.content === '' && isStreaming ? (
                    <div className="flex items-center gap-1.5 py-1">
                      <span className="h-2 w-2 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="h-2 w-2 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="h-2 w-2 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  ) : (
                    <MarkdownRenderer content={msg.content} />
                  )}
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="border-t border-slate-200 bg-white/80 backdrop-blur-md px-4 py-4">
          <div className="max-w-3xl mx-auto">
            <div className="flex items-end gap-3 bg-white rounded-2xl border border-slate-200 shadow-sm px-4 py-3 focus-within:border-slate-400 focus-within:shadow-md transition-all">
              <textarea
                ref={textareaRef}
                rows={1}
                value={input}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                disabled={isStreaming}
                placeholder="Ask anything… (Shift+Enter for new line)"
                className="flex-1 resize-none bg-transparent text-sm text-slate-900 placeholder-slate-400 focus:outline-none leading-6 max-h-40 disabled:opacity-50"
                style={{ minHeight: '24px' }}
              />
              <button
                onClick={sendMessage}
                disabled={!input.trim() || isStreaming}
                className="flex-shrink-0 h-9 w-9 flex items-center justify-center rounded-xl bg-slate-900 text-white hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                {isStreaming ? (
                  <RotateCcw className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </button>
            </div>
            <p className="text-center text-[10px] text-slate-400 mt-2">
              IntelliDev AI uses {models.find(m => m.id === selectedModel)?.name ?? selectedModel}. Responses may contain errors — verify critical code.
            </p>
          </div>
        </div>

      </div>
    </div>
  )
}
