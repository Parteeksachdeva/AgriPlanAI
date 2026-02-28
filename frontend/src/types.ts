export interface PredictionFormData {
  state: string;
  season: string;
  annual_rainfall: number;
  fertilizer: number;
  pesticide: number;
  area: number;
  crop: string;
  // optional soil / weather
  n_soil?: number | null;
  p_soil?: number | null;
  k_soil?: number | null;
  temperature?: number | null;
  humidity?: number | null;
  ph?: number | null;
}

export interface CropRecommendation {
  crop: string;
  expected_profit: number;
}

export interface PredictionResult {
  predictedYield?: number;
  expectedProfit?: number;
  top3Crops?: CropRecommendation[];
  recommendation?: string;
  confidence?: number;
  message?: string;
}
