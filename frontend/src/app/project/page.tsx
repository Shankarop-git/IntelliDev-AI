'use client'

/**
 * AI Project Explainer Workspace – Milestone 5 (Flagship Feature).
 *
 * Supports:
 *   - Public GitHub Repository url input
 *   - Drag & drop ZIP archive upload input
 *   - Multi-tab preview showing:
 *       1. Architecture Diagram (renders Mermaid.js)
 *       2. Onboarding roadmap / Dev Docs (folder guides, database flow, api layouts)
 *       3. Proposed README
 *       4. Files parsed preview lists
 */

import React, { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { signOut } from 'next-auth/react'
import {
  Terminal, Layout, MessageSquare, Code2, GitFork,
  Cpu, Settings as SettingsIcon, User, LogOut,
  Upload, FileArchive, Search, Loader2, Sparkles,
  GitBranch, HelpCircle, FileText, Compass, AlertCircle, ChevronDown
} from 'lucide-react'
import MarkdownRenderer from '@/components/MarkdownRenderer'
import { fetchModels, LLMModel } from '@/services/chat-service'
import {
  explainGitHubProject,
  explainZIPProject,
  ExplainerResult
} from '@/services/project-service'

const NAV_ITEMS = [
  { href: '/dashboard', icon: Layout, label: 'Dashboard' },
  { href: '/chat', icon: MessageSquare, label: 'AI Chat' },
  { href: '/code', icon: Code2, label: 'Code Studio' },
  { href: '/github', icon: GitFork, label: 'Repo Analyzer' },
  { href: '/project', icon: Cpu, label: 'Project Explainer', active: true },
  { href: '/settings', icon: SettingsIcon, label: 'Settings' },
]

type PreviewTab = 'diagram' | 'roadmap' | 'readme' | 'files'

export default function ProjectExplainerPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login')
  }, [status, router])

  // ── States ──
  const [githubUrl, setGithubUrl] = useState('')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [model, setModel] = useState('groq:llama-3.3-70b-versatile')
  const [models, setModels] = useState<LLMModel[]>([])
  const [modelDropdownOpen, setModelDropdownOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState<ExplainerResult | null>(null)
  const [activePreviewTab, setActivePreviewTab] = useState<PreviewTab>('diagram')

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

  const handleGitHubSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!githubUrl.trim()) return
    setIsLoading(true)
    setError('')
    setResult(null)

    try {
      const res = await explainGitHubProject(githubUrl.trim(), model, geminiKey)
      setResult(res)
    } catch (err: any) {
      setError(err.message || 'Analysis failed. Make sure the URL is public.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0])
      setError('')
    }
  }

  const handleZIPSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedFile) return
    setIsLoading(true)
    setError('')
    setResult(null)

    try {
      const res = await explainZIPProject(selectedFile, model, geminiKey)
      setResult(res)
    } catch (err: any) {
      setError(err.message || 'ZIP analysis failed. Make sure it is a valid ZIP archive.')
    } finally {
      setIsLoading(false)
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

      {/* Main Container */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* Topbar */}
        <header className="flex items-center justify-between px-6 py-3 border-b border-slate-200 bg-white/80 backdrop-blur-md shrink-0">
          <div className="flex items-center gap-3">
            <Cpu className="h-5 w-5 text-indigo-500" />
            <div>
              <h1 className="font-bold text-slate-900 text-sm">AI Project Explainer</h1>
              <p className="text-[10px] text-slate-400">Generate diagrams, flowcharts, onboarding roadmaps, and README summaries.</p>
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

        {/* Dynamic upload forms grid */}
        <div className="p-6 border-b border-slate-200 bg-white shrink-0">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl">
            {/* Input 1: GitHub URL */}
            <form onSubmit={handleGitHubSubmit} className="space-y-3">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
                Option A: GitHub Repository
              </label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    value={githubUrl}
                    onChange={(e) => setGithubUrl(e.target.value)}
                    placeholder="https://github.com/owner/repo..."
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:border-slate-900 focus:outline-none"
                    disabled={isLoading}
                  />
                </div>
                <button
                  type="submit"
                  disabled={isLoading || !githubUrl.trim()}
                  className="px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 disabled:opacity-40"
                >
                  Analyze Repo
                </button>
              </div>
            </form>

            {/* Input 2: ZIP File */}
            <form onSubmit={handleZIPSubmit} className="space-y-3 border-l border-slate-200 pl-6">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
                Option B: Upload project folder (ZIP)
              </label>
              <div className="flex gap-2">
                <input
                  type="file"
                  accept=".zip"
                  onChange={handleFileChange}
                  className="block w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200"
                  disabled={isLoading}
                />
                <button
                  type="submit"
                  disabled={isLoading || !selectedFile}
                  className="px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 disabled:opacity-40 whitespace-nowrap"
                >
                  Analyze ZIP
                </button>
              </div>
            </form>
          </div>

          {error && (
            <div className="mt-4 flex items-start gap-2.5 text-sm text-red-700 bg-red-50 p-4 rounded-xl border border-red-200 max-w-4xl">
              <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Scanner Error</p>
                <p className="mt-0.5">{error}</p>
              </div>
            </div>
          )}
        </div>

        {/* Results Workspace */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50">
          {isLoading && (
            <div className="flex flex-col items-center justify-center h-full text-center py-20 text-slate-400">
              <Loader2 className="h-10 w-10 animate-spin mb-4 text-indigo-500" />
              <p className="text-sm font-semibold">Generating visual blueprint maps...</p>
              <p className="text-xs mt-1">Applying structural mapping heuristics to generate diagrams.</p>
            </div>
          )}

          {!result && !isLoading && (
            <div className="flex flex-col items-center justify-center h-full text-center py-20 text-slate-400">
              <div className="h-16 w-16 rounded-2xl bg-indigo-50 flex items-center justify-center mb-4 border border-indigo-100">
                <FileArchive className="h-8 w-8 text-indigo-500" />
              </div>
              <p className="text-sm font-medium text-slate-500">Workspace Empty</p>
              <p className="text-xs mt-1">Upload a zip archive or enter a public GitHub URL to inspect components.</p>
            </div>
          )}

          {result && (
            <div className="space-y-6 max-w-5xl">
              {/* Header cards */}
              <div className="glass bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
                <div className="space-y-1">
                  <h2 className="text-xl font-bold text-slate-900">{result.project_name}</h2>
                  <p className="text-xs text-slate-500">Checked {result.file_count} files in total</p>
                </div>
                <div className="flex gap-2">
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100">
                    Diagram Enabled
                  </span>
                </div>
              </div>

              {/* Navigation Tabs */}
              <div className="flex border-b border-slate-200 gap-6 shrink-0">
                {([
                  { id: 'diagram', label: 'Architecture Diagram', icon: GitBranch },
                  { id: 'roadmap', label: 'Developer Guide', icon: Compass },
                  { id: 'readme', label: 'Proposed README', icon: FileText },
                  { id: 'files', label: 'Files Analyzed', icon: FileArchive },
                ] as const).map(({ id, label, icon: Icon }) => (
                  <button
                    key={id}
                    onClick={() => setActivePreviewTab(id)}
                    className={`pb-3 text-xs font-bold transition-all border-b-2 flex items-center gap-2 ${
                      activePreviewTab === id
                        ? 'border-slate-950 text-slate-950'
                        : 'border-transparent text-slate-400 hover:text-slate-600'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {label}
                  </button>
                ))}
              </div>

              {/* Tab Outputs */}
              <div className="glass bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm min-h-[350px]">
                {activePreviewTab === 'diagram' && (
                  <div className="space-y-4">
                    <div className="bg-slate-50 border border-slate-100 p-4 rounded-xl text-xs text-slate-600 flex items-center gap-2">
                      <HelpCircle className="h-4 w-4 text-indigo-500 shrink-0" />
                      Copy the code block below into any Mermaid.js editor (e.g. mermaid.live) to visualize your flowchart dynamically.
                    </div>
                    <MarkdownRenderer content={result.architecture_diagram} />
                  </div>
                )}

                {activePreviewTab === 'roadmap' && (
                  <MarkdownRenderer content={result.dev_documentation} />
                )}

                {activePreviewTab === 'readme' && (
                  <MarkdownRenderer content={result.proposed_readme} />
                )}

                {activePreviewTab === 'files' && (
                  <div className="space-y-4">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Indexed File Paths</p>
                    <div className="bg-slate-900 rounded-xl p-4 max-h-96 overflow-y-auto font-mono text-[11px] text-slate-300 leading-relaxed border border-slate-800">
                      {result.files_preview.map((line, idx) => (
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
                )}
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  )
}
