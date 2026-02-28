import type { PredictionFormData, PredictionResult } from './types'

const API_BASE = import.meta.env.VITE_API_URL ?? '/api'

export async function submitPrediction(
  data: PredictionFormData
): Promise<PredictionResult> {
  try {
    const res = await fetch(`${API_BASE}/predict`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (!res.ok) throw new Error(`API error: ${res.status}`)
    return (await res.json()) as PredictionResult
  } catch {
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
