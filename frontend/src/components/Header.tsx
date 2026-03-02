import { Sprout, Menu, X, Globe } from 'lucide-react'
import { useState } from 'react'
import { useLanguage } from '@/i18n'

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const { language, toggleLanguage, t } = useLanguage()

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
            {t('nav.newAnalysis')}
          </a>
          <a href="/" className="text-sm font-medium text-slate-600 hover:text-emerald-600 transition-colors">
            {t('nav.howItWorks')}
          </a>
        </nav>

        {/* Right Side Actions */}
        <div className="ml-auto flex items-center gap-3">
          {/* Language Toggle */}
          <button 
            onClick={toggleLanguage}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors"
            title={language === 'en' ? 'Switch to Hindi' : 'Switch to English'}
          >
            <Globe className="h-4 w-4" />
            <span className={language === 'en' ? 'text-emerald-600 font-semibold' : 'text-slate-400'}>
              {t('language.english')}
            </span>
            <span className="text-slate-400">|</span>
            <span className={language === 'hi' ? 'text-emerald-600 font-semibold' : 'text-slate-400'}>
              {t('language.hindi')}
            </span>
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
              {t('nav.newAnalysis')}
            </a>
            <a 
              href="/" 
              className="block px-3 py-2 text-sm font-medium text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 rounded-lg"
              onClick={() => setMobileMenuOpen(false)}
            >
              {t('nav.howItWorks')}
            </a>
          </div>
        </div>
      )}
    </header>
  )
}
