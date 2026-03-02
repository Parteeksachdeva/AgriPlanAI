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
  return { recommendations: result.recommendations }
}

export async function askChatbot(
  question: string, 
  language: 'en' | 'hi' = 'en',
  result?: PredictionResult,
  formData?: PredictionFormData
): Promise<string> {
  try {
    const payload: {
      question: string;
      language: string;
      current_recommendations?: PredictionResult['recommendations'];
      form_data?: Partial<PredictionFormData>;
    } = {
      question,
      language,
    }

    // Include current recommendations and form data if available
    if (result?.recommendations) {
      payload.current_recommendations = result.recommendations
    }
    if (formData) {
      payload.form_data = {
        state: formData.state,
        season: formData.season,
        annual_rainfall: formData.annual_rainfall,
        area: formData.area,
        n_soil: formData.n_soil,
        p_soil: formData.p_soil,
        k_soil: formData.k_soil,
        ph: formData.ph,
        temperature: formData.temperature,
        humidity: formData.humidity,
      }
    }

    const res = await fetch(`${API_BASE}/api/ask`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    if (!res.ok) throw new Error(`API error: ${res.status}`)

    const data = await res.json()
    return data.answer
  } catch (error) {
    console.error('Failed to query RAG backend API:', error)
    const errorMsg = language === 'hi' 
      ? 'मुझे खेद है, मुझे अभी अपने कृषि ज्ञान आधार से जोड़ने में समस्या हो रही है। कृपया बाद में पुनः प्रयास करें।'
      : "I'm sorry, I'm having trouble connecting to my agricultural knowledge base right now. Please try again later."
    return errorMsg
  }
}
