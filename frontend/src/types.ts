export interface PredictionFormData {
  rainfall: number;
  averageTemperature: number;
  soilType: string;
  irrigation: "Yes" | "No";
  season: string;
  cropType: string;
  historicalYield: number;
  areaHectares?: number;
  state?: string;
  district?: string;
  soilPh?: number;
  previousCrop?: string;
  humidityPercent?: number;
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
