import { Sprout, Menu, X } from 'lucide-react'
import { useState } from 'react'

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
      <div className="max-w-6xl mx-auto flex h-16 items-center px-4">
        {/* Logo */}
        <a href="/" className="flex items-center gap-2.5 font-bold">
          <div className="h-10 w-10 bg-gradient-to-br from-emerald-500 to-green-600 rounded-xl flex items-center justify-center">
            <Sprout className="h-6 w-6 text-white" />
          </div>
          <span className="text-xl bg-gradient-to-r from-emerald-700 to-green-600 bg-clip-text text-transparent">
            AgriPlanAI
          </span>
        </a>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-6 ml-8">
          <a href="/form" className="text-sm font-medium text-slate-600 hover:text-emerald-600 transition-colors">
            New Analysis
          </a>
          <a href="/" className="text-sm font-medium text-slate-600 hover:text-emerald-600 transition-colors">
            How It Works
          </a>
        </nav>

        {/* Right Side Actions */}
        <div className="ml-auto flex items-center gap-3">
          {/* Language Toggle - Placeholder for future Hindi support */}
          <button 
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors"
            title="Hindi support coming soon!"
          >
            <span>English</span>
            <span className="text-slate-400">|</span>
            <span className="text-slate-400">हिंदी</span>
          </button>

          {/* Mobile Menu Button */}
          <button 
            className="md:hidden p-2 text-slate-600 hover:text-emerald-600"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t bg-white">
          <div className="px-4 py-3 space-y-2">
            <a 
              href="/form" 
              className="block px-3 py-2 text-sm font-medium text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 rounded-lg"
              onClick={() => setMobileMenuOpen(false)}
            >
              New Analysis
            </a>
            <a 
              href="/" 
              className="block px-3 py-2 text-sm font-medium text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 rounded-lg"
              onClick={() => setMobileMenuOpen(false)}
            >
              How It Works
            </a>
          </div>
        </div>
      )}
    </header>
  )
}
