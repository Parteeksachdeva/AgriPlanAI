import type { PredictionFormData, PredictionResult } from './types'

const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:8000'

export async function submitPrediction(
  data: PredictionFormData
): Promise<PredictionResult> {
  const payload = {
    state: data.state,
    season: data.season,
    annual_rainfall: data.annual_rainfall,
    fertilizer: data.fertilizer,
    pesticide: data.pesticide,
    area: data.area,
    crop: data.crop,
    n_soil: data.n_soil ?? null,
    p_soil: data.p_soil ?? null,
    k_soil: data.k_soil ?? null,
    temperature: data.temperature ?? null,
    humidity: data.humidity ?? null,
    ph: data.ph ?? null,
  }

  const res = await fetch(`${API_BASE}/predict`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!res.ok) throw new Error(`API error: ${res.status}`)

  const result = await res.json()
  return {
    predictedYield: result.predicted_yield,
    expectedProfit: result.expected_profit,
    top3Crops: result.top_3_crops,
    message: 'Prediction generated successfully from the model.',
    confidence: 0.92,
    recommendation: result.top_3_crops?.[0]
      ? `Consider switching to ${result.top_3_crops[0].crop} for higher profitability if conditions allow.`
      : undefined,
  }
}

export async function askChatbot(question: string): Promise<string> {
  try {
    const res = await fetch(`${API_BASE}/api/ask`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question }),
    })

    if (!res.ok) throw new Error(`API error: ${res.status}`)

    const result = await res.json()
    return result.answer
  } catch (error) {
    console.error('Failed to query RAG backend API:', error)
    return "I'm sorry, I'm having trouble connecting to my agricultural knowledge base right now. Please try again later."
  }
}
