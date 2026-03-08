import { useState, useRef, useEffect, useCallback } from 'react'
import type { PredictionResult, PredictionFormData } from '@/types'
import { askChatbot } from '@/api'
import { useLanguage } from '@/i18n'
import { 
  Sprout, TrendingUp, Wallet, ClipboardList, Send, X, Minimize2, Maximize2, 
  Bot, Landmark, Lightbulb, Mic, MicOff, Download, Share2, 
  History, Sparkles, Volume2, VolumeX, Expand, Shrink
} from 'lucide-react'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SpeechRecognitionType = any

interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  isContextUpdate?: boolean
}

interface SavedConversation {
  id: string
  title: string
  messages: ChatMessage[]
  timestamp: Date
  topCrop: string
}

interface ResultChatbotProps {
  result: PredictionResult
  formData: PredictionFormData
  onNavigate?: (tab: 'overview' | 'earnings' | 'market' | 'planning') => void
}

// Helper to format template strings with replacements
function formatTemplate(template: string, replacements: Record<string, string>): string {
  return template.replace(/\{([^}]+)\}/g, (match, key) => replacements[key] ?? match)
}

type TranslateFn = (key: string) => string

function buildResponse(
  query: string,
  result: PredictionResult,
  formData: ResultChatbotProps['formData'],
  t: TranslateFn,
  onNavigate?: ResultChatbotProps['onNavigate']
): { response: string; usedRAG: boolean } {
  const q = query.toLowerCase().trim()
  const { recommendations } = result
  const top = recommendations[0]

  // Top / best crop
  if (
    /(best|top|most profitable|highest revenue|recommended) ?crop|which crop|शीर्ष फसल|सबसे लाभदायक/.test(q) &&
    top
  ) {
    const list = recommendations
      .map(
        (c, i) =>
          `${i + 1}. **${c.crop}**: ₹${c.expected_revenue.toLocaleString(undefined, { maximumFractionDigits: 0 })}`
      )
      .join('\n')
    const response = formatTemplate(t('chatbot.response.topCrop'), {
      crop: top.crop,
      revenue: top.expected_revenue.toLocaleString(undefined, { maximumFractionDigits: 0 }),
      list,
    })
    return { response, usedRAG: false }
  }

  // Yield for top crop
  if (
    /(my|the|predicted) ?yield|yield ?prediction|उपज/.test(q) &&
    top
  ) {
    const response = formatTemplate(t('chatbot.response.yield'), {
      crop: top.crop,
      yield: top.predicted_yield.toLocaleString(undefined, { maximumFractionDigits: 2 }),
    })
    return { response, usedRAG: false }
  }

  // Revenue / profit / earnings
  if (
    /(my|expected) ?(revenue|profit|earning)|राजस्व|लाभ/.test(q) &&
    top
  ) {
    const response = formatTemplate(t('chatbot.response.revenue'), {
      crop: top.crop,
      revenue: top.expected_revenue.toLocaleString(undefined, { maximumFractionDigits: 0 }),
      area: formData.area.toString(),
      yield: top.predicted_yield.toFixed(2),
      price: top.avg_price.toFixed(0),
    })
    return { response, usedRAG: false }
  }

  // Mandi / market price
  if (/(mandi|market|price|rate|कीमत|मूल्य) ?(per|of|for)?/.test(q) && top) {
    const list = recommendations
      .map((c) => `**${c.crop}**: ₹${c.avg_price.toLocaleString(undefined, { maximumFractionDigits: 0 })}/quintal`)
      .join('\n')
    const response = formatTemplate(t('chatbot.response.prices'), { list })
    return { response, usedRAG: false }
  }

  // Input summary
  if (/my ?inputs?|what (did )?i ?enter(ed)?|input ?summary|show ?me ?my ?data|इनपुट|मेरा डेटा/.test(q)) {
    const parts: string[] = [
      `${t('form.label.state')}: ${formData.state}`,
      `${t('form.label.season')}: ${formData.season}`,
      `${t('form.label.rainfall')}: ${formData.annual_rainfall} mm`,
      `${t('form.label.area')}: ${formData.area} ha`,
      `${t('form.label.fertilizer')}: ${formData.fertilizer} kg`,
      `${t('form.label.pesticide')}: ${formData.pesticide} kg`,
    ]
    if (formData.temperature != null) parts.push(`${t('form.label.temperature')}: ${formData.temperature} °C`)
    if (formData.humidity != null) parts.push(`${t('form.label.humidity')}: ${formData.humidity}%`)
    if (formData.ph != null) parts.push(`${t('form.label.ph')}: ${formData.ph}`)
    if (formData.n_soil != null) parts.push(`N: ${formData.n_soil}`)
    if (formData.p_soil != null) parts.push(`P: ${formData.p_soil}`)
    if (formData.k_soil != null) parts.push(`K: ${formData.k_soil}`)
    const response = formatTemplate(t('chatbot.response.inputs'), { inputs: parts.join('\n') })
    return { response, usedRAG: false }
  }

  // Navigation / Tabs
  if (onNavigate) {
    if (/(go to|show|open|navigate to)? ?(overview|summary|result) ?(tab|page|section)?|ओवरव्यू|सारांश/.test(q)) {
      onNavigate('overview')
      return { response: t('chatbot.nav.overview') || "Switching to the Overview tab for you.", usedRAG: false }
    }
    if (/(go to|show|open|navigate to)? ?(earnings|profit|revenue|income|calculator) ?(tab|page|section)?|कमाई|मुनाफा|लाभ/.test(q)) {
      onNavigate('earnings')
      return { response: t('chatbot.nav.earnings') || "I've opened the Earnings tab where you can calculate your profits.", usedRAG: false }
    }
    if (/(go to|show|open|navigate to)? ?(market|price|mandi|trend|prediction) ?(tab|page|section)?|बाजार|मंडी|कीमत/.test(q)) {
      onNavigate('market')
      return { response: t('chatbot.nav.market') || "Taking you to the Market tab to see price predictions.", usedRAG: false }
    }
    if (/(go to|show|open|navigate to)? ?(planning|calendar|rotation|schedule) ?(tab|page|section)?|योजना|कैलेंडर|नियोजन/.test(q)) {
      onNavigate('planning')
      return { response: t('chatbot.nav.planning') || "Opening the Planning tab for your crop calendar and rotation.", usedRAG: false }
    }
  }

  // Next steps guidance
  if (/(what|how) (to|should i) (do|proceed) next|advice|suggestions|मार्गदर्शन|आगे क्या/.test(q)) {
    return { 
      response: t('chatbot.guidance') || "I recommend checking the **Earnings** tab to calculate your potential profit, or the **Planning** tab to see the best sowing schedule for your crop.", 
      usedRAG: false 
    }
  }

  // Default — fall through to RAG
  return { response: t('chatbot.response.ragFallback'), usedRAG: true }
}

function formatMessageContent(text: string) {
  return text.split('\n').map((line, i) => (
    <span key={i}>
      {line.split(/(\*\*[^*]+\*\*)/g).map((part, j) =>
        part.startsWith('**') && part.endsWith('**') ? (
          <strong key={j} className="font-semibold text-emerald-700">{part.slice(2, -2)}</strong>
        ) : (
          part
        )
      )}
      {i < text.split('\n').length - 1 && <br />}
    </span>
  ))
}

// Generate a unique key for result/formData combination
function generateContextKey(result: PredictionResult, formData: PredictionFormData): string {
  const topCrop = result.recommendations[0]?.crop ?? 'none'
  return `${topCrop}-${formData.state}-${formData.season}-${formData.area}`
}

// Text-to-speech function
function speakText(text: string, lang: 'en' | 'hi' = 'en') {
  if ('speechSynthesis' in window) {
    // Remove markdown formatting for speech
    const cleanText = text.replace(/\*\*/g, '').replace(/---/g, '')
    const utterance = new SpeechSynthesisUtterance(cleanText)
    utterance.lang = lang === 'hi' ? 'hi-IN' : 'en-IN'
    utterance.rate = 0.9
    speechSynthesis.speak(utterance)
  }
}

export function ResultChatbot({ result, formData, onNavigate }: ResultChatbotProps) {
  const { t, language } = useLanguage()
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)
  const [currentContextKey, setCurrentContextKey] = useState<string>('')
  const [unreadCount, setUnreadCount] = useState(0)
  const [isListening, setIsListening] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const [savedConversations, setSavedConversations] = useState<SavedConversation[]>([])
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const hasInitialized = useRef(false)
  const chatContainerRef = useRef<HTMLDivElement>(null)
  const recognitionRef = useRef<SpeechRecognitionType | null>(null)

  // Initialize speech recognition
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
      recognitionRef.current = new SpeechRecognition()
      recognitionRef.current.continuous = false
      recognitionRef.current.interimResults = false
      recognitionRef.current.lang = language === 'hi' ? 'hi-IN' : 'en-IN'
      
      recognitionRef.current.onresult = (event: { results: { transcript: string }[][] }) => {
        const transcript = event.results[0][0].transcript
        setInput(transcript)
        setIsListening(false)
      }
      
      recognitionRef.current.onerror = () => {
        setIsListening(false)
      }
      
      recognitionRef.current.onend = () => {
        setIsListening(false)
      }
    }
  }, [language])

  // Load saved conversations from localStorage
  useEffect(() => {
    const timer = setTimeout(() => {
      const saved = localStorage.getItem('agriplan-chat-history')
      if (saved) {
        try {
          const parsed = JSON.parse(saved)
          setSavedConversations(parsed.map((c: SavedConversation) => ({
            ...c,
            timestamp: new Date(c.timestamp)
          })))
        } catch (e) {
          console.error('Failed to load chat history:', e)
        }
      }
    }, 0)
    return () => clearTimeout(timer)
  }, [])

  // Initialize or update chat when result/formData changes
  useEffect(() => {
    const newContextKey = generateContextKey(result, formData)
    
    const timer = setTimeout(() => {
      if (hasInitialized.current && newContextKey !== currentContextKey) {
        const topCrop = result.recommendations[0]?.crop ?? t('result.recommended')
        const contextUpdateMsg: ChatMessage = {
          id: Date.now().toString(),
          role: 'assistant',
          content: formatTemplate(t('chatbot.contextUpdated'), { crop: topCrop }),
          timestamp: new Date(),
          isContextUpdate: true,
        }
        setMessages([contextUpdateMsg])
        if (!isOpen) {
          setUnreadCount((prev) => prev + 1)
        }
      } else if (!hasInitialized.current) {
        setMessages([
          {
            id: '0',
            role: 'assistant',
            content: t('chatbot.greeting'),
            timestamp: new Date(),
          },
        ])
        hasInitialized.current = true
      }
      
      setCurrentContextKey(newContextKey)
    }, 0)
    
    return () => clearTimeout(timer)
  }, [result, formData, t, currentContextKey, isOpen])

  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  useEffect(scrollToBottom, [messages])

  // Close chat when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (chatContainerRef.current && !chatContainerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
        setShowHistory(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen])

  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert(language === 'hi' ? 'आपके ब्राउज़र में वॉइस इनपुट समर्थित नहीं है' : 'Voice input is not supported in your browser')
      return
    }
    
    if (isListening) {
      recognitionRef.current.stop()
      setIsListening(false)
    } else {
      recognitionRef.current.start()
      setIsListening(true)
    }
  }

  const handleSpeak = (text: string) => {
    if (isSpeaking) {
      window.speechSynthesis.cancel()
      setIsSpeaking(false)
    } else {
      setIsSpeaking(true)
      speakText(text, language)
      setTimeout(() => setIsSpeaking(false), 5000)
    }
  }

  const handleSendMessage = useCallback(async (text: string) => {
    if (!text.trim() || isLoading) return

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
      timestamp: new Date(),
    }
    setMessages((prev) => [...prev, userMsg])
    setInput('')
    setIsLoading(true)

    const { response, usedRAG } = buildResponse(text, result, formData, t as TranslateFn, (tab) => {
      onNavigate?.(tab)
      setIsMinimized(true)
    })
    let reply = response

    if (usedRAG) {
      reply = await askChatbot(text, language, result, formData)
    }

    const assistantMsg: ChatMessage = {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: reply,
      timestamp: new Date(),
    }
    setMessages((prev) => [...prev, assistantMsg])
    setIsLoading(false)
    
    // Auto-speak the response if enabled (could add a setting for this)
    // speakText(reply, language)
  }, [result, formData, t, language, isLoading, onNavigate])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await handleSendMessage(input)
  }

  const handleOpen = () => {
    setIsOpen(true)
    setIsMinimized(false)
    setUnreadCount(0)
    setShowHistory(false)
  }

  const saveConversation = () => {
    if (messages.length <= 1) return
    
    const topCrop = result.recommendations[0]?.crop ?? 'General'
    const newConversation: SavedConversation = {
      id: Date.now().toString(),
      title: `${topCrop} - ${new Date().toLocaleDateString()}`,
      messages: [...messages],
      timestamp: new Date(),
      topCrop,
    }
    
    const updated = [newConversation, ...savedConversations].slice(0, 10) // Keep last 10
    setSavedConversations(updated)
    localStorage.setItem('agriplan-chat-history', JSON.stringify(updated))
    
    alert(language === 'hi' ? 'बातचीत सहेज ली गई!' : 'Conversation saved!')
  }

  const loadConversation = (conv: SavedConversation) => {
    setMessages(conv.messages)
    setShowHistory(false)
  }

  const exportConversation = () => {
    if (messages.length <= 1) return
    
    const text = messages.map(m => 
      `${m.role === 'user' ? 'You' : 'Kisan Mitra'}: ${m.content}`
    ).join('\n\n')
    
    const blob = new Blob([text], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `chat-${result.recommendations[0]?.crop || 'general'}-${new Date().toISOString().split('T')[0]}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  const shareConversation = async () => {
    if (messages.length <= 1) return
    
    const text = messages.map(m => 
      `${m.role === 'user' ? 'You' : 'Kisan Mitra'}: ${m.content}`
    ).join('\n\n')
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'My Farming Advice from AgriPlanAI',
          text: text.substring(0, 500) + '...',
        })
      } catch {
        // User cancelled
      }
    } else {
      navigator.clipboard.writeText(text)
      alert(language === 'hi' ? 'क्लिपबोर्ड में कॉपी किया गया!' : 'Copied to clipboard!')
    }
  }

  const quickActions = [
    { key: 'topCrop', icon: Sprout, label: t('chatbot.quick.topCrop'), query: t('chatbot.quick.topCrop') },
    { key: 'yield', icon: TrendingUp, label: t('chatbot.quick.yield'), query: t('chatbot.quick.yield') },
    { key: 'revenue', icon: Wallet, label: t('chatbot.quick.revenue'), query: t('chatbot.quick.revenue') },
    { key: 'prices', icon: TrendingUp, label: t('chatbot.quick.prices'), query: t('chatbot.quick.prices') },
    { key: 'inputs', icon: ClipboardList, label: t('chatbot.quick.inputs'), query: t('chatbot.quick.inputs') },
    { key: 'schemes', icon: Landmark, label: t('chatbot.quick.schemes'), query: language === 'hi' ? 'सरकारी योजनाएं और सब्सिडी' : 'government schemes and subsidies for farmers' },
    { key: 'tips', icon: Lightbulb, label: t('chatbot.quick.tips'), query: language === 'hi' ? 'खेती के सर्वोत्तम सुझाव' : 'best farming tips and practices' },
  ]

  const topCrop = result.recommendations[0]?.crop

  // Floating Button (when closed)
  if (!isOpen) {
    return (
      <button
        onClick={handleOpen}
        className="fixed bottom-6 right-6 z-50 group"
      >
        <div className="relative">
          <div className="h-14 w-14 bg-gradient-to-r from-emerald-500 to-green-600 rounded-full shadow-lg hover:shadow-xl flex items-center justify-center transition-all hover:scale-110">
            <Bot className="h-7 w-7 text-white" />
          </div>
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center animate-pulse">
              {unreadCount}
            </span>
          )}
          {/* Tooltip */}
          <div className="absolute right-full mr-3 top-1/2 -translate-y-1/2 bg-slate-800 text-white text-sm px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
            {t('result.chatbot.title')}
            {topCrop && ` • ${topCrop}`}
          </div>
        </div>
      </button>
    )
  }

  // Minimized Bar
  if (isMinimized) {
    return (
      <div className="fixed bottom-6 right-6 z-50">
        <div 
          onClick={() => setIsMinimized(false)}
          className="bg-white border shadow-lg rounded-full px-4 py-2 flex items-center gap-3 cursor-pointer hover:shadow-xl transition-shadow"
        >
          <div className="h-8 w-8 bg-emerald-100 rounded-full flex items-center justify-center">
            <Bot className="h-4 w-4 text-emerald-600" />
          </div>
          <span className="text-sm font-medium text-slate-700">{t('result.chatbot.title')}</span>
          {topCrop && (
            <span className="text-xs text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
              {topCrop}
            </span>
          )}
          <Maximize2 className="h-4 w-4 text-slate-400" />
        </div>
      </div>
    )
  }

  // Full Chat Window
  return (
    <div 
      ref={chatContainerRef}
      className={`fixed bottom-6 right-6 z-50 transition-all duration-300 ${
        isExpanded 
          ? 'w-[90vw] h-[90vh] max-w-[1200px] left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2' 
          : 'w-[420px] max-w-[calc(100vw-48px)]'
      }`}
    >
      <div className={`bg-white rounded-2xl shadow-2xl border overflow-hidden flex flex-col ${
        isExpanded ? 'h-full max-h-none' : 'max-h-[700px]'
      }`}>
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-500 to-green-600 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-white/20 rounded-xl flex items-center justify-center">
              <Bot className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">{t('result.chatbot.title')}</h3>
              <p className="text-xs text-emerald-100">
                {topCrop 
                  ? `${t('result.bestCrop')}: ${topCrop}` 
                  : t('result.subtitle')}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {/* History Button */}
            <button
              onClick={() => setShowHistory(!showHistory)}
              className="p-1.5 hover:bg-white/20 rounded-lg transition-colors relative"
              title={language === 'hi' ? 'इतिहास' : 'History'}
            >
              <History className="h-4 w-4 text-white" />
              {savedConversations.length > 0 && (
                <span className="absolute -top-0.5 -right-0.5 h-2 w-2 bg-amber-400 rounded-full" />
              )}
            </button>
            {/* Save Button */}
            <button
              onClick={saveConversation}
              className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
              title={language === 'hi' ? 'सहेजें' : 'Save'}
            >
              <Sparkles className="h-4 w-4 text-white" />
            </button>
            {/* Export Button */}
            <button
              onClick={exportConversation}
              className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
              title={language === 'hi' ? 'डाउनलोड' : 'Download'}
            >
              <Download className="h-4 w-4 text-white" />
            </button>
            {/* Share Button */}
            <button
              onClick={shareConversation}
              className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
              title={language === 'hi' ? 'साझा करें' : 'Share'}
            >
              <Share2 className="h-4 w-4 text-white" />
            </button>
            {/* Expand/Shrink Button */}
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
              title={isExpanded ? (language === 'hi' ? 'छोटा करें' : 'Shrink') : (language === 'hi' ? 'बड़ा करें' : 'Expand')}
            >
              {isExpanded ? <Shrink className="h-4 w-4 text-white" /> : <Expand className="h-4 w-4 text-white" />}
            </button>
            <button
              onClick={() => setIsMinimized(true)}
              className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
            >
              <Minimize2 className="h-4 w-4 text-white" />
            </button>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X className="h-4 w-4 text-white" />
            </button>
          </div>
        </div>

        {/* History Panel */}
        {showHistory && (
          <div className="border-b bg-slate-50 max-h-40 overflow-y-auto">
            <div className="px-3 py-2 text-xs font-semibold text-slate-500 uppercase">
              {language === 'hi' ? 'सहेजी गई बातचीतें' : 'Saved Conversations'}
            </div>
            {savedConversations.length === 0 ? (
              <div className="px-3 py-2 text-sm text-slate-400">
                {language === 'hi' ? 'कोई इतिहास नहीं' : 'No history yet'}
              </div>
            ) : (
              savedConversations.map((conv) => (
                <button
                  key={conv.id}
                  onClick={() => loadConversation(conv)}
                  className="w-full px-3 py-2 text-left hover:bg-slate-100 transition-colors border-b border-slate-100 last:border-0"
                >
                  <div className="text-sm font-medium text-slate-700">{conv.title}</div>
                  <div className="text-xs text-slate-400">
                    {new Date(conv.timestamp).toLocaleDateString()} • {conv.messages.length} messages
                  </div>
                </button>
              ))
            )}
          </div>
        )}

        {/* Quick Action Buttons */}
        <div className="px-3 py-2 border-b bg-slate-50">
          <div className="flex flex-wrap gap-1.5">
            {quickActions.map((action) => (
              <button
                key={action.key}
                onClick={() => handleSendMessage(action.query)}
                disabled={isLoading}
                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium bg-white border rounded-full hover:bg-emerald-50 hover:border-emerald-200 hover:text-emerald-700 transition-colors disabled:opacity-50"
              >
                <action.icon className="h-3 w-3" />
                {action.label}
              </button>
            ))}
          </div>
        </div>

        {/* Messages Area */}
        <div className={`flex-1 overflow-y-auto p-4 space-y-4 ${
          isExpanded ? 'min-h-0' : 'min-h-[300px] max-h-[400px]'
        }`}>
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-3.5 py-2 text-sm ${
                  msg.role === 'user'
                    ? 'bg-emerald-600 text-white rounded-br-md'
                    : msg.isContextUpdate
                    ? 'bg-amber-50 text-amber-800 border border-amber-200 rounded-bl-md'
                    : 'bg-slate-100 text-slate-800 rounded-bl-md'
                }`}
              >
                <div className="whitespace-pre-wrap">
                  {msg.role === 'assistant' ? formatMessageContent(msg.content) : msg.content}
                </div>
                {/* TTS Button for assistant messages */}
                {msg.role === 'assistant' && (
                  <button
                    onClick={() => handleSpeak(msg.content)}
                    className="mt-1 opacity-50 hover:opacity-100 transition-opacity"
                  >
                    {isSpeaking ? (
                      <VolumeX className="h-3 w-3" />
                    ) : (
                      <Volume2 className="h-3 w-3" />
                    )}
                  </button>
                )}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="rounded-2xl rounded-bl-md bg-slate-100 px-4 py-2.5 text-sm text-slate-600">
                <span className="animate-pulse flex items-center gap-2">
                  <span className="h-1.5 w-1.5 bg-emerald-500 rounded-full animate-bounce" />
                  <span className="h-1.5 w-1.5 bg-emerald-500 rounded-full animate-bounce delay-100" />
                  <span className="h-1.5 w-1.5 bg-emerald-500 rounded-full animate-bounce delay-200" />
                  {t('chatbot.thinking')}
                </span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <form onSubmit={handleSubmit} className="p-3 border-t bg-white">
          <div className="flex gap-2">
            {/* Voice Input Button */}
            <button
              type="button"
              onClick={toggleListening}
              className={`rounded-xl px-3 py-2 flex items-center justify-center transition-colors ${
                isListening 
                  ? 'bg-red-500 text-white animate-pulse' 
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
              title={language === 'hi' ? 'बोलें' : 'Speak'}
            >
              {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
            </button>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={isListening 
                ? (language === 'hi' ? 'सुन रहा हूं...' : 'Listening...')
                : t('chatbot.placeholder')
              }
              className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white disabled:opacity-50"
              disabled={isLoading || isListening}
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim() || isListening}
              className="rounded-xl bg-emerald-600 px-3 py-2 text-white hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-50 flex items-center justify-center"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
          {isListening && (
            <p className="text-xs text-center text-slate-400 mt-1">
              {language === 'hi' ? 'बोलना समाप्त करने के लिए फिर से माइक दबाएं' : 'Press mic again to stop listening'}
            </p>
          )}
        </form>
      </div>
    </div>
  )
}
