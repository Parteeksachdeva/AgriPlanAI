export interface PredictionFormData {
  state: string;
  season: string;
  annual_rainfall: number;
  fertilizer: number;
  pesticide: number;
  area: number;
  // optional soil / weather
  n_soil?: number | null;
  p_soil?: number | null;
  k_soil?: number | null;
  temperature?: number | null;
  humidity?: number | null;
  ph?: number | null;
}

export interface CropResult {
  crop: string;
  predicted_yield: number;  // t/ha
  avg_price: number;        // INR/quintal
  expected_revenue: number; // INR
}

export interface PredictionResult {
  recommendations: CropResult[];
}
