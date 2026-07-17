'use client'

/**
 * Code Studio – Milestone 3+.
 *
 * Tabs:
 *   - Execute (NEW) – write code, run it, see real stdout/stderr output
 *   - Generate, Explain, Debug, Review, Refactor, Optimize
 *   - Translate, REST API Generator, SQL Generator, Error Explainer
 */

import React, { useState, useRef, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { signOut } from 'next-auth/react'
import {
  Terminal, Layout, MessageSquare, Code2, GitFork,
  Cpu, Settings as SettingsIcon, User, LogOut,
  Play, Copy, Check, Download, ChevronDown, Loader2,
  Wand2, Bug, Eye, ShieldCheck, RefreshCw, Zap,
  ArrowLeftRight, Globe, Database, AlertCircle, X,
  Square, Clock, CheckCircle2, XCircle, Sparkles
} from 'lucide-react'
import MarkdownRenderer from '@/components/MarkdownRenderer'
import * as codeApi from '@/services/code-service'

// ─── Nav ─────────────────────────────────────────────────────────────────────

const NAV_ITEMS = [
  { href: '/dashboard', icon: Layout, label: 'Dashboard' },
  { href: '/chat', icon: MessageSquare, label: 'AI Chat' },
  { href: '/code', icon: Code2, label: 'Code Studio', active: true },
  { href: '/github', icon: GitFork, label: 'Repo Analyzer' },
  { href: '/project', icon: Cpu, label: 'Project Explainer' },
  { href: '/settings', icon: SettingsIcon, label: 'Settings' },
]

// ─── Tab Definitions ─────────────────────────────────────────────────────────

type TabId =
  | 'execute'
  | 'generate'
  | 'explain'
  | 'debug'
  | 'review'
  | 'refactor'
  | 'optimize'
  | 'translate'
  | 'generate_api'
  | 'generate_sql'
  | 'explain_error'

interface Tab {
  id: TabId
  label: string
  icon: React.FC<{ className?: string }>
  inputLabel: string
  inputPlaceholder: string
  isPromptBased?: boolean
  isSql?: boolean
  isTranslate?: boolean
  isExecute?: boolean
}

const TABS: Tab[] = [
  {
    id: 'execute',
    label: 'Execute',
    icon: Terminal,
    inputLabel: 'Write code to execute',
    inputPlaceholder: 'print("Hello, World!")\nfor i in range(5):\n    print(f"Number: {i}")',
    isExecute: true,
  },
  {
    id: 'generate',
    label: 'Generate',
    icon: Wand2,
    inputLabel: 'Describe what you want to build',
    inputPlaceholder: 'e.g. A Python FastAPI endpoint that accepts a user ID and returns their profile from PostgreSQL...',
    isPromptBased: true,
  },
  {
    id: 'explain',
    label: 'Explain',
    icon: Eye,
    inputLabel: 'Paste code to explain',
    inputPlaceholder: 'Paste your code here...',
  },
  {
    id: 'debug',
    label: 'Debug',
    icon: Bug,
    inputLabel: 'Paste code or error to debug',
    inputPlaceholder: 'Paste buggy code or error output...',
  },
  {
    id: 'review',
    label: 'Review',
    icon: ShieldCheck,
    inputLabel: 'Paste code to review',
    inputPlaceholder: 'Paste code for review...',
  },
  {
    id: 'refactor',
    label: 'Refactor',
    icon: RefreshCw,
    inputLabel: 'Paste code to refactor',
    inputPlaceholder: 'Paste code to refactor...',
  },
  {
    id: 'optimize',
    label: 'Optimize',
    icon: Zap,
    inputLabel: 'Paste code to optimize',
    inputPlaceholder: 'Paste code to optimize for performance...',
  },
  {
    id: 'translate',
    label: 'Translate',
    icon: ArrowLeftRight,
    inputLabel: 'Paste code to translate',
    inputPlaceholder: 'Paste code here to translate to another language...',
    isTranslate: true,
  },
  {
    id: 'generate_api',
    label: 'REST API',
    icon: Globe,
    inputLabel: 'Describe your REST API',
    inputPlaceholder: 'e.g. A CRUD API for a blog with posts, comments, users...',
    isPromptBased: true,
  },
  {
    id: 'generate_sql',
    label: 'SQL',
    icon: Database,
    inputLabel: 'Describe the SQL query you need',
    inputPlaceholder: 'e.g. Get all users who signed up in the last 30 days and made a purchase...',
    isPromptBased: true,
    isSql: true,
  },
  {
    id: 'explain_error',
    label: 'Error',
    icon: AlertCircle,
    inputLabel: 'Paste error message or traceback',
    inputPlaceholder: 'Paste compiler/runtime error here...',
    isPromptBased: true,
  },
]

// ─── Language Options ─────────────────────────────────────────────────────────

const LANGUAGES = [
  'Python', 'JavaScript', 'TypeScript', 'Java', 'C++', 'C#', 'Go',
  'Rust', 'Ruby', 'PHP', 'Swift', 'Kotlin', 'HTML', 'CSS', 'SQL',
  'Bash', 'PowerShell', 'R', 'Scala', 'Dart',
]

// Executable languages that our backend /execute endpoint supports
const EXECUTABLE_LANGUAGES = ['Python', 'JavaScript', 'TypeScript', 'Java', 'C++', 'Go', 'Rust', 'Bash']

// ─── Execute Terminal Component ───────────────────────────────────────────────

interface ExecuteResult {
  stdout: string
  stderr: string
  exit_code: number
  execution_time: number
  language: string
}

function ExecutePane({ language }: { language: string }) {
  const [code, setCode] = useState(`# Write your ${language} code here`)
  const [stdinInput, setStdinInput] = useState('')
  const [result, setResult] = useState<ExecuteResult | null>(null)
  const [running, setRunning] = useState(false)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)
  const [showStdin, setShowStdin] = useState(false)
  const outputRef = useRef<HTMLDivElement>(null)

  // Update starter code when language changes
  useEffect(() => {
    if (language === 'Python') {
      setCode(`# Python Example\nprint("Hello, World!")\n\nfor i in range(1, 6):\n    print(f"Line {i}: {'*' * i}")`)
    } else if (language === 'JavaScript') {
      setCode(`// JavaScript Example\nconsole.log("Hello, World!");\n\nfor (let i = 1; i <= 5; i++) {\n  console.log("Line " + i + ": " + "*".repeat(i));\n}`)
    } else if (language === 'TypeScript') {
      setCode(`// TypeScript Example\nconst message: string = "Hello, World!";\nconsole.log(message);\n\ninterface User {\n  name: string;\n  role: string;\n}\nconst u: User = { name: "Developer", role: "Admin" };\nconsole.log(\`User: \${u.name} | Role: \${u.role}\`);`)
    } else if (language === 'Java') {
      setCode(`// Java Example\npublic class Main {\n    public static void main(String[] args) {\n        System.out.println("Hello, World!");\n        for (int i = 1; i <= 5; i++) {\n            System.out.println("Line " + i);\n        }\n    }\n}`)
    } else if (language === 'C++') {
      setCode(`// C++ Example\n#include <iostream>\nusing namespace std;\n\nint main() {\n    cout << "Hello, World!" << endl;\n    for(int i = 1; i <= 5; ++i) {\n        cout << "Line " << i << endl;\n    }\n    return 0;\n}`)
    } else if (language === 'Go') {
      setCode(`// Go Example\npackage main\n\nimport "fmt"\n\nfunc main() {\n    fmt.Println("Hello, World!")\n    for i := 1; i <= 5; i++ {\n        fmt.Printf("Line %d\\n", i)\n    }\n}`)
    } else if (language === 'Rust') {
      setCode(`// Rust Example\nfn main() {\n    println!("Hello, World!");\n    for i in 1..=5 {\n        println!("Line {}", i);\n    }\n}`)
    } else if (language === 'Bash') {
      setCode(`#!/bin/bash\necho "Hello, World!"\n\nfor i in 1 2 3 4 5; do\n  echo "Line $i"\ndone`)
    }
    setResult(null)
    setError('')
  }, [language])

  const handleRun = async () => {
    if (!code.trim()) return
    setRunning(true)
    setResult(null)
    setError('')
    try {
      const res = await codeApi.executeCode(code, language.toLowerCase(), stdinInput)
      setResult(res)
      setTimeout(() => outputRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
    } catch (err: any) {
      setError(err.message || 'Execution failed')
    } finally {
      setRunning(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Ctrl+Enter or Cmd+Enter to run
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault()
      handleRun()
    }
    // Tab key inserts spaces
    if (e.key === 'Tab') {
      e.preventDefault()
      const ta = e.target as HTMLTextAreaElement
      const start = ta.selectionStart
      const end = ta.selectionEnd
      const newVal = code.substring(0, start) + '    ' + code.substring(end)
      setCode(newVal)
      setTimeout(() => { ta.selectionStart = ta.selectionEnd = start + 4 }, 0)
    }
  }

  const success = result !== null && result.exit_code === 0
  const hasOutput = result && (result.stdout || result.stderr)

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center gap-3 px-4 py-2.5 border-b border-slate-100 bg-white/80 shrink-0 flex-wrap gap-y-2">
        <div className="flex items-center gap-2">
          <div className={`h-2 w-2 rounded-full ${running ? 'bg-amber-400 animate-pulse' : 'bg-emerald-400'}`} />
          <span className="text-xs font-semibold text-slate-600">{language} Runtime</span>
        </div>
        <span className="text-xs text-slate-400 hidden sm:block">Press Ctrl+Enter to run</span>
        <div className="ml-auto flex items-center gap-2">
          {result && (
            <span className="text-xs text-slate-400 flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {result.execution_time}s
            </span>
          )}
          <button
            onClick={() => { setCode(''); setResult(null); setError('') }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors"
          >
            <Square className="h-3 w-3" />
            Clear
          </button>
          <button
            onClick={handleRun}
            disabled={running || !code.trim()}
            className="flex items-center gap-2 px-4 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm"
          >
            {running ? (
              <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Running…</>
            ) : (
              <><Play className="h-3.5 w-3.5 fill-white" /> Run</>
            )}
          </button>
        </div>
      </div>

      {/* Editor + Output */}
      <div className="flex flex-col flex-1 min-h-0">
        {/* Code Editor */}
        <div className="flex-1 min-h-0 relative">
          <div className="absolute inset-0 flex">
            {/* Line numbers */}
            <div className="select-none bg-slate-900 text-slate-500 font-mono text-xs leading-relaxed py-4 px-3 text-right min-w-[3rem] overflow-hidden border-r border-slate-700">
              {code.split('\n').map((_, i) => (
                <div key={i} className="h-[1.4rem]">{i + 1}</div>
              ))}
            </div>
            {/* Textarea */}
            <textarea
              value={code}
              onChange={(e) => setCode(e.target.value)}
              onKeyDown={handleKeyDown}
              spellCheck={false}
              className="flex-1 resize-none bg-slate-900 text-slate-100 font-mono text-xs leading-relaxed p-4 focus:outline-none overflow-auto"
              style={{ lineHeight: '1.4rem' }}
              placeholder="Write your code here..."
            />
          </div>
        </div>

        {/* Stdin Input (collapsible) */}
        <div className="shrink-0 border-t border-slate-700 bg-slate-900">
          <button
            onClick={() => setShowStdin(!showStdin)}
            className="w-full flex items-center justify-between px-4 py-2 text-xs text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          >
            <span className="flex items-center gap-2">
              <span className="font-mono text-amber-400">stdin</span>
              <span>Program Input (for cin, input(), Scanner, etc.)</span>
              {stdinInput && <span className="bg-amber-500/20 text-amber-400 border border-amber-500/30 px-1.5 py-0.5 rounded text-[10px] font-semibold">{stdinInput.trim().split('\n').length} line(s)</span>}
            </span>
            <ChevronDown className={`h-3.5 w-3.5 transition-transform ${showStdin ? 'rotate-180' : ''}`} />
          </button>
          {showStdin && (
            <div className="px-4 pb-3">
              <textarea
                value={stdinInput}
                onChange={(e) => setStdinInput(e.target.value)}
                placeholder={`Type your program input here, one value per line.\nExample:\n5`}
                rows={4}
                className="w-full resize-none bg-slate-800 text-slate-200 font-mono text-xs leading-relaxed p-3 rounded-lg border border-slate-600 focus:outline-none focus:border-amber-500 placeholder-slate-500"
              />
            </div>
          )}
        </div>

        {/* Output Terminal */}
        <div ref={outputRef} className="shrink-0 border-t border-slate-700 bg-slate-950 min-h-[160px] max-h-[45%] flex flex-col">
          {/* Terminal Header */}
          <div className="flex items-center justify-between px-4 py-2 bg-slate-900 border-b border-slate-700 shrink-0">
            <div className="flex items-center gap-2">
              <div className="flex gap-1.5">
                <div className="h-2.5 w-2.5 rounded-full bg-red-500" />
                <div className="h-2.5 w-2.5 rounded-full bg-yellow-500" />
                <div className="h-2.5 w-2.5 rounded-full bg-green-500" />
              </div>
              <span className="text-xs text-slate-400 font-mono ml-2">Terminal Output</span>
              {result && (
                <span className={`flex items-center gap-1 text-xs font-semibold ml-2 ${success ? 'text-emerald-400' : 'text-red-400'}`}>
                  {success
                    ? <><CheckCircle2 className="h-3 w-3" /> Exit 0 (Success)</>
                    : <><XCircle className="h-3 w-3" /> Exit {result.exit_code} (Error)</>
                  }
                </span>
              )}
            </div>
            {hasOutput && (
              <button
                onClick={async () => {
                  const txt = [result!.stdout, result!.stderr].filter(Boolean).join('\n')
                  await navigator.clipboard.writeText(txt)
                  setCopied(true)
                  setTimeout(() => setCopied(false), 2000)
                }}
                className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-200 transition-colors"
              >
                {copied ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                {copied ? 'Copied' : 'Copy'}
              </button>
            )}
          </div>

          {/* Terminal Body */}
          <div className="flex-1 overflow-y-auto p-4 font-mono text-xs leading-relaxed">
            {/* Error from network/backend */}
            {error && (
              <p className="text-red-400">⚠ {error}</p>
            )}

            {/* Idle state */}
            {!running && !result && !error && (
              <p className="text-slate-500 italic">▶ Click Run or press Ctrl+Enter to execute your code…</p>
            )}

            {/* Running indicator */}
            {running && (
              <p className="text-amber-400 animate-pulse">⏳ Executing {language} code…</p>
            )}

            {/* stdout */}
            {result?.stdout && (
              <pre className="text-emerald-300 whitespace-pre-wrap break-words">{result.stdout}</pre>
            )}

            {/* stderr */}
            {result?.stderr && (
              <pre className={`whitespace-pre-wrap break-words ${result.exit_code !== 0 ? 'text-red-400' : 'text-yellow-400'}`}>
                {result.stderr}
              </pre>
            )}

            {/* Empty output */}
            {result && !result.stdout && !result.stderr && (
              <p className="text-slate-500 italic">(No output produced)</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Main Component ────────────────────────────────────────────────────────────

export default function CodeStudioPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  React.useEffect(() => {
    if (status === 'unauthenticated') router.push('/login')
  }, [status, router])

  const [activeTab, setActiveTab] = useState<TabId>('execute')
  const [input, setInput] = useState('')
  const [language, setLanguage] = useState('Python')
  const [targetLanguage, setTargetLanguage] = useState('JavaScript')
  const [model, setModel] = useState(
    typeof window !== 'undefined'
      ? localStorage.getItem('default_model') ?? 'groq:llama-3.3-70b-versatile'
      : 'groq:llama-3.3-70b-versatile'
  )
  const [output, setOutput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)
  const [langDropdown, setLangDropdown] = useState(false)
  const [targetLangDropdown, setTargetLangDropdown] = useState(false)
  const [featureDropdownOpen, setFeatureDropdownOpen] = useState(false)
  const [execLangDropdown, setExecLangDropdown] = useState(false)

  const tab = TABS.find((t) => t.id === activeTab)!
  const geminiKey =
    typeof window !== 'undefined'
      ? localStorage.getItem('gemini_api_key') ?? undefined
      : undefined
  const groqKey =
    typeof window !== 'undefined'
      ? localStorage.getItem('groq_api_key') ?? undefined
      : undefined

  // ── Run AI tabs ──────────────────────────────────────────────────────────────
  const handleRun = async () => {
    if (!input.trim()) return
    setIsLoading(true)
    setError('')
    setOutput('')

    try {
      let res: { result: string }

      switch (activeTab) {
        case 'generate':
          res = await codeApi.generateCode(input, language, model, geminiKey)
          break
        case 'explain':
          res = await codeApi.explainCode(input, language, model, geminiKey)
          break
        case 'debug':
          res = await codeApi.debugCode(input, language, model, geminiKey)
          break
        case 'review':
          res = await codeApi.reviewCode(input, language, model, geminiKey)
          break
        case 'refactor':
          res = await codeApi.refactorCode(input, language, model, geminiKey)
          break
        case 'optimize':
          res = await codeApi.optimizeCode(input, language, model, geminiKey)
          break
        case 'translate':
          res = await codeApi.translateCode(input, language, targetLanguage, model, geminiKey)
          break
        case 'generate_api':
          res = await codeApi.generateAPI(input, language, model, geminiKey)
          break
        case 'generate_sql':
          res = await codeApi.generateSQL(input, model, geminiKey)
          break
        case 'explain_error':
          res = await codeApi.explainError(input, language, model, geminiKey)
          break
        default:
          res = { result: '' }
      }

      setOutput(res.result)
    } catch (err: any) {
      setError(err.message || 'Something went wrong')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCopyOutput = async () => {
    await navigator.clipboard.writeText(output)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleDownloadOutput = () => {
    const blob = new Blob([output], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${activeTab}-output.md`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleTabChange = (id: TabId) => {
    setActiveTab(id)
    setInput('')
    setOutput('')
    setError('')
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

      {/* ── Sidebar ── */}
      <aside className="w-64 flex-shrink-0 border-r border-slate-200 bg-white/80 backdrop-blur-md flex flex-col">
        <div className="flex items-center gap-2 px-4 py-4 border-b border-slate-100">
          <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-slate-900 text-white">
            <Terminal className="h-4 w-4" />
          </div>
          <span className="font-bold text-slate-900 text-sm tracking-tight">IntelliDev AI</span>
        </div>
          {NAV_ITEMS.map(({ href, icon: Icon, label, active }) => {
            const isCodeStudio = label === 'Code Studio'
            return (
              <div key={href} className="space-y-1">
                <Link
                  href={href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    active
                      ? 'bg-slate-900 text-white shadow-sm'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <Icon className="h-4 w-4 flex-shrink-0" />
                  <span className="flex-1">{label}</span>
                </Link>
                {isCodeStudio && active && (
                  <div className="pl-4 pr-1 py-1.5 space-y-1 border-l border-slate-200 ml-5">
                    {TABS.map(({ id, label: tabLabel, icon: TabIcon }) => (
                      <button
                        key={id}
                        onClick={() => handleTabChange(id)}
                        className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-left text-xs transition-colors ${
                          activeTab === id
                            ? id === 'execute'
                              ? 'bg-emerald-50 text-emerald-700 font-semibold border-l-2 border-emerald-500 rounded-l-none'
                              : 'bg-slate-100 text-slate-900 font-semibold border-l-2 border-slate-900 rounded-l-none'
                            : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                        }`}
                      >
                        <TabIcon className="h-3.5 w-3.5 flex-shrink-0" />
                        <span className="truncate">{tabLabel}</span>
                        {id === 'execute' && (
                          <span className="text-[9px] px-1 bg-emerald-100 text-emerald-700 rounded font-bold ml-auto shrink-0">NEW</span>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        <div className="p-3 border-t border-slate-100">
          <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-100 mb-2">
            <div className="h-7 w-7 rounded-full bg-slate-900 text-white flex items-center justify-center flex-shrink-0">
              <User className="h-3.5 w-3.5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-slate-900 truncate">{session?.user?.name ?? 'Developer'}</p>
              <p className="text-[10px] text-slate-500 truncate">{session?.user?.email ?? ''}</p>
            </div>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: '/login' })}
            className="flex items-center gap-2 w-full px-3 py-2 rounded-xl text-sm text-slate-500 hover:bg-red-50 hover:text-red-600 transition-colors"
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* ── Main Content ── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* Header */}
        <header className="flex items-center justify-between px-6 py-3.5 border-b border-slate-200 bg-white/80 backdrop-blur-md shrink-0">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-sm">
              <Code2 className="h-4 w-4 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-slate-900 text-sm">Code Studio — {tab.label}</h1>
              <p className="text-[11px] text-slate-500">Write · Run · Analyze</p>
            </div>
          </div>
        </header>

        {/* ── Execute Tab ── */}
        {activeTab === 'execute' && (
          <div className="flex-1 flex flex-col min-h-0">
            {/* Language selector for execute */}
            <div className="flex items-center gap-3 px-4 py-2 border-b border-slate-200 bg-white shrink-0">
              <span className="text-xs font-semibold text-slate-500">Language:</span>
              <div className="relative">
                <button
                  onClick={() => setExecLangDropdown((v) => !v)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-all shadow-sm"
                >
                  {language}
                  <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
                </button>
                {execLangDropdown && (
                  <div className="absolute top-10 left-0 z-50 w-36 rounded-xl border border-slate-200 bg-white shadow-xl p-1.5">
                    {EXECUTABLE_LANGUAGES.map((lang) => (
                      <button
                        key={lang}
                        onClick={() => { setLanguage(lang); setExecLangDropdown(false) }}
                        className={`w-full px-3 py-1.5 text-xs rounded-lg text-left transition-colors ${language === lang ? 'bg-slate-900 text-white font-semibold' : 'text-slate-700 hover:bg-slate-100'}`}
                      >
                        {lang}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <span className="ml-auto text-xs text-slate-400 flex items-center gap-1">
                <Sparkles className="h-3 w-3 text-violet-400" />
                Real execution on your local server
              </span>
            </div>
            <ExecutePane language={language} />
          </div>
        )}

        {/* ── AI Tabs ── */}
        {activeTab !== 'execute' && (
          <div className="flex-1 flex min-h-0 overflow-hidden divide-x divide-slate-200">

            {/* Left Pane: Input */}
            <div className="flex-1 flex flex-col min-w-0">
              {/* Input toolbar */}
              <div className="flex items-center gap-3 px-4 py-2.5 border-b border-slate-100 bg-white/60 shrink-0 flex-wrap gap-y-2">
                <span className="text-xs font-semibold text-slate-500">Language:</span>

                {/* Language Selector */}
                {!tab.isSql && (
                  <div className="relative">
                    <button
                      onClick={() => setLangDropdown((v) => !v)}
                      className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                    >
                      {language}
                      <ChevronDown className="h-3 w-3" />
                    </button>
                    {langDropdown && (
                      <div className="absolute top-9 left-0 z-50 w-44 rounded-xl border border-slate-200 bg-white shadow-xl p-1.5 grid grid-cols-2 gap-0.5 max-h-60 overflow-y-auto">
                        {LANGUAGES.map((lang) => (
                          <button
                            key={lang}
                            onClick={() => { setLanguage(lang); setLangDropdown(false) }}
                            className={`px-2 py-1.5 text-xs rounded-lg text-left transition-colors ${language === lang ? 'bg-slate-900 text-white' : 'text-slate-700 hover:bg-slate-100'}`}
                          >
                            {lang}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Target Language for Translate */}
                {tab.isTranslate && (
                  <>
                    <span className="text-xs text-slate-400">→</span>
                    <div className="relative">
                      <button
                        onClick={() => setTargetLangDropdown((v) => !v)}
                        className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-indigo-200 bg-indigo-50 text-xs font-semibold text-indigo-700 hover:bg-indigo-100 transition-colors"
                      >
                        {targetLanguage}
                        <ChevronDown className="h-3 w-3" />
                      </button>
                      {targetLangDropdown && (
                        <div className="absolute top-9 left-0 z-50 w-44 rounded-xl border border-slate-200 bg-white shadow-xl p-1.5 grid grid-cols-2 gap-0.5 max-h-60 overflow-y-auto">
                          {LANGUAGES.map((lang) => (
                            <button
                              key={lang}
                              onClick={() => { setTargetLanguage(lang); setTargetLangDropdown(false) }}
                              className={`px-2 py-1.5 text-xs rounded-lg text-left transition-colors ${targetLanguage === lang ? 'bg-indigo-600 text-white' : 'text-slate-700 hover:bg-slate-100'}`}
                            >
                              {lang}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </>
                )}

                <div className="ml-auto">
                  <button
                    onClick={handleRun}
                    disabled={!input.trim() || isLoading}
                    className="flex items-center gap-2 px-4 py-1.5 rounded-lg bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                  >
                    {isLoading ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Play className="h-3.5 w-3.5" />
                    )}
                    {isLoading ? 'Running…' : 'Run'}
                  </button>
                </div>
              </div>

              {/* Textarea */}
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={tab.inputPlaceholder}
                className="flex-1 resize-none bg-slate-50 p-4 text-sm text-slate-900 placeholder-slate-400 focus:outline-none font-mono leading-relaxed"
                spellCheck={false}
              />
            </div>

            {/* Right Pane: AI Output */}
            <div className="flex-1 flex flex-col min-w-0">
              {/* Output Toolbar */}
              <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-100 bg-white/60 shrink-0">
                <span className="text-xs font-semibold text-slate-500">
                  {output ? 'AI Output' : 'Output will appear here'}
                </span>
                {output && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleCopyOutput}
                      className="flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-slate-900 transition-colors"
                    >
                      {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                      {copied ? 'Copied' : 'Copy'}
                    </button>
                    <button
                      onClick={handleDownloadOutput}
                      className="flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-slate-900 transition-colors"
                    >
                      <Download className="h-3.5 w-3.5" />
                      Download
                    </button>
                    <button onClick={() => setOutput('')} className="text-slate-400 hover:text-red-500 transition-colors">
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}
              </div>

              {/* Output Content */}
              <div className="flex-1 overflow-y-auto p-4 bg-white">
                {error && (
                  <div className="flex items-start gap-3 p-4 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700 mb-4">
                    <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold mb-1">Error</p>
                      <p>{error}</p>
                      <p className="text-xs mt-2 text-red-500">Make sure your AI provider is configured in Settings.</p>
                    </div>
                  </div>
                )}

                {isLoading && !output && (
                  <div className="flex flex-col items-center justify-center h-full text-center py-20 text-slate-400">
                    <Loader2 className="h-10 w-10 animate-spin mb-4 text-indigo-500" />
                    <p className="text-sm font-medium">Generating response…</p>
                    <p className="text-xs mt-1">This may take a few seconds</p>
                  </div>
                )}

                {!output && !isLoading && !error && (
                  <div className="flex flex-col items-center justify-center h-full text-center py-20 text-slate-400">
                    <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center mb-4">
                      <Code2 className="h-8 w-8 text-indigo-500" />
                    </div>
                    <p className="text-sm font-medium text-slate-500">Your output will appear here</p>
                    <p className="text-xs mt-1">Write a prompt or paste code, then click Run</p>
                  </div>
                )}

                {output && <MarkdownRenderer content={output} />}
              </div>
            </div>

          </div>
        )}

      </div>
    </div>
  )
}
