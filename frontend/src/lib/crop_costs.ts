export interface CropCostData {
  seed_cost_avg: number;      // ₹/ha
  labor_days_avg: number;     // days/ha
  labor_rate_avg: number;     // ₹/day
  fertilizer_cost_avg: number; // ₹/ha
  irrigation_cost_avg: number; // ₹/ha
  pesticide_cost_avg: number;  // ₹/ha
}

export const CROP_COSTS: Record<string, CropCostData> = {
  rice: {
    seed_cost_avg: 4500,
    labor_days_avg: 60,
    labor_rate_avg: 400,
    fertilizer_cost_avg: 8000,
    irrigation_cost_avg: 5000,
    pesticide_cost_avg: 3000,
  },
  wheat: {
    seed_cost_avg: 3500,
    labor_days_avg: 40,
    labor_rate_avg: 400,
    fertilizer_cost_avg: 7000,
    irrigation_cost_avg: 4000,
    pesticide_cost_avg: 2000,
  },
  maize: {
    seed_cost_avg: 6000,
    labor_days_avg: 45,
    labor_rate_avg: 400,
    fertilizer_cost_avg: 9000,
    irrigation_cost_avg: 3500,
    pesticide_cost_avg: 2500,
  },
  chickpea: {
    seed_cost_avg: 4000,
    labor_days_avg: 30,
    labor_rate_avg: 400,
    fertilizer_cost_avg: 3000,
    irrigation_cost_avg: 1500,
    pesticide_cost_avg: 1500,
  },
  cotton: {
    seed_cost_avg: 8000,
    labor_days_avg: 80,
    labor_rate_avg: 400,
    fertilizer_cost_avg: 12000,
    irrigation_cost_avg: 6000,
    pesticide_cost_avg: 7000,
  },
  jute: {
    seed_cost_avg: 3000,
    labor_days_avg: 120,
    labor_rate_avg: 400,
    fertilizer_cost_avg: 5000,
    irrigation_cost_avg: 2000,
    pesticide_cost_avg: 2000,
  },
  banana: {
    seed_cost_avg: 60000,
    labor_days_avg: 200,
    labor_rate_avg: 400,
    fertilizer_cost_avg: 45000,
    irrigation_cost_avg: 30000,
    pesticide_cost_avg: 15000,
  },
  pomegranate: {
    seed_cost_avg: 45000,
    labor_days_avg: 150,
    labor_rate_avg: 400,
    fertilizer_cost_avg: 35000,
    irrigation_cost_avg: 25000,
    pesticide_cost_avg: 20000,
  },
  grapes: {
    seed_cost_avg: 120000,
    labor_days_avg: 300,
    labor_rate_avg: 400,
    fertilizer_cost_avg: 80000,
    irrigation_cost_avg: 60000,
    pesticide_cost_avg: 40000,
  },
  mango: {
    seed_cost_avg: 40000,
    labor_days_avg: 100,
    labor_rate_avg: 400,
    fertilizer_cost_avg: 20000,
    irrigation_cost_avg: 15000,
    pesticide_cost_avg: 10000,
  },
  apple: {
    seed_cost_avg: 150000,
    labor_days_avg: 250,
    labor_rate_avg: 400,
    fertilizer_cost_avg: 50000,
    irrigation_cost_avg: 30000,
    pesticide_cost_avg: 25000,
  },
  orange: {
    seed_cost_avg: 50000,
    labor_days_avg: 150,
    labor_rate_avg: 400,
    fertilizer_cost_avg: 30000,
    irrigation_cost_avg: 20000,
    pesticide_cost_avg: 15000,
  },
  papaya: {
    seed_cost_avg: 25000,
    labor_days_avg: 180,
    labor_rate_avg: 400,
    fertilizer_cost_avg: 35000,
    irrigation_cost_avg: 25000,
    pesticide_cost_avg: 12000,
  },
  coconut: {
    seed_cost_avg: 35000,
    labor_days_avg: 80,
    labor_rate_avg: 400,
    fertilizer_cost_avg: 15000,
    irrigation_cost_avg: 10000,
    pesticide_cost_avg: 5000,
  },
  coffee: {
    seed_cost_avg: 45000,
    labor_days_avg: 400,
    labor_rate_avg: 400,
    fertilizer_cost_avg: 40000,
    irrigation_cost_avg: 15000,
    pesticide_cost_avg: 20000,
  },
  tea: {
    seed_cost_avg: 55000,
    labor_days_avg: 500,
    labor_rate_avg: 400,
    fertilizer_cost_avg: 45000,
    irrigation_cost_avg: 10000,
    pesticide_cost_avg: 15000,
  },
};

export const DEFAULT_COSTS: CropCostData = {
  seed_cost_avg: 5000,
  labor_days_avg: 50,
  labor_rate_avg: 400,
  fertilizer_cost_avg: 7000,
  irrigation_cost_avg: 3000,
  pesticide_cost_avg: 3000,
};
