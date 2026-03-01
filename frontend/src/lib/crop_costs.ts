export interface CropCostData {
  seed_cost_avg: number;      // ₹/ha
  labor_days_avg: number;     // days/ha
  labor_rate_avg: number;     // ₹/day
  fertilizer_cost_avg: number; // ₹/ha
  irrigation_cost_avg: number; // ₹/ha
  pesticide_cost_avg: number;  // ₹/ha
}

// Cost of Cultivation data based on:
// - Ministry of Agriculture & Farmers Welfare, GOI (Cost of Cultivation surveys)
// - State Agricultural Universities research
// - Market rates for inputs (2024)
// Note: Costs vary significantly by region, irrigation type, and farming practices

export const CROP_COSTS: Record<string, CropCostData> = {
  // Cereal Crops
  rice: {
    seed_cost_avg: 3500,        // HYV seeds: ₹2500-4500/ha
    labor_days_avg: 75,         // Transplanting, weeding, harvesting
    labor_rate_avg: 350,        // MNREGA rate: ₹300-400/day
    fertilizer_cost_avg: 6500,  // NPK + micronutrients
    irrigation_cost_avg: 4500,  // Electricity/diesel for pumps
    pesticide_cost_avg: 2500,   // Insecticides + herbicides
  },
  wheat: {
    seed_cost_avg: 2800,        // Certified seeds: ₹2200-3500/ha
    labor_days_avg: 35,         // Less labor-intensive than rice
    labor_rate_avg: 350,
    fertilizer_cost_avg: 6000,  // Higher N requirement
    irrigation_cost_avg: 3500,  // 4-5 irrigations
    pesticide_cost_avg: 1800,   // Lower pest pressure
  },
  maize: {
    seed_cost_avg: 4500,        // Hybrid seeds: ₹3500-6000/ha
    labor_days_avg: 40,
    labor_rate_avg: 350,
    fertilizer_cost_avg: 7500,  // High N requirement
    irrigation_cost_avg: 3000,  // Less water than rice
    pesticide_cost_avg: 2200,   // Stem borer control
  },
  
  // Pulse Crops (lower input costs, fix nitrogen)
  chickpea: {
    seed_cost_avg: 3200,        // ₹2500-4000/ha
    labor_days_avg: 25,         // Less labor-intensive
    labor_rate_avg: 350,
    fertilizer_cost_avg: 2500,  // Lower N need (nitrogen-fixing)
    irrigation_cost_avg: 1200,  // Mostly rainfed
    pesticide_cost_avg: 1200,   // Pod borer management
  },
  kidneybeans: {
    seed_cost_avg: 3800,
    labor_days_avg: 30,
    labor_rate_avg: 350,
    fertilizer_cost_avg: 2800,
    irrigation_cost_avg: 1500,
    pesticide_cost_avg: 1400,
  },
  pigeonpeas: {
    seed_cost_avg: 3000,
    labor_days_avg: 28,
    labor_rate_avg: 350,
    fertilizer_cost_avg: 2400,
    irrigation_cost_avg: 1000,
    pesticide_cost_avg: 1300,
  },
  mothbeans: {
    seed_cost_avg: 2200,
    labor_days_avg: 20,
    labor_rate_avg: 350,
    fertilizer_cost_avg: 1800,
    irrigation_cost_avg: 800,
    pesticide_cost_avg: 800,
  },
  mungbean: {
    seed_cost_avg: 3500,
    labor_days_avg: 22,
    labor_rate_avg: 350,
    fertilizer_cost_avg: 2200,
    irrigation_cost_avg: 1200,
    pesticide_cost_avg: 1000,
  },
  blackgram: {
    seed_cost_avg: 3400,
    labor_days_avg: 24,
    labor_rate_avg: 350,
    fertilizer_cost_avg: 2300,
    irrigation_cost_avg: 1100,
    pesticide_cost_avg: 1100,
  },
  lentil: {
    seed_cost_avg: 3100,
    labor_days_avg: 26,
    labor_rate_avg: 350,
    fertilizer_cost_avg: 2100,
    irrigation_cost_avg: 900,
    pesticide_cost_avg: 900,
  },
  
  // Cash Crops (higher input, higher returns)
  cotton: {
    seed_cost_avg: 6500,        // Bt cotton hybrids: ₹5000-8000/ha
    labor_days_avg: 90,         // High labor for picking
    labor_rate_avg: 350,
    fertilizer_cost_avg: 10000, // Heavy feeders
    irrigation_cost_avg: 5500,  // 6-8 irrigations
    pesticide_cost_avg: 6000,   // High pest pressure
  },
  jute: {
    seed_cost_avg: 2800,
    labor_days_avg: 100,        // Retting, fiber extraction
    labor_rate_avg: 350,
    fertilizer_cost_avg: 4500,
    irrigation_cost_avg: 1800,
    pesticide_cost_avg: 1800,
  },
  
  // Fruit Crops (perennial, establishment costs high)
  banana: {
    seed_cost_avg: 45000,       // Tissue culture plants: ₹35,000-60,000/ha
    labor_days_avg: 180,        // Year-round maintenance
    labor_rate_avg: 350,
    fertilizer_cost_avg: 35000, // Heavy feeders (NPK)
    irrigation_cost_avg: 25000, // Drip irrigation
    pesticide_cost_avg: 12000,  // Sigatoka, bunchy top control
  },
  pomegranate: {
    seed_cost_avg: 35000,       // Air-layered plants
    labor_days_avg: 120,
    labor_rate_avg: 350,
    fertilizer_cost_avg: 28000,
    irrigation_cost_avg: 20000,
    pesticide_cost_avg: 15000,  // Bacterial blight management
  },
  grapes: {
    seed_cost_avg: 95000,       // Rooted cuttings + trellis: ₹80,000-120,000/ha
    labor_days_avg: 250,        // Pruning, training, harvesting
    labor_rate_avg: 350,
    fertilizer_cost_avg: 65000, // Fertigation
    irrigation_cost_avg: 45000, // Drip system
    pesticide_cost_avg: 30000,  // Downy mildew, powdery mildew
  },
  mango: {
    seed_cost_avg: 32000,       // Grafted plants: ₹25,000-45,000/ha
    labor_days_avg: 80,
    labor_rate_avg: 350,
    fertilizer_cost_avg: 16000,
    irrigation_cost_avg: 12000,
    pesticide_cost_avg: 8000,   // Hopper, malformation control
  },
  apple: {
    seed_cost_avg: 120000,      // High-density plantation
    labor_days_avg: 200,
    labor_rate_avg: 400,        // Higher wages in HP/J&K
    fertilizer_cost_avg: 40000,
    irrigation_cost_avg: 25000,
    pesticide_cost_avg: 20000,  // Scab management
  },
  orange: {
    seed_cost_avg: 40000,
    labor_days_avg: 120,
    labor_rate_avg: 350,
    fertilizer_cost_avg: 24000,
    irrigation_cost_avg: 16000,
    pesticide_cost_avg: 12000,  // Citrus greening management
  },
  papaya: {
    seed_cost_avg: 20000,
    labor_days_avg: 150,
    labor_rate_avg: 350,
    fertilizer_cost_avg: 28000,
    irrigation_cost_avg: 20000,
    pesticide_cost_avg: 10000,
  },
  coconut: {
    seed_cost_avg: 28000,       // Dwarf varieties
    labor_days_avg: 60,
    labor_rate_avg: 350,
    fertilizer_cost_avg: 12000,
    irrigation_cost_avg: 8000,
    pesticide_cost_avg: 4000,
  },
  
  // Plantation Crops
  coffee: {
    seed_cost_avg: 38000,       // Arabica/Robusta seedlings
    labor_days_avg: 350,        // High labor for picking
    labor_rate_avg: 350,
    fertilizer_cost_avg: 32000,
    irrigation_cost_avg: 12000, // Shade coffee needs less irrigation
    pesticide_cost_avg: 15000,  // White stem borer, berry borer
  },
  tea: {
    seed_cost_avg: 45000,       // High-density planting
    labor_days_avg: 450,        // Plucking throughout year
    labor_rate_avg: 350,
    fertilizer_cost_avg: 35000,
    irrigation_cost_avg: 8000,
    pesticide_cost_avg: 12000,
  },
};

export const DEFAULT_COSTS: CropCostData = {
  seed_cost_avg: 4000,        // Average across crops
  labor_days_avg: 50,
  labor_rate_avg: 350,        // Based on MNREGA rates across states
  fertilizer_cost_avg: 6000,  // Average NPK cost
  irrigation_cost_avg: 3000,  // Average for 3-4 irrigations
  pesticide_cost_avg: 2500,   // Basic pest management
};
