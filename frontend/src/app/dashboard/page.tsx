'use client'

import React from 'react'
import { signOut, useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { 
  Terminal, 
  MessageSquare, 
  Code2, 
  GitFork, 
  Cpu, 
  Settings as SettingsIcon, 
  LogOut, 
  Layout, 
  Clock, 
  User 
} from 'lucide-react'
import Link from 'next/link'

export default function DashboardPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  React.useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    }
  }, [status, router])

  if (status === 'loading') {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900"></div>
      </div>
    )
  }

  const handleLogout = async () => {
    await signOut({ callbackUrl: '/' })
  }

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar Navigation */}
      <aside className="w-64 border-r border-slate-200 bg-white/80 backdrop-blur-md flex flex-col justify-between p-4 sticky top-0 h-screen">
        <div className="space-y-6">
          <div className="flex items-center gap-2 px-2 py-1.5">
            <div className="flex items-center justify-center h-9 w-9 rounded-lg bg-slate-900 text-white">
              <Terminal className="h-5 w-5" />
            </div>
            <span className="font-bold text-lg tracking-tight text-slate-900">IntelliDev AI</span>
          </div>

          <nav className="space-y-1">
            <Link href="/dashboard" className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium bg-slate-100 text-slate-900 transition-colors">
              <Layout className="h-4 w-4 text-slate-500" />
              Dashboard
            </Link>
            <Link href="/chat" className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors">
              <MessageSquare className="h-4 w-4 text-slate-500" />
              AI Chat
            </Link>
            <Link href="/code" className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors">
              <Code2 className="h-4 w-4 text-slate-500" />
              Code Studio
            </Link>
            <Link href="/github" className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors">
              <GitFork className="h-4 w-4 text-slate-500" />
              Repo Analyzer
            </Link>
            <Link href="/project" className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors">
              <Cpu className="h-4 w-4 text-slate-500" />
              Project Explainer
            </Link>
            <Link href="/settings" className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors">
              <SettingsIcon className="h-4 w-4 text-slate-500" />
              Settings
            </Link>
          </nav>
        </div>

        <div className="border-t border-slate-200 pt-4 space-y-2">
          <div className="flex items-center gap-3 px-3 py-1 text-slate-700">
            <div className="h-8 w-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-600">
              <User className="h-4 w-4" />
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-xs font-semibold truncate">{session?.user?.name || 'Developer'}</p>
              <p className="text-[10px] text-slate-400 truncate">{session?.user?.email}</p>
            </div>
          </div>
          <button onClick={handleLogout} className="flex w-full items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors">
            <LogOut className="h-4 w-4" />
            Log Out
          </button>
        </div>
      </aside>

      {/* Main Workspace Area */}
      <main className="flex-1 p-8 overflow-y-auto max-w-7xl">
        <header className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900">Welcome Back, {session?.user?.name || 'Developer'}</h1>
            <p className="text-sm text-slate-500 mt-1">Here is an overview of your active developer workspace.</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-xs text-slate-500 font-medium">Local Ollama API Connected</span>
          </div>
        </header>

        {/* Quick Action Grid */}
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          <Link href="/chat" className="glass p-6 rounded-xl border border-slate-200 bg-white/70 hover:shadow-lg transition-all duration-200 block group">
            <div className="h-10 w-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform duration-200">
              <MessageSquare className="h-5 w-5" />
            </div>
            <h3 className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors">Open AI Chat</h3>
            <p className="text-xs text-slate-500 mt-1">Ask questions, explain concepts, and chat about files.</p>
          </Link>

          <Link href="/code" className="glass p-6 rounded-xl border border-slate-200 bg-white/70 hover:shadow-lg transition-all duration-200 block group">
            <div className="h-10 w-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform duration-200">
              <Code2 className="h-5 w-5" />
            </div>
            <h3 className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">Code Studio</h3>
            <p className="text-xs text-slate-500 mt-1">Write, translate, debug, or optimize code snippets.</p>
          </Link>

          <Link href="/github" className="glass p-6 rounded-xl border border-slate-200 bg-white/70 hover:shadow-lg transition-all duration-200 block group">
            <div className="h-10 w-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform duration-200">
              <GitFork className="h-5 w-5" />
            </div>
            <h3 className="font-bold text-slate-900 group-hover:text-emerald-600 transition-colors">Repo Analyzer</h3>
            <p className="text-xs text-slate-500 mt-1">Scan public repos, stack analysis, and dependency flow.</p>
          </Link>

          <Link href="/project" className="glass p-6 rounded-xl border border-slate-200 bg-white/70 hover:shadow-lg transition-all duration-200 block group">
            <div className="h-10 w-10 rounded-lg bg-pink-50 text-pink-600 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform duration-200">
              <Cpu className="h-5 w-5" />
            </div>
            <h3 className="font-bold text-slate-900 group-hover:text-pink-600 transition-colors">Project Explainer</h3>
            <p className="text-xs text-slate-500 mt-1">Upload directories or ZIP packages to generate maps.</p>
          </Link>
        </section>

        {/* Dashboard Widgets */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Recent Activity */}
          <div className="lg:col-span-2 glass border border-slate-200 rounded-2xl bg-white/70 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-bold text-slate-900 flex items-center gap-2">
                <Clock className="h-5 w-5 text-slate-400" />
                Recent Chats & Tasks
              </h2>
            </div>
            <div className="space-y-4">
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 flex justify-between items-center text-sm">
                <div>
                  <p className="font-semibold text-slate-800">Optimize SQL Query Performance</p>
                  <p className="text-xs text-slate-400 mt-0.5">Code Studio • 2 hours ago</p>
                </div>
                <span className="text-xs font-semibold px-2 py-1 rounded bg-indigo-50 text-indigo-600">Generated</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 flex justify-between items-center text-sm">
                <div>
                  <p className="font-semibold text-slate-800">Explain Next.js Route Handlers</p>
                  <p className="text-xs text-slate-400 mt-0.5">AI Chat • Yesterday</p>
                </div>
                <span className="text-xs font-semibold px-2 py-1 rounded bg-blue-50 text-blue-600">Chat</span>
              </div>
            </div>
          </div>

          {/* Model Statistics */}
          <div className="glass border border-slate-200 rounded-2xl bg-white/70 p-6 flex flex-col justify-between">
            <div>
              <h2 className="font-bold text-slate-900 mb-6">Active Model</h2>
              <div className="space-y-4 text-sm">
                <div className="flex justify-between border-b border-slate-100 pb-2">
                  <span className="text-slate-500">Default Model</span>
                  <span className="font-semibold text-slate-800">Ollama (Llama 3)</span>
                </div>
                <div className="flex justify-between border-b border-slate-100 pb-2">
                  <span className="text-slate-500">Backup Provider</span>
                  <span className="font-semibold text-slate-800">Gemini (Free)</span>
                </div>
                <div className="flex justify-between pb-2">
                  <span className="text-slate-500">Vector Search</span>
                  <span className="font-semibold text-emerald-600">Ready</span>
                </div>
              </div>
            </div>
            <Link href="/settings" className="mt-8 text-center text-xs font-semibold text-slate-900 hover:underline block">
              Manage Provider Keys & Settings
            </Link>
          </div>
        </div>
      </main>
    </div>
  )
}
