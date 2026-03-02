import { useState, useRef, useEffect, useCallback } from 'react'
import type { PredictionResult, PredictionFormData } from '@/types'
import { askChatbot } from '@/api'
import { useLanguage } from '@/i18n'
import { Sprout, TrendingUp, Wallet, ClipboardList, Send, X, Minimize2, Maximize2, Bot, Landmark, Lightbulb } from 'lucide-react'

interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  isContextUpdate?: boolean
}

interface ResultChatbotProps {
  result: PredictionResult
  formData: PredictionFormData
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
  t: TranslateFn
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

export function ResultChatbot({ result, formData }: ResultChatbotProps) {
  const { t, language } = useLanguage()
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const [currentContextKey, setCurrentContextKey] = useState<string>('')
  const [unreadCount, setUnreadCount] = useState(0)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const hasInitialized = useRef(false)
  const chatContainerRef = useRef<HTMLDivElement>(null)

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
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen])

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

    const { response, usedRAG } = buildResponse(text, result, formData, t as TranslateFn)
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
  }, [result, formData, t, language, isLoading])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await handleSendMessage(input)
  }

  const handleOpen = () => {
    setIsOpen(true)
    setIsMinimized(false)
    setUnreadCount(0)
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
      className="fixed bottom-6 right-6 z-50 w-[380px] max-w-[calc(100vw-48px)]"
    >
      <div className="bg-white rounded-2xl shadow-2xl border overflow-hidden flex flex-col max-h-[600px]">
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
        <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-[300px] max-h-[400px]">
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
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={t('chatbot.placeholder')}
              className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white disabled:opacity-50"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="rounded-xl bg-emerald-600 px-3 py-2 text-white hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-50 flex items-center justify-center"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
