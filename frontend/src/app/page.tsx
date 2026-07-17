import Link from "next/link";
import { Terminal, Code2, GitFork, Cpu, ArrowRight } from "lucide-react";

export default function Home() {
  return (
    <div className="relative min-h-screen bg-slate-50 overflow-hidden flex flex-col justify-between">
      {/* Background Gradients */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-200/50 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob"></div>
      <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-blue-200/50 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-2000"></div>

      {/* Header */}
      <header className="relative w-full max-w-7xl mx-auto px-6 py-6 flex items-center justify-between z-10">
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-slate-900 text-white">
            <Terminal className="h-5 w-5" />
          </div>
          <span className="font-bold text-xl tracking-tight text-slate-900">IntelliDev AI</span>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/login" className="text-sm font-semibold text-slate-700 hover:text-slate-900 transition-colors">
            Sign In
          </Link>
          <Link href="/register" className="inline-flex items-center justify-center px-4 py-2 text-sm font-semibold rounded-lg bg-slate-900 text-white hover:bg-slate-800 transition-colors">
            Get Started
          </Link>
        </div>
      </header>

      {/* Main Hero */}
      <main className="relative flex-1 flex flex-col items-center justify-center text-center px-6 py-20 z-10 max-w-5xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-200/80 text-xs font-semibold text-slate-800 mb-6 border border-slate-300/50 backdrop-blur-md">
          <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
          IntelliDev AI — AI Developer Assistant
        </div>
        
        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-slate-900 mb-6 leading-tight">
          Build <span className="text-slate-400">•</span> Debug <span className="text-slate-400">•</span> Analyze <span className="text-slate-400">•</span> Explain.
        </h1>
        
        <p className="text-lg md:text-xl text-slate-600 max-w-2xl mb-10 leading-relaxed">
          An AI-powered Software Engineering Workspace designed to supercharge developer productivity. Write robust code, review architectures, and get instant explanations.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 items-center justify-center mb-16">
          <Link href="/register" className="inline-flex items-center gap-2 px-6 py-3.5 text-base font-semibold rounded-xl bg-slate-900 text-white hover:bg-slate-800 shadow-lg shadow-slate-950/10 hover:shadow-xl transition-all duration-200">
            Open Your Workspace <ArrowRight className="h-5 w-5" />
          </Link>
          <Link href="/login" className="inline-flex items-center gap-2 px-6 py-3.5 text-base font-semibold rounded-xl border border-slate-300 bg-white/50 backdrop-blur-md hover:bg-white/80 transition-colors text-slate-700 hover:text-slate-900">
            Sign In
          </Link>
        </div>

        {/* Feature Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 w-full max-w-4xl">
          <div className="glass p-6 rounded-xl border border-slate-200 text-left bg-white/60">
            <div className="h-10 w-10 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 mb-4 border border-indigo-100">
              <Code2 className="h-5 w-5" />
            </div>
            <h3 className="font-bold text-slate-900 mb-2">Code Studio</h3>
            <p className="text-sm text-slate-600">Generate, refactor, optimize, and translate code across multiple target languages instantly.</p>
          </div>

          <div className="glass p-6 rounded-xl border border-slate-200 text-left bg-white/60">
            <div className="h-10 w-10 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600 mb-4 border border-emerald-100">
              <GitFork className="h-5 w-5" />
            </div>
            <h3 className="font-bold text-slate-900 mb-2">Repo Analyzer</h3>
            <p className="text-sm text-slate-600">Analyze folder structure, scan dependencies, detect architectural flaws, and auto-build READMEs.</p>
          </div>

          <div className="glass p-6 rounded-xl border border-slate-200 text-left bg-white/60">
            <div className="h-10 w-10 rounded-lg bg-pink-50 flex items-center justify-center text-pink-600 mb-4 border border-pink-100">
              <Cpu className="h-5 w-5" />
            </div>
            <h3 className="font-bold text-slate-900 mb-2">Project Explainer</h3>
            <p className="text-sm text-slate-600">Upload ZIP projects or paste repository links to generate interactive Mermaid diagrams & docs.</p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative w-full max-w-7xl mx-auto px-6 py-6 text-center text-xs text-slate-500 z-10 border-t border-slate-200/50 mt-12 bg-white/40 backdrop-blur-md">
        © 2026 IntelliDev AI. Built for developers, students, and workspaces.
      </footer>
    </div>
  );
}
