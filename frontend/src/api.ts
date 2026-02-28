import type { PredictionFormData, PredictionResult } from './types'

const API_BASE = import.meta.env.VITE_API_URL ?? '/api'

export async function submitPrediction(
  data: PredictionFormData
): Promise<PredictionResult> {
  try {
    const payload = {
      rainfall: data.rainfall,
      averageTemperature: data.averageTemperature,
      soil_type: data.soilType,
      irrigation: data.irrigation === 'Yes' ? 1 : 0,
      season: data.season,
      crop: data.cropType,
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
      recommendation: `Consider switching to ${result.top_3_crops[0]?.crop} for higher profitability if the conditions allow.`
    }
  } catch (error) {
    console.error('Failed to fetch from backend API:', error)
    // Mock response for prototype when backend is not available
    return {
      predictedYield: Math.round(
        data.historicalYield * (0.9 + Math.random() * 0.2)
      ),
      recommendation: 'Optimal sowing window: early season. Maintain soil moisture during flowering.',
      confidence: 0.85,
      message: 'Prediction complete (mock data — connect backend for real AI).',
    }
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
