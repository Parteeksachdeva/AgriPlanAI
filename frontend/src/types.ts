export interface PredictionFormData {
  rainfall: number
  averageTemperature: number
  soilType: string
  irrigation: 'Yes' | 'No'
  season: string
  cropType: string
  historicalYield: number
}

export interface PredictionResult {
  predictedYield?: number
  recommendation?: string
  confidence?: number
  message?: string
}
