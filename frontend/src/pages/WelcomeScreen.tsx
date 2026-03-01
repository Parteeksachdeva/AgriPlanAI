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
  ArrowRight
} from 'lucide-react'
import { useState } from 'react'

const FEATURES = [
  {
    icon: Sprout,
    title: 'Crop Recommendations',
    description: 'Get AI-powered suggestions for the best crops based on your soil and climate',
    color: 'bg-emerald-100 text-emerald-600',
  },
  {
    icon: TrendingUp,
    title: 'Mandi Price Prediction',
    description: 'Know future prices before you sell. Get the best rates at nearby markets',
    color: 'bg-blue-100 text-blue-600',
  },
  {
    icon: Calendar,
    title: 'Crop Calendar',
    description: 'Never miss important dates. Know exactly when to sow and harvest',
    color: 'bg-amber-100 text-amber-600',
  },
  {
    icon: MessageCircle,
    title: 'Ask Questions',
    description: 'Chat with our AI assistant about farming tips, schemes, and best practices',
    color: 'bg-purple-100 text-purple-600',
  },
]

const HOW_IT_WORKS = [
  {
    step: 1,
    icon: MapPin,
    title: 'Enter Your Farm Details',
    description: 'Tell us your state, soil type, and farm size',
  },
  {
    step: 2,
    icon: Sun,
    title: 'Get AI Analysis',
    description: 'Our AI analyzes your conditions and market trends',
  },
  {
    step: 3,
    icon: Droplets,
    title: 'Start Farming Smart',
    description: 'Follow recommendations for better yields and profits',
  },
]

export function WelcomeScreen() {
  const navigate = useNavigate()
  const [currentSlide, setCurrentSlide] = useState(0)

  const slides = [
    {
      title: 'Welcome to AgriPlanAI',
      subtitle: 'Your Smart Farming Companion',
      description: 'Make better decisions with AI-powered crop recommendations, price predictions, and farming advice.',
    },
    {
      title: 'Maximize Your Profits',
      subtitle: 'Know Before You Sell',
      description: 'Get accurate mandi price predictions and find the best markets to sell your produce.',
    },
    {
      title: 'Farm Smarter, Not Harder',
      subtitle: 'AI-Powered Insights',
      description: 'Get personalized recommendations based on your soil, climate, and local conditions.',
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
            <button 
              onClick={() => navigate('/form')}
              className="text-sm font-medium text-slate-600 hover:text-emerald-600 transition-colors"
            >
              Skip Tour
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-100 rounded-full mb-6">
            <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-sm font-medium text-emerald-700">Trusted by 10,000+ Farmers</span>
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
            Start Your Farm Analysis
            <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>

        {/* Features Grid */}
        <div className="mb-16">
          <h2 className="text-2xl font-bold text-center text-slate-900 mb-8">
            Everything You Need to Farm Smarter
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {FEATURES.map((feature) => (
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
            How It Works
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            {HOW_IT_WORKS.map((item, idx) => (
              <div key={item.step} className="text-center relative">
                {idx < HOW_IT_WORKS.length - 1 && (
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
            AgriPlanAI helped me increase my profits by 40%. The price predictions are incredibly accurate, 
            and I always know which crop will give me the best returns.
          </p>
          <div className="flex items-center justify-center gap-3">
            <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center">
              <span className="text-emerald-700 font-bold">RS</span>
            </div>
            <div className="text-left">
              <p className="font-semibold text-slate-900">Rajesh Singh</p>
              <p className="text-sm text-slate-500">Wheat Farmer, Punjab</p>
            </div>
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="text-center bg-gradient-to-r from-emerald-600 to-green-600 rounded-3xl p-8 md:p-12 text-white">
          <h2 className="text-2xl md:text-3xl font-bold mb-4">
            Ready to Transform Your Farming?
          </h2>
          <p className="text-emerald-100 mb-8 max-w-xl mx-auto">
            Join thousands of farmers who are already using AI to make better decisions and increase their profits.
          </p>
          <button
            onClick={() => navigate('/form')}
            className="bg-white text-emerald-700 font-semibold text-lg px-8 py-4 rounded-2xl shadow-lg hover:shadow-xl hover:bg-emerald-50 transition-all flex items-center gap-3 mx-auto"
          >
            Get Started Free
            <ArrowRight className="h-5 w-5" />
          </button>
        </div>

        {/* Footer */}
        <footer className="mt-16 pt-8 border-t text-center text-slate-500 text-sm">
          <p>Made with ❤️ for Indian Farmers</p>
        </footer>
      </div>
    </div>
  )
}
