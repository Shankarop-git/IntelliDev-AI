'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Terminal, Lock, Mail, User, ArrowRight } from 'lucide-react'

export default function RegisterPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const signupRes = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      })

      const data = await signupRes.json()

      if (!signupRes.ok) {
        setError(data.error || 'Something went wrong')
      } else {
        router.push('/login?registered=true')
      }
    } catch (err) {
      setError('Connection error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8 glass p-8 rounded-2xl shadow-xl border border-slate-200 bg-white/70">
        <div className="flex flex-col items-center justify-center text-center">
          <div className="flex items-center justify-center h-12 w-12 rounded-xl bg-slate-900 text-white mb-4">
            <Terminal className="h-6 w-6" />
          </div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900">IntelliDev AI</h2>
          <p className="mt-2 text-sm text-slate-500">Create your free workspace account</p>
        </div>

        {error && (
          <div className="rounded-lg bg-red-50 p-4 text-sm text-red-600 border border-red-200">
            {error}
          </div>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4 rounded-md">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
                Full Name
              </label>
              <div className="relative">
                <User className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  suppressHydrationWarning
                  className="block w-full rounded-lg border border-slate-300 bg-white/80 py-2.5 pl-10 pr-3 text-slate-900 placeholder-slate-400 focus:border-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900 sm:text-sm"
                  placeholder="John Doe"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  suppressHydrationWarning
                  className="block w-full rounded-lg border border-slate-300 bg-white/80 py-2.5 pl-10 pr-3 text-slate-900 placeholder-slate-400 focus:border-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900 sm:text-sm"
                  placeholder="name@example.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  suppressHydrationWarning
                  className="block w-full rounded-lg border border-slate-300 bg-white/80 py-2.5 pl-10 pr-3 text-slate-900 placeholder-slate-400 focus:border-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900 sm:text-sm"
                  placeholder="••••••••"
                />
              </div>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              suppressHydrationWarning
              className="group relative flex w-full justify-center rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-2 disabled:opacity-50 transition-all duration-200"
            >
              {loading ? 'Creating account...' : (
                <span className="flex items-center gap-2">
                  Sign Up <ArrowRight className="h-4 w-4" />
                </span>
              )}
            </button>
          </div>
        </form>

        <div className="text-center text-sm text-slate-600 mt-4">
          Already have an account?{' '}
          <Link href="/login" className="font-semibold text-slate-900 hover:underline">
            Log in here
          </Link>
        </div>
      </div>
    </div>
  )
}
