'use client'

/**
 * GitHub Repo Analyzer Page – Milestone 4.
 *
 * Exposes:
 *   - Input for public github URL (or owner/repo)
 *   - Scan progress skeleton and loading logs
 *   - Summary metadata (File counts, detected Tech Stack badges)
 *   - Architecture and code-quality analysis results
 *   - Interactive code Q&A side-panel chat
 */

import React, { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { signOut } from 'next-auth/react'
import {
  Terminal, Layout, MessageSquare, Code2, GitFork,
  Cpu, Settings as SettingsIcon, User, LogOut,
  Search, Loader2, Code, ShieldAlert, Sparkles,
  Bot, Send, MessageCircle, AlertCircle, FileText, ArrowRight, ChevronDown, Maximize2, Minimize2
} from 'lucide-react'
import MarkdownRenderer from '@/components/MarkdownRenderer'
import { fetchModels, ModelItem } from '@/services/chat-service'
import {
  analyzeRepository,
  askRepositoryQA,
  RepoAnalysisResult
} from '@/services/github-service'

const NAV_ITEMS = [
  { href: '/dashboard', icon: Layout, label: 'Dashboard' },
  { href: '/chat', icon: MessageSquare, label: 'AI Chat' },
  { href: '/code', icon: Code2, label: 'Code Studio' },
  { href: '/github', icon: GitFork, label: 'Repo Analyzer', active: true },
  { href: '/project', icon: Cpu, label: 'Project Explainer' },
  { href: '/settings', icon: SettingsIcon, label: 'Settings' },
]

export default function GithubPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login')
  }, [status, router])

  // ── States ──
  const [repoUrl, setRepoUrl] = useState('')
  const [model, setModel] = useState('groq:llama-3.3-70b-versatile')
  const [models, setModels] = useState<ModelItem[]>([])
  const [modelDropdownOpen, setModelDropdownOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState<RepoAnalysisResult | null>(null)

  // Q&A panel states
  const [qaInput, setQaInput] = useState('')
  const [qaHistory, setQaHistory] = useState<{ role: 'user' | 'assistant'; content: string }[]>([])
  const [isQaLoading, setIsQaLoading] = useState(false)
  const [isChatExpanded, setIsChatExpanded] = useState(false)

  const geminiKey = typeof window !== 'undefined'
    ? localStorage.getItem('gemini_api_key') ?? undefined
    : undefined

  useEffect(() => {
    fetchModels()
      .then(setModels)
      .catch(() => console.warn('Could not fetch models'))
      
    if (typeof window !== 'undefined') {
      const savedModel = localStorage.getItem('default_model')
      if (savedModel) {
        setModel(savedModel)
      } else if (localStorage.getItem('groq_api_key')) {
        setModel('groq:llama-3.3-70b-versatile')
      } else if (localStorage.getItem('gemini_api_key')) {
        setModel('gemini:gemini-2.5-flash')
      } else {
        setModel('ollama:llama3')
      }
    }
  }, [])

  const handleScan = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!repoUrl.trim()) return
    setIsLoading(true)
    setError('')
    setResult(null)
    setQaHistory([])

    try {
      const data = await analyzeRepository(repoUrl.trim(), model, geminiKey)
      setResult(data)
    } catch (err: any) {
      setError(err.message || 'Scan failed. Make sure it is a public repository.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleQA = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!qaInput.trim() || !result || isQaLoading) return

    const question = qaInput.trim()
    setQaInput('')
    setQaHistory((prev) => [...prev, { role: 'user', content: question }])
    setIsQaLoading(true)

    try {
      const qaRes = await askRepositoryQA(repoUrl.trim(), question, model, geminiKey)
      setQaHistory((prev) => [...prev, { role: 'assistant', content: qaRes.answer }])
    } catch (err: any) {
      setQaHistory((prev) => [
        ...prev,
        { role: 'assistant', content: `⚠️ Error parsing question: ${err.message}` }
      ])
    } finally {
      setIsQaLoading(false)
    }
  }

  if (status === 'loading') {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900" />
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">

      {/* Sidebar */}
      <aside className="w-64 flex-shrink-0 border-r border-slate-200 bg-white/80 backdrop-blur-md flex flex-col">
        <div className="flex items-center gap-2 px-4 py-4 border-b border-slate-100">
          <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-slate-900 text-white">
            <Terminal className="h-4 w-4" />
          </div>
          <span className="font-bold text-base tracking-tight text-slate-900">IntelliDev AI</span>
        </div>
        <nav className="p-3 space-y-1 flex-1">
          {NAV_ITEMS.map(({ href, icon: Icon, label, active }) => (
            <Link key={href} href={href} className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${active ? 'bg-slate-100 text-slate-900' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'}`}>
              <Icon className="h-4 w-4 text-slate-400" />
              {label}
            </Link>
          ))}
        </nav>
        <div className="border-t border-slate-100 p-3 space-y-1">
          <div className="flex items-center gap-2 px-2 py-1">
            <div className="h-7 w-7 rounded-full bg-slate-200 flex items-center justify-center text-slate-500"><User className="h-4 w-4" /></div>
            <p className="text-xs font-semibold text-slate-800 truncate">{session?.user?.name}</p>
          </div>
          <button onClick={() => signOut({ callbackUrl: '/' })} className="flex w-full items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium text-red-500 hover:bg-red-50 transition-colors">
            <LogOut className="h-3.5 w-3.5" /> Sign Out
          </button>
        </div>
      </aside>

      {/* Main Container split in half when scanned: Left=Report, Right=Code Q&A */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* Topbar */}
        <header className="flex items-center justify-between px-6 py-3 border-b border-slate-200 bg-white/80 backdrop-blur-md shrink-0">
          <div className="flex items-center gap-3">
            <GitFork className="h-5 w-5 text-indigo-500" />
            <div>
              <h1 className="font-bold text-slate-900 text-sm">GitHub Repository Analyzer</h1>
              <p className="text-[10px] text-slate-400">Traverse public repos, map stack properties, and chat with files.</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Model Selector */}
            <div className="relative">
              <button
                onClick={() => setModelDropdownOpen((v) => !v)}
                className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition-colors"
              >
                <span className="flex h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
                {models.find((m) => m.id === model)?.name ?? (model.split(':')[1] ?? model)}
                <ChevronDown className="h-3.5 w-3.5" />
              </button>

              {modelDropdownOpen && (
                <div className="absolute right-0 top-10 z-50 w-52 rounded-xl border border-slate-200 bg-white shadow-xl p-1.5">
                  {models.length === 0 ? (
                    <p className="px-3 py-2 text-xs text-slate-400">Loading models…</p>
                  ) : (
                    <>
                      {['ollama', 'gemini', 'groq'].map((provider) => {
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
                                onClick={() => { setModel(m.id); setModelDropdownOpen(false) }}
                                className={`w-full text-left px-3 py-2 text-xs rounded-lg transition-colors ${
                                  model === m.id
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
          </div>
        </header>

        {/* Scan Input Header */}
        <div className="p-6 border-b border-slate-200 bg-white shrink-0">
          <form onSubmit={handleScan} className="flex gap-3 max-w-3xl">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                required
                value={repoUrl}
                onChange={(e) => setRepoUrl(e.target.value)}
                placeholder="Paste public GitHub repository link (e.g. facebook/react or full HTTPS URL)..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
              />
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-slate-900 text-white text-sm font-semibold hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
              {isLoading ? 'Analyzing...' : 'Scan Repository'}
            </button>
          </form>

          {error && (
            <div className="mt-4 flex items-start gap-2.5 text-sm text-red-700 bg-red-50 p-4 rounded-xl border border-red-200 max-w-3xl">
              <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Scanner Error</p>
                <p className="mt-0.5">{error}</p>
                <p className="text-xs text-red-500 mt-2">Verify the URL is public and not locked behind credentials.</p>
              </div>
            </div>
          )}
        </div>

        {/* Panels */}
        <div className="flex-1 flex overflow-hidden">
          
          {/* Left Panel: Analysis Report */}
          <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50">
            {isLoading && (
              <div className="flex flex-col items-center justify-center h-full text-center py-20 text-slate-400">
                <Loader2 className="h-10 w-10 animate-spin mb-4 text-indigo-500" />
                <p className="text-sm font-semibold">Traversing codebase Git trees...</p>
                <p className="text-xs mt-1">This doesn't require cloning the project, scanning manifests now.</p>
              </div>
            )}

            {!result && !isLoading && (
              <div className="flex flex-col items-center justify-center h-full text-center py-20 text-slate-400">
                <div className="h-16 w-16 rounded-2xl bg-indigo-50 flex items-center justify-center mb-4 border border-indigo-100">
                  <GitFork className="h-8 w-8 text-indigo-500" />
                </div>
                <p className="text-sm font-medium text-slate-500">No active scan</p>
                <p className="text-xs mt-1">Paste a GitHub link above to scan file hierarchies.</p>
              </div>
            )}

            {result && (
              <div className="space-y-6 max-w-4xl">
                {/* Meta details */}
                <div className="glass bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex flex-wrap gap-6 items-center justify-between">
                  <div className="space-y-1">
                    <h2 className="text-xl font-bold text-slate-900">{result.owner} / {result.repo}</h2>
                    <p className="text-xs text-slate-500">Scan Complete • Checked {result.file_count} files across {result.folder_count} directories</p>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {result.tech_stack.map((stack) => (
                      <span key={stack} className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 border border-slate-200 text-slate-700">
                        {stack}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Structure Preview */}
                <div className="glass bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
                  <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
                    <Code className="h-4 w-4 text-slate-400" />
                    Detected Codebase Traversal Map
                  </h3>
                  <div className="bg-slate-900 rounded-xl p-4 max-h-48 overflow-y-auto font-mono text-[11px] text-slate-300 leading-relaxed border border-slate-800">
                    {result.tree_preview.map((line, idx) => (
                      <div key={idx} className="flex gap-2">
                        <span className="text-slate-600 w-8 select-none">{(idx + 1).toString().padStart(3, '0')}</span>
                        <span>{line}</span>
                      </div>
                    ))}
                    {result.file_count > 50 && (
                      <p className="text-slate-500 mt-2 italic">... and {result.file_count - 50} more files</p>
                    )}
                  </div>
                </div>

                {/* Analysis Report */}
                <div className="glass bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
                  <MarkdownRenderer content={result.analysis} />
                </div>
              </div>
            )}
          </div>

          {/* Right Panel: Code Q&A Sidepanel (visible when scanned) */}
          {result && (
            <div className={`border-l border-slate-200 bg-white flex flex-col justify-between overflow-hidden transition-all duration-300 ease-in-out ${isChatExpanded ? 'w-[36rem]' : 'w-80'}`}>
              <div className="px-4 py-3.5 border-b border-slate-100 flex items-center justify-between shrink-0 bg-slate-50/50">
                <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <MessageCircle className="h-4 w-4 text-indigo-500" />
                  Codebase Q&A Chat
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-[9px] font-semibold text-slate-400 bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded">
                    Contextual
                  </span>
                  <button 
                    onClick={() => setIsChatExpanded(!isChatExpanded)}
                    className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded transition-colors"
                    title={isChatExpanded ? "Collapse chat" : "Expand chat"}
                  >
                    {isChatExpanded ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
                  </button>
                </div>
              </div>

              {/* Chat messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {qaHistory.length === 0 ? (
                  <div className="text-center py-12 text-slate-400 space-y-3">
                    <Bot className="h-8 w-8 mx-auto text-slate-300" />
                    <p className="text-xs font-medium">Ask questions about this repo</p>
                    <p className="text-[10px] leading-relaxed px-4">
                      "Where is auth defined?" or "Which framework packages does it import?"
                    </p>
                  </div>
                ) : (
                  qaHistory.map((msg, idx) => (
                    <div key={idx} className={`flex flex-col gap-1.5 ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                      <span className="text-[9px] font-semibold text-slate-400 uppercase">
                        {msg.role === 'user' ? 'You' : 'Assistant'}
                      </span>
                      <div className={`text-xs p-2.5 rounded-xl border leading-relaxed ${
                        msg.role === 'user'
                          ? 'bg-slate-900 border-slate-900 text-white'
                          : 'bg-slate-50 border-slate-200 text-slate-700'
                      }`}>
                        {msg.role === 'user' ? (
                          <p className="whitespace-pre-wrap">{msg.content}</p>
                        ) : (
                          <MarkdownRenderer content={msg.content} />
                        )}
                      </div>
                    </div>
                  ))
                )}
                {isQaLoading && (
                  <div className="flex items-center gap-2 text-xs text-slate-400 py-2">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Searching structural index...
                  </div>
                )}
              </div>

              {/* Q&A Input */}
              <form onSubmit={handleQA} className="p-3 border-t border-slate-100 flex items-center gap-2 bg-slate-50/50">
                <input
                  type="text"
                  required
                  value={qaInput}
                  onChange={(e) => setQaInput(e.target.value)}
                  placeholder="Ask a question..."
                  className="flex-1 text-xs rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-900 focus:border-slate-900 focus:outline-none"
                  disabled={isQaLoading}
                />
                <button
                  type="submit"
                  disabled={!qaInput.trim() || isQaLoading}
                  className="h-8 w-8 flex items-center justify-center rounded-lg bg-slate-900 text-white hover:bg-slate-800 disabled:opacity-40"
                >
                  <Send className="h-3.5 w-3.5" />
                </button>
              </form>
            </div>
          )}

        </div>

      </div>
    </div>
  )
}
