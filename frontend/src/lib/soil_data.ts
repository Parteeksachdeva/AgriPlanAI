export interface SoilNutrients {
  n: number;
  p: number;
  k: number;
  ph: number;
}

export interface AmendmentRecommendation {
  name: string;
  amount: number; // kg/ha
  cost: number;   // ₹/ha
  timing: string;
  expectedImprovement: string;
}

export interface CropSoilRequirement {
  ideal: SoilNutrients;
  min_ph: number;
  max_ph: number;
}

export const SOIL_REQUIREMENTS: Record<string, CropSoilRequirement> = {
  rice: { ideal: { n: 80, p: 40, k: 40, ph: 6.5 }, min_ph: 5.5, max_ph: 7.0 },
  wheat: { ideal: { n: 100, p: 50, k: 40, ph: 6.7 }, min_ph: 6.0, max_ph: 7.5 },
  maize: { ideal: { n: 120, p: 60, k: 40, ph: 6.5 }, min_ph: 5.8, max_ph: 7.0 },
  chickpea: { ideal: { n: 20, p: 40, k: 30, ph: 7.0 }, min_ph: 6.0, max_ph: 8.5 },
  kidneybeans: { ideal: { n: 30, p: 50, k: 40, ph: 6.5 }, min_ph: 5.5, max_ph: 7.0 },
  pigeonpeas: { ideal: { n: 25, p: 50, k: 30, ph: 7.0 }, min_ph: 6.0, max_ph: 8.0 },
  mothbeans: { ideal: { n: 20, p: 40, k: 20, ph: 7.5 }, min_ph: 6.0, max_ph: 8.5 },
  mungbean: { ideal: { n: 20, p: 40, k: 30, ph: 7.0 }, min_ph: 6.0, max_ph: 8.0 },
  blackgram: { ideal: { n: 25, p: 50, k: 30, ph: 7.0 }, min_ph: 6.0, max_ph: 8.0 },
  lentil: { ideal: { n: 20, p: 40, k: 20, ph: 7.0 }, min_ph: 6.0, max_ph: 8.0 },
  pomegranate: { ideal: { n: 50, p: 25, k: 50, ph: 6.5 }, min_ph: 5.5, max_ph: 7.5 },
  banana: { ideal: { n: 200, p: 50, k: 300, ph: 6.5 }, min_ph: 5.5, max_ph: 7.5 },
  mango: { ideal: { n: 80, p: 40, k: 80, ph: 6.5 }, min_ph: 5.5, max_ph: 7.5 },
  grapes: { ideal: { n: 100, p: 50, k: 120, ph: 6.5 }, min_ph: 5.5, max_ph: 7.0 },
  watermelon: { ideal: { n: 100, p: 50, k: 100, ph: 6.5 }, min_ph: 5.5, max_ph: 7.0 },
  muskmelon: { ideal: { n: 80, p: 40, k: 80, ph: 6.5 }, min_ph: 6.0, max_ph: 7.0 },
  apple: { ideal: { n: 100, p: 50, k: 100, ph: 6.0 }, min_ph: 5.5, max_ph: 6.5 },
  orange: { ideal: { n: 120, p: 60, k: 100, ph: 6.5 }, min_ph: 5.5, max_ph: 7.0 },
  papaya: { ideal: { n: 150, p: 150, k: 200, ph: 6.5 }, min_ph: 6.0, max_ph: 7.0 },
  coconut: { ideal: { n: 50, p: 30, k: 100, ph: 6.0 }, min_ph: 5.0, max_ph: 8.0 },
  cotton: { ideal: { n: 100, p: 50, k: 50, ph: 7.5 }, min_ph: 5.8, max_ph: 8.5 },
  jute: { ideal: { n: 60, p: 30, k: 30, ph: 6.5 }, min_ph: 6.0, max_ph: 7.5 },
  coffee: { ideal: { n: 150, p: 60, k: 120, ph: 6.0 }, min_ph: 5.5, max_ph: 6.5 },
};

export const DEFAULT_REQUIREMENT: CropSoilRequirement = {
  ideal: { n: 80, p: 40, k: 40, ph: 6.5 },
  min_ph: 6.0,
  max_ph: 7.5,
};

// Real market prices based on Indian government subsidy rates and market rates (2024)
// Source: Department of Fertilizers, Ministry of Chemicals & Fertilizers, GOI
export const AMENDMENT_DATA = [
  { name: 'Urea (Neem Coated)', n: 0.46, p: 0, k: 0, costPerKg: 5.36, timing: 'Before sowing or Top dressing (split doses)' },
  { name: 'DAP (Diammonium Phosphate)', n: 0.18, p: 0.46, k: 0, costPerKg: 27.5, timing: 'At sowing' },
  { name: 'MOP (Muriate of Potash)', n: 0, p: 0, k: 0.60, costPerKg: 17.0, timing: 'At sowing or early growth stage' },
  { name: 'Agricultural Lime (Dolomite)', type: 'ph_up', costPerKg: 2.5, timing: '3-4 weeks before sowing' },
  { name: 'Elemental Sulfur (Agricultural Grade)', type: 'ph_down', costPerKg: 12.0, timing: '2-3 weeks before sowing' },
  { name: 'SSP (Single Super Phosphate)', n: 0, p: 0.16, k: 0, costPerKg: 8.5, timing: 'At sowing' },
  { name: 'Complex Fertilizer (NPK 10-26-26)', n: 0.10, p: 0.26, k: 0.26, costPerKg: 32.0, timing: 'At sowing' },
];

export function calculateSoilRecommendations(current: SoilNutrients, targetCrop: string): AmendmentRecommendation[] {
  const req = SOIL_REQUIREMENTS[targetCrop.toLowerCase()] || DEFAULT_REQUIREMENT;
  const recommendations: AmendmentRecommendation[] = [];

  // Get amendment costs from AMENDMENT_DATA
  const limeCost = AMENDMENT_DATA.find(f => f.name.includes('Lime'))?.costPerKg || 2.5;
  const sulfurCost = AMENDMENT_DATA.find(f => f.name.includes('Sulfur'))?.costPerKg || 12.0;
  
  // pH Amendment based on agricultural research
  // Dolomitic lime: ~1.5-2 tonnes/ha to raise pH by 1 unit (depending on soil texture)
  if (current.ph < req.min_ph) {
    const gap = req.ideal.ph - current.ph;
    // Conservative estimate: 1500kg lime per 1.0 pH unit increase
    const amount = Math.round(gap * 1500); 
    if (amount > 0) {
      recommendations.push({
        name: 'Agricultural Lime (Dolomite)',
        amount,
        cost: Math.round(amount * limeCost),
        timing: '3-4 weeks before sowing',
        expectedImprovement: `Raise pH from ${current.ph.toFixed(1)} to ~${req.ideal.ph.toFixed(1)}`
      });
    }
  } else if (current.ph > req.max_ph) {
    const gap = current.ph - req.ideal.ph;
    // Elemental sulfur: ~500-1000kg/ha to lower pH by 1 unit
    const amount = Math.round(gap * 750);
    if (amount > 0) {
      recommendations.push({
        name: 'Elemental Sulfur (Agricultural Grade)',
        amount,
        cost: Math.round(amount * sulfurCost),
        timing: '2-3 weeks before sowing',
        expectedImprovement: `Lower pH from ${current.ph.toFixed(1)} to ~${req.ideal.ph.toFixed(1)}`
      });
    }
  }

  // Nutrient Amendment Logic using real fertilizer prices
  // Get fertilizer costs from AMENDMENT_DATA
  const ureaCost = AMENDMENT_DATA.find(f => f.name.includes('Urea'))?.costPerKg || 5.36;
  const dapCost = AMENDMENT_DATA.find(f => f.name.includes('DAP'))?.costPerKg || 27.5;
  const mopCost = AMENDMENT_DATA.find(f => f.name.includes('MOP'))?.costPerKg || 17.0;
  
  // First, address Phosphorus with DAP (since DAP also gives Nitrogen)
  const pGap = req.ideal.p - current.p;
  let nFromDAP = 0;
  if (pGap > 0) {
    const dapAmount = Math.round(pGap / 0.46);
    nFromDAP = dapAmount * 0.18;
    recommendations.push({
      name: 'DAP (Diammonium Phosphate)',
      amount: dapAmount,
      cost: Math.round(dapAmount * dapCost),
      timing: 'At sowing',
      expectedImprovement: `Increase Phosphorus by ${pGap.toFixed(0)} kg/ha`
    });
  }

  // Address Nitrogen with Urea
  const nGap = req.ideal.n - (current.n + nFromDAP);
  if (nGap > 0) {
    const ureaAmount = Math.round(nGap / 0.46);
    recommendations.push({
      name: 'Urea (Neem Coated)',
      amount: ureaAmount,
      cost: Math.round(ureaAmount * ureaCost),
      timing: 'Top dressing (split doses)',
      expectedImprovement: `Increase Nitrogen by ${nGap.toFixed(0)} kg/ha`
    });
  }

  // Address Potassium with MOP
  const kGap = req.ideal.k - current.k;
  if (kGap > 0) {
    const mopAmount = Math.round(kGap / 0.60);
    recommendations.push({
      name: 'MOP (Muriate of Potash)',
      amount: mopAmount,
      cost: Math.round(mopAmount * mopCost),
      timing: 'At sowing or early growth stage',
      expectedImprovement: `Increase Potassium by ${kGap.toFixed(0)} kg/ha`
    });
  }

  return recommendations;
}
