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

const GREETING = `I'm your crop prediction assistant. You can ask me about your yield prediction, recommended crops, profit estimates, or your input summary. Try: "What's my predicted yield?", "Which crop is most profitable?", or "What did I enter for rainfall?"`

function buildResponse(
  query: string,
  result: PredictionResult,
  formData: ResultChatbotProps['formData']
): string {
  const q = query.toLowerCase().trim()

  // Predicted yield
  if (
    /(my|the|predicted) ?yield|yield ?prediction/.test(q) &&
    !q.includes('report') &&
    result.predictedYield != null
  ) {
    return `Your predicted yield for **${formData.cropType}** is **${result.predictedYield.toLocaleString(undefined, { maximumFractionDigits: 2 })} tonnes per hectare**.`
  }

  // Profit
  if (
    /(my|expected) ?profit|my ?revenue|my ?earning/.test(q) &&
    !q.includes('report') &&
    result.expectedProfit != null
  ) {
    return `For **${formData.cropType}**, the expected profit is **₹${result.expectedProfit.toLocaleString(undefined, { maximumFractionDigits: 0 })} per hectare**.`
  }

  // Best / top crop
  if (
    /(my|best|top|alternative) ?crop|(most|highest) ?profit|recommend.*crop/.test(q) &&
    !q.includes('report') && !q.includes('disease') &&
    result.top3Crops?.length
  ) {
    const top = result.top3Crops[0]
    const list = result.top3Crops
      .map(
        (c, i) =>
          `${i + 1}. **${c.crop}**: ₹${c.expected_profit.toLocaleString(undefined, { maximumFractionDigits: 0 })}/ha`
      )
      .join('\n')
    return `Based on your conditions, the most profitable alternative crop is **${top.crop}** (₹${top.expected_profit.toLocaleString(undefined, { maximumFractionDigits: 0 })}/ha). Top 3 alternatives:\n${list}`
  }

  // Recommendation
  if (/(my|the) ?recommendation|my ?suggestion|what should i do/.test(q) && !q.includes('report') && result.recommendation) {
    return `**Recommendation:** ${result.recommendation}`
  }

  // Input summary
  if (/my ?inputs?|what (did )?i ?enter(ed)?|input ?summary|show ?me ?my ?data/.test(q)) {
    const parts: string[] = [
      `Rainfall: ${formData.rainfall} mm`,
      `Average temperature: ${formData.averageTemperature} °C`,
      `Soil type: ${formData.soilType}`,
      `Irrigation: ${formData.irrigation}`,
      `Season: ${formData.season}`,
      `Crop: ${formData.cropType}`,
      `Historical yield: ${formData.historicalYield} kg/ha`,
    ]
    if (formData.areaHectares != null) parts.push(`Area: ${formData.areaHectares} ha`)
    if (formData.state) parts.push(`State: ${formData.state}`)
    if (formData.district) parts.push(`District: ${formData.district}`)
    if (formData.soilPh != null) parts.push(`Soil pH: ${formData.soilPh}`)
    if (formData.previousCrop) parts.push(`Previous crop: ${formData.previousCrop}`)
    if (formData.humidityPercent != null) parts.push(`Humidity: ${formData.humidityPercent}%`)
    return `**Your inputs:**\n${parts.join('\n')}`
  }

  // Confidence
  if (/confidence|accuracy|how ?(reliable|accurate)/.test(q) && result.confidence != null) {
    return `Model confidence for this prediction is **${Math.round(result.confidence * 100)}%**.`
  }

  // Default
  return `I can answer questions about your **predicted yield**, **profit**, **top alternative crops**, **recommendations**, or **your input summary**. Ask something like: "What's my predicted yield?" or "Which crop is best for my conditions?"`
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

    // First try the built-in quick responses for basic input questions
    let reply = buildResponse(text, result, formData)
    
    // If the mock system returns the default fallback or is unsure, ask the real AI RAG
    if (reply.includes("I can answer questions about your") || reply.includes("I don't know")) {
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
          Get answers about yield, profit, and recommendations
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
              placeholder="Ask about your prediction..."
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
