import { useNavigate } from 'react-router-dom'
import { 
  Sprout, 
  TrendingUp, 
  Calendar, 
  MessageCircle, 
  ChevronRight,
  MapPin,
  Sun,
  Droplets,
  ArrowRight,
  Globe
} from 'lucide-react'
import { useState } from 'react'
import { useLanguage } from '@/i18n'

export function WelcomeScreen() {
  const navigate = useNavigate()
  const [currentSlide, setCurrentSlide] = useState(0)
  const { t, language, toggleLanguage } = useLanguage()

  const slides = [
    {
      title: t('welcome.title1'),
      subtitle: t('welcome.subtitle1'),
      description: t('welcome.desc1'),
    },
    {
      title: t('welcome.title2'),
      subtitle: t('welcome.subtitle2'),
      description: t('welcome.desc2'),
    },
    {
      title: t('welcome.title3'),
      subtitle: t('welcome.subtitle3'),
      description: t('welcome.desc3'),
    },
  ]

  const features = [
    {
      icon: Sprout,
      title: t('welcome.feature1.title'),
      description: t('welcome.feature1.desc'),
      color: 'bg-emerald-100 text-emerald-600',
    },
    {
      icon: TrendingUp,
      title: t('welcome.feature2.title'),
      description: t('welcome.feature2.desc'),
      color: 'bg-blue-100 text-blue-600',
    },
    {
      icon: Calendar,
      title: t('welcome.feature3.title'),
      description: t('welcome.feature3.desc'),
      color: 'bg-amber-100 text-amber-600',
    },
    {
      icon: MessageCircle,
      title: t('welcome.feature4.title'),
      description: t('welcome.feature4.desc'),
      color: 'bg-purple-100 text-purple-600',
    },
  ]

  const howItWorks = [
    {
      step: 1,
      icon: MapPin,
      title: t('welcome.step1.title'),
      description: t('welcome.step1.desc'),
    },
    {
      step: 2,
      icon: Sun,
      title: t('welcome.step2.title'),
      description: t('welcome.step2.desc'),
    },
    {
      step: 3,
      icon: Droplets,
      title: t('welcome.step3.title'),
      description: t('welcome.step3.desc'),
    },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-green-50">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-white/80 backdrop-blur-md">
        <div className="max-w-6xl mx-auto flex h-16 items-center px-4">
          <div className="flex items-center gap-2.5 font-bold text-xl">
            <div className="h-10 w-10 bg-gradient-to-br from-emerald-500 to-green-600 rounded-xl flex items-center justify-center">
              <Sprout className="h-6 w-6 text-white" />
            </div>
            <span className="bg-gradient-to-r from-emerald-700 to-green-600 bg-clip-text text-transparent">
              AgriPlanAI
            </span>
          </div>
          <div className="ml-auto flex items-center gap-4">
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
            <button 
              onClick={() => navigate('/form')}
              className="text-sm font-medium text-slate-600 hover:text-emerald-600 transition-colors"
            >
              {t('welcome.skipTour')}
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-100 rounded-full mb-6">
            <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-sm font-medium text-emerald-700">{t('welcome.trustedBy')}</span>
          </div>
          
          <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4">
            {slides[currentSlide].title}
          </h1>
          <p className="text-xl text-emerald-600 font-medium mb-3">
            {slides[currentSlide].subtitle}
          </p>
          <p className="text-slate-600 max-w-2xl mx-auto text-lg">
            {slides[currentSlide].description}
          </p>

          {/* Slide Indicators */}
          <div className="flex justify-center gap-2 mt-6">
            {slides.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentSlide(idx)}
                className={`h-2 rounded-full transition-all ${
                  idx === currentSlide ? 'w-8 bg-emerald-500' : 'w-2 bg-slate-300'
                }`}
              />
            ))}
          </div>
        </div>

        {/* CTA Button */}
        <div className="flex justify-center mb-16">
          <button
            onClick={() => navigate('/form')}
            className="group bg-gradient-to-r from-emerald-600 to-green-600 text-white font-semibold text-lg px-8 py-4 rounded-2xl shadow-xl hover:shadow-2xl hover:from-emerald-700 hover:to-green-700 transition-all flex items-center gap-3"
          >
            {t('welcome.startAnalysis')}
            <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>

        {/* Features Grid */}
        <div className="mb-16">
          <h2 className="text-2xl font-bold text-center text-slate-900 mb-8">
            {t('welcome.featuresTitle')}
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="bg-white rounded-2xl p-6 border shadow-sm hover:shadow-lg transition-shadow group"
              >
                <div className={`w-12 h-12 ${feature.color} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                  <feature.icon className="h-6 w-6" />
                </div>
                <h3 className="font-semibold text-slate-900 mb-2">{feature.title}</h3>
                <p className="text-sm text-slate-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* How It Works */}
        <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl p-8 md:p-12 text-white mb-16">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-10">
            {t('welcome.howItWorks')}
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            {howItWorks.map((item, idx) => (
              <div key={item.step} className="text-center relative">
                {idx < howItWorks.length - 1 && (
                  <div className="hidden md:block absolute top-8 left-[60%] w-full">
                    <ChevronRight className="h-6 w-6 text-slate-600" />
                  </div>
                )}
                <div className="w-16 h-16 bg-emerald-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <item.icon className="h-8 w-8 text-emerald-400" />
                </div>
                <div className="inline-flex items-center justify-center w-6 h-6 bg-emerald-500 rounded-full text-xs font-bold mb-3">
                  {item.step}
                </div>
                <h3 className="font-semibold text-lg mb-2">{item.title}</h3>
                <p className="text-slate-400 text-sm">{item.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Testimonial */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="text-6xl text-emerald-200 font-serif mb-4">"</div>
          <p className="text-xl text-slate-700 mb-6">
            {t('welcome.testimonial')}
          </p>
          <div className="flex items-center justify-center gap-3">
            <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center">
              <span className="text-emerald-700 font-bold">RS</span>
            </div>
            <div className="text-left">
              <p className="font-semibold text-slate-900">{t('welcome.testimonial.name')}</p>
              <p className="text-sm text-slate-500">{t('welcome.testimonial.role')}</p>
            </div>
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="text-center bg-gradient-to-r from-emerald-600 to-green-600 rounded-3xl p-8 md:p-12 text-white">
          <h2 className="text-2xl md:text-3xl font-bold mb-4">
            {t('welcome.cta.title')}
          </h2>
          <p className="text-emerald-100 mb-8 max-w-xl mx-auto">
            {t('welcome.cta.desc')}
          </p>
          <button
            onClick={() => navigate('/form')}
            className="bg-white text-emerald-700 font-semibold text-lg px-8 py-4 rounded-2xl shadow-lg hover:shadow-xl hover:bg-emerald-50 transition-all flex items-center gap-3 mx-auto"
          >
            {t('welcome.cta.button')}
            <ArrowRight className="h-5 w-5" />
          </button>
        </div>

        {/* Footer */}
        <footer className="mt-16 pt-8 border-t text-center text-slate-500 text-sm">
          <p>{t('welcome.footer')}</p>
        </footer>
      </div>
    </div>
  )
}
