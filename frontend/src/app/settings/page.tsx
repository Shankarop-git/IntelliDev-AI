'use client'

/**
 * Settings page.
 * Manages: Theme, Default AI model, Gemini API key, User profile.
 * API keys are stored in localStorage only (never sent to a backend database).
 */

import React, { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Terminal, Layout, MessageSquare, Code2, GitFork,
  Cpu, Settings as SettingsIcon, User, LogOut,
  Key, Eye, EyeOff, Save, Check, Sun, Moon, Monitor,
  Wifi, WifiOff, Loader2, AlertTriangle
} from 'lucide-react'
import { signOut } from 'next-auth/react'
import { fetchModels, testGeminiKey, LLMModel, TestKeyResult } from '@/services/chat-service'

const NAV_ITEMS = [
  { href: '/dashboard', icon: Layout, label: 'Dashboard' },
  { href: '/chat', icon: MessageSquare, label: 'AI Chat' },
  { href: '/code', icon: Code2, label: 'Code Studio' },
  { href: '/github', icon: GitFork, label: 'Repo Analyzer' },
  { href: '/project', icon: Cpu, label: 'Project Explainer' },
  { href: '/settings', icon: SettingsIcon, label: 'Settings', active: true },
]

export default function SettingsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login')
  }, [status, router])

  const [models, setModels] = useState<LLMModel[]>([])
  const [defaultModel, setDefaultModel] = useState('groq:llama-3.3-70b-versatile')
  const [geminiKey, setGeminiKey] = useState('')
  const [showGeminiKey, setShowGeminiKey] = useState(false)
  const [groqKey, setGroqKey] = useState('')
  const [showGroqKey, setShowGroqKey] = useState(false)
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('light')
  const [saved, setSaved] = useState(false)
  const [testStatus, setTestStatus] = useState<TestKeyResult | null>(null)
  const [testing, setTesting] = useState(false)

  // Load from localStorage on mount
  useEffect(() => {
    setDefaultModel(localStorage.getItem('default_model') ?? 'groq:llama-3.3-70b-versatile')
    setGeminiKey(localStorage.getItem('gemini_api_key') ?? '')
    setGroqKey(localStorage.getItem('groq_api_key') ?? '')
    const savedTheme = (localStorage.getItem('theme') as any) ?? 'light'
    setTheme(savedTheme)
    fetchModels().then(setModels).catch(() => {})
  }, [])

  const handleTestKey = async () => {
    if (!geminiKey.trim()) {
      setTestStatus({ status: 'error', message: 'Please enter an API key first' })
      return
    }
    setTesting(true)
    setTestStatus(null)
    const result = await testGeminiKey(geminiKey.trim(), defaultModel)
    setTestStatus(result)
    setTesting(false)
  }

  // Helper to apply theme to document element
  const applyTheme = (targetTheme: 'light' | 'dark' | 'system') => {
    if (
      targetTheme === 'dark' ||
      (targetTheme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)
    ) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }

  const handleThemeChange = (newTheme: 'light' | 'dark' | 'system') => {
    setTheme(newTheme)
    applyTheme(newTheme)
  }

  const handleSave = () => {
    localStorage.setItem('default_model', defaultModel)
    localStorage.setItem('gemini_api_key', geminiKey)
    localStorage.setItem('groq_api_key', groqKey)
    localStorage.setItem('theme', theme)
    applyTheme(theme)
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
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

      {/* Main */}
      <main className="flex-1 overflow-y-auto p-8">
        <div className="max-w-2xl mx-auto space-y-8">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900">Settings</h1>
            <p className="text-sm text-slate-500 mt-1">Manage your AI workspace preferences and API keys.</p>
          </div>

          {/* ── AI Model ── */}
          <section className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
            <div>
              <h2 className="font-bold text-slate-900">AI Model</h2>
              <p className="text-xs text-slate-500 mt-0.5">Select the default model used across all workspace modules.</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {models.length === 0 ? (
                <p className="text-sm text-slate-400 col-span-2">Start your Ollama server to see local models.</p>
              ) : (
                models.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => setDefaultModel(m.id)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl border text-sm font-medium transition-all text-left ${
                      defaultModel === m.id
                        ? 'border-slate-900 bg-slate-900 text-white shadow-md'
                        : 'border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-400'
                    }`}
                  >
                    <span className={`h-2 w-2 rounded-full ${m.provider === 'ollama' ? 'bg-emerald-400' : 'bg-blue-400'}`} />
                    <div>
                      <p>{m.name}</p>
                      <p className={`text-[10px] uppercase tracking-wider ${defaultModel === m.id ? 'text-slate-400' : 'text-slate-400'}`}>{m.provider}</p>
                    </div>
                    {defaultModel === m.id && <Check className="h-4 w-4 ml-auto" />}
                  </button>
                ))
              )}
            </div>
          </section>

          {/* ── API Keys ── */}
          <section className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600"><Key className="h-5 w-5" /></div>
              <div>
                <h2 className="font-bold text-slate-900">API Keys</h2>
                <p className="text-xs text-slate-500">Keys are stored locally in your browser only — never on our servers.</p>
              </div>
            </div>

            <div className="space-y-3">
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider">
                Gemini API Key (Optional)
              </label>
              <div className="relative">
                <input
                  type={showGeminiKey ? 'text' : 'password'}
                  value={geminiKey}
                  onChange={(e) => { setGeminiKey(e.target.value); setTestStatus(null) }}
                  placeholder="Paste your Gemini API key..."
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 pr-12 text-sm text-slate-900 placeholder-slate-400 focus:border-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900 font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowGeminiKey((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                >
                  {showGeminiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>

              {/* Test Connection Button */}
              <button
                type="button"
                onClick={handleTestKey}
                disabled={testing || !geminiKey.trim()}
                className="flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 bg-white text-sm font-medium text-slate-700 hover:bg-slate-50 hover:border-slate-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {testing
                  ? <Loader2 className="h-4 w-4 animate-spin text-indigo-500" />
                  : <Wifi className="h-4 w-4 text-slate-500" />}
                {testing ? 'Testing connection…' : 'Test Connection'}
              </button>

              {/* Test Result Banner */}
              {testStatus && (
                <div className={`flex items-start gap-3 px-4 py-3 rounded-xl text-sm font-medium border ${
                  testStatus.status === 'success'
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                    : testStatus.status === 'rate_limited'
                    ? 'bg-amber-50 border-amber-200 text-amber-800'
                    : 'bg-red-50 border-red-200 text-red-800'
                }`}>
                  {testStatus.status === 'success'
                    ? <Wifi className="h-4 w-4 mt-0.5 flex-shrink-0 text-emerald-600" />
                    : testStatus.status === 'rate_limited'
                    ? <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0 text-amber-600" />
                    : <WifiOff className="h-4 w-4 mt-0.5 flex-shrink-0 text-red-600" />}
                  <div>
                    <p>{testStatus.message}</p>
                    {testStatus.status === 'success' && testStatus.preview && (
                      <p className="mt-1 text-xs text-emerald-600 font-normal">
                        Response preview: "{testStatus.preview}"
                      </p>
                    )}
                  </div>
                </div>
              )}

              <p className="text-xs text-slate-400">
                Get a free key at{' '}
                <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
                  aistudio.google.com
                </a>
                {' '}— accepts all key formats (AIza... and AQ...)
              </p>
            </div>

            {/* Groq API Key Input */}
            <div className="space-y-3 pt-4 border-t border-slate-100">
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider">
                Groq API Key (Optional)
              </label>
              <div className="relative">
                <input
                  type={showGroqKey ? 'text' : 'password'}
                  value={groqKey}
                  onChange={(e) => setGroqKey(e.target.value)}
                  placeholder="gsk_..."
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 pr-12 text-sm text-slate-900 placeholder-slate-400 focus:border-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900 font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowGroqKey((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                >
                  {showGroqKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <p className="text-xs text-slate-400">
                Get a free key at{' '}
                <a href="https://console.groq.com" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
                  console.groq.com
                </a>
                {' '}— provides insanely fast, 100% free cloud Llama 3 endpoints.
              </p>
            </div>
          </section>

          {/* ── Theme ── */}
          <section className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
            <div>
              <h2 className="font-bold text-slate-900">Theme</h2>
              <p className="text-xs text-slate-500 mt-0.5">Choose your workspace appearance.</p>
            </div>
            <div className="flex gap-3">
              {([
                { value: 'light', icon: Sun, label: 'Light' },
                { value: 'dark', icon: Moon, label: 'Dark' },
                { value: 'system', icon: Monitor, label: 'System' },
              ] as const).map(({ value, icon: Icon, label }) => (
                <button
                  key={value}
                  onClick={() => handleThemeChange(value)}
                  className={`flex-1 flex flex-col items-center gap-2 py-4 rounded-xl border text-sm font-medium transition-all ${
                    theme === value
                      ? 'border-slate-900 bg-slate-900 text-white'
                      : 'border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-400'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  {label}
                </button>
              ))}
            </div>
          </section>

          {/* ── Profile ── */}
          <section className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
            <div>
              <h2 className="font-bold text-slate-900">Profile</h2>
              <p className="text-xs text-slate-500 mt-0.5">Your account information.</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-gradient-to-br from-indigo-400 to-purple-600 flex items-center justify-center text-white font-bold text-lg">
                {session?.user?.name?.[0]?.toUpperCase() ?? 'D'}
              </div>
              <div>
                <p className="font-semibold text-slate-900">{session?.user?.name}</p>
                <p className="text-sm text-slate-500">{session?.user?.email}</p>
              </div>
            </div>
          </section>

          {/* Save Button */}
          <div className="flex justify-end">
            <button
              onClick={handleSave}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-slate-900 text-white text-sm font-semibold hover:bg-slate-800 transition-all"
            >
              {saved ? (
                <>
                  <Check className="h-4 w-4 text-emerald-400" />
                  Saved!
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Save Settings
                </>
              )}
            </button>
          </div>
        </div>
      </main>
    </div>
  )
}
