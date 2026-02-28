import { useState, useRef, useEffect } from 'react'
import type { PredictionResult, PredictionFormData } from '@/types'
import { askChatbot } from '@/api'

interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

interface ResultChatbotProps {
  result: PredictionResult
  formData: PredictionFormData
}

const GREETING = `I'm your crop recommendation assistant. Ask me about your top crop, expected revenue, predicted yield, mandi prices, or your input summary. Try: "Which crop is most profitable?", "What's the yield for the top crop?", or "Show me my inputs."`

function buildResponse(
  query: string,
  result: PredictionResult,
  formData: ResultChatbotProps['formData']
): string {
  const q = query.toLowerCase().trim()
  const { recommendations } = result
  const top = recommendations[0]

  // Top / best crop
  if (
    /(best|top|most profitable|highest revenue|recommended) ?crop|which crop/.test(q) &&
    top
  ) {
    const list = recommendations
      .map(
        (c, i) =>
          `${i + 1}. **${c.crop}**: ₹${c.expected_revenue.toLocaleString(undefined, { maximumFractionDigits: 0 })} revenue`
      )
      .join('\n')
    return `The most profitable crop for your conditions is **${top.crop}** with expected revenue of **₹${top.expected_revenue.toLocaleString(undefined, { maximumFractionDigits: 0 })}**.\n\nFull ranking:\n${list}`
  }

  // Yield for top crop
  if (
    /(my|the|predicted) ?yield|yield ?prediction/.test(q) &&
    top
  ) {
    return `The predicted yield for **${top.crop}** (top recommendation) is **${top.predicted_yield.toLocaleString(undefined, { maximumFractionDigits: 2 })} tonnes per hectare**.`
  }

  // Revenue / profit / earnings
  if (
    /(my|expected) ?(revenue|profit|earning)/.test(q) &&
    top
  ) {
    return `The expected revenue for **${top.crop}** is **₹${top.expected_revenue.toLocaleString(undefined, { maximumFractionDigits: 0 })}** (based on ${formData.area} ha × ${top.predicted_yield.toFixed(2)} t/ha × 10 quintals/t × ₹${top.avg_price.toFixed(0)}/quintal).`
  }

  // Mandi / market price
  if (/(mandi|market|price|rate) ?(per|of|for)?/.test(q) && top) {
    const list = recommendations
      .map((c) => `**${c.crop}**: ₹${c.avg_price.toLocaleString(undefined, { maximumFractionDigits: 0 })}/quintal`)
      .join('\n')
    return `Predicted mandi prices:\n${list}`
  }

  // Input summary
  if (/my ?inputs?|what (did )?i ?enter(ed)?|input ?summary|show ?me ?my ?data/.test(q)) {
    const parts: string[] = [
      `State: ${formData.state}`,
      `Season: ${formData.season}`,
      `Annual rainfall: ${formData.annual_rainfall} mm`,
      `Area: ${formData.area} ha`,
      `Fertilizer: ${formData.fertilizer} kg`,
      `Pesticide: ${formData.pesticide} kg`,
    ]
    if (formData.temperature != null) parts.push(`Temperature: ${formData.temperature} °C`)
    if (formData.humidity != null) parts.push(`Humidity: ${formData.humidity}%`)
    if (formData.ph != null) parts.push(`Soil pH: ${formData.ph}`)
    if (formData.n_soil != null) parts.push(`N: ${formData.n_soil}`)
    if (formData.p_soil != null) parts.push(`P: ${formData.p_soil}`)
    if (formData.k_soil != null) parts.push(`K: ${formData.k_soil}`)
    return `**Your inputs:**\n${parts.join('\n')}`
  }

  // Default — fall through to RAG
  return `I can answer questions about your **top crop**, **predicted yield**, **expected revenue**, **mandi prices**, or **input summary**. What would you like to know?`
}

function formatMessageContent(text: string) {
  return text.split('\n').map((line, i) => (
    <span key={i}>
      {line.split(/(\*\*[^*]+\*\*)/g).map((part, j) =>
        part.startsWith('**') && part.endsWith('**') ? (
          <strong key={j}>{part.slice(2, -2)}</strong>
        ) : (
          part
        )
      )}
      {i < text.split('\n').length - 1 && <br />}
    </span>
  ))
}

export function ResultChatbot({ result, formData }: ResultChatbotProps) {
  const [messages, setMessages] = useState<ChatMessage[]>(() => [
    {
      id: '0',
      role: 'assistant',
      content: GREETING,
      timestamp: new Date(),
    },
  ])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  useEffect(scrollToBottom, [messages])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const text = input.trim()
    if (!text || isLoading) return

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
      timestamp: new Date(),
    }
    setMessages((prev) => [...prev, userMsg])
    setInput('')
    setIsLoading(true)

    let reply = buildResponse(text, result, formData)

    // Fall through to RAG for general agriculture questions
    if (reply.includes('I can answer questions about your')) {
      reply = await askChatbot(text)
    }

    const assistantMsg: ChatMessage = {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: reply,
      timestamp: new Date(),
    }
    setMessages((prev) => [...prev, assistantMsg])
    setIsLoading(false)
  }

  return (
    <div className="mt-8 rounded-2xl border bg-card overflow-hidden">
      <div className="border-b bg-muted/30 px-4 py-3">
        <h3 className="text-sm font-semibold text-foreground">Ask about your results</h3>
        <p className="text-xs text-muted-foreground mt-0.5">
          Get answers about yield, revenue, and recommendations
        </p>
      </div>
      <div className="flex flex-col h-[320px]">
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm ${
                  msg.role === 'user'
                    ? 'bg-primary text-primary-foreground rounded-br-md'
                    : 'bg-muted text-foreground rounded-bl-md'
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
              <div className="rounded-2xl rounded-bl-md bg-muted px-4 py-2.5 text-sm text-muted-foreground">
                <span className="animate-pulse">Thinking...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
        <form onSubmit={handleSubmit} className="p-3 border-t bg-background">
          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about your recommendations..."
              className="flex-1 rounded-lg border border-input bg-background px-3 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:opacity-50"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:opacity-50"
            >
              Send
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
