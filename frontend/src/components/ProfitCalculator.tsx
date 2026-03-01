import { useState } from 'react';
import { CROP_COSTS, DEFAULT_COSTS } from '../lib/crop_costs';
import { formatIndianNumber } from '../lib/utils';
import { Separator } from './ui/separator';
import { calculateSoilRecommendations, SOIL_REQUIREMENTS, DEFAULT_REQUIREMENT } from '../lib/soil_data';
import type { SoilNutrients } from '../lib/soil_data';
import { TrendingUp, AlertTriangle, CheckCircle, Calculator } from 'lucide-react';

interface ProfitCalculatorProps {
  initialCropName: string;
  initialYield: number; // t/ha
  initialArea: number;  // ha
  initialMandiPrice: number; // ₹/quintal
  currentSoil?: SoilNutrients; // Optional: for soil amendment cost calculation
  annualRainfall?: number; // Optional: for weather risk calculation
}

export function ProfitCalculator({
  initialCropName,
  initialYield,
  initialArea,
  initialMandiPrice,
  currentSoil,
  annualRainfall = 800,
}: ProfitCalculatorProps) {
  const cropKey = initialCropName.toLowerCase();
  const costDefaults = CROP_COSTS[cropKey] || DEFAULT_COSTS;

  const [yieldVal, setYieldVal] = useState(initialYield);
  const [area, setArea] = useState(initialArea);
  const [mandiPrice, setMandiPrice] = useState(initialMandiPrice);

  const [seedCost, setSeedCost] = useState(costDefaults.seed_cost_avg);
  const [laborDays, setLaborDays] = useState(costDefaults.labor_days_avg);
  const [laborRate, setLaborRate] = useState(costDefaults.labor_rate_avg);
  const [fertilizerCost, setFertilizerCost] = useState(costDefaults.fertilizer_cost_avg);
  const [irrigationCost, setIrrigationCost] = useState(costDefaults.irrigation_cost_avg);
  const [pesticideCost, setPesticideCost] = useState(costDefaults.pesticide_cost_avg);

  // Derived values - base calculations first
  const totalLaborCost = laborDays * laborRate;
  const revenue = yieldVal * area * 10 * mandiPrice; // 1 ton = 10 quintals
  
  // Calculate soil amendment costs if current soil data is provided
  const soilAmendments = currentSoil 
    ? calculateSoilRecommendations(currentSoil, initialCropName)
    : [];
  const soilAmendmentCost = soilAmendments.reduce((sum, rec) => sum + rec.cost, 0);
  
  const baseTotalCost = (seedCost + totalLaborCost + fertilizerCost + irrigationCost + pesticideCost) * area;
  const totalCost = baseTotalCost + (soilAmendmentCost * area);
  const netProfit = revenue - totalCost;
  const profitMargin = revenue > 0 ? (netProfit / revenue) * 100 : 0;
  const isLoss = netProfit < 0;
  
  // Calculate improved yield scenario (if soil is amended)
  const req = SOIL_REQUIREMENTS[initialCropName.toLowerCase()] || DEFAULT_REQUIREMENT;
  const nGap = currentSoil ? Math.max(0, req.ideal.n - currentSoil.n) : 0;
  const pGap = currentSoil ? Math.max(0, req.ideal.p - currentSoil.p) : 0;
  const kGap = currentSoil ? Math.max(0, req.ideal.k - currentSoil.k) : 0;
  const hasDeficiency = nGap > 0 || pGap > 0 || kGap > 0;
  
  // Yield improvement factor based on agronomic research
  // If all nutrients are brought to optimal, yield can increase by 15-30%
  const yieldImprovementFactor = hasDeficiency 
    ? 1 + (0.15 * (nGap > 0 ? 0.4 : 0) + 0.10 * (pGap > 0 ? 0.3 : 0) + 0.08 * (kGap > 0 ? 0.3 : 0))
    : 1;
  const improvedYield = yieldVal * Math.min(1.25, yieldImprovementFactor);
  const improvedRevenue = improvedYield * area * 10 * mandiPrice;
  const improvedProfit = improvedRevenue - totalCost;
  const additionalProfitFromAmendments = improvedProfit - netProfit;
  const roiOnAmendments = soilAmendmentCost > 0 
    ? ((improvedProfit - netProfit) / (soilAmendmentCost * area)) * 100 
    : 0;
  
  // Weather risk calculation
  // Higher rainfall variability = higher risk
  const rainfallRiskFactor = annualRainfall < 500 ? 0.85 : annualRainfall > 1500 ? 0.90 : 0.95;
  const worstCaseYield = yieldVal * rainfallRiskFactor * 0.85; // 15% weather impact
  const bestCaseYield = yieldVal * 1.05; // 5% above average
  const worstCaseRevenue = worstCaseYield * area * 10 * mandiPrice;
  const bestCaseRevenue = bestCaseYield * area * 10 * mandiPrice;
  const worstCaseProfit = worstCaseRevenue - totalCost;
  const bestCaseProfit = bestCaseRevenue - totalCost;
  
  // Break-even analysis
  const breakEvenYield = totalCost / (area * 10 * mandiPrice); // t/ha needed
  const breakEvenMargin = ((yieldVal - breakEvenYield) / yieldVal) * 100;

  return (
    <div className={`rounded-2xl border p-6 shadow-sm transition-colors ${
      isLoss ? 'border-red-200 bg-red-50/30' : 'border-green-200 bg-green-50/30'
    }`}>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-foreground">Profit Calculator: {initialCropName}</h3>
        <div className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
          isLoss ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
        }`}>
          {isLoss ? 'Potential Loss' : 'Potential Profit'}
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Inputs Section */}
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Yield (t/ha)</label>
              <input
                type="number"
                value={yieldVal}
                onChange={(e) => setYieldVal(Number(e.target.value))}
                className="w-full px-3 py-2 border rounded-lg bg-background focus:ring-2 focus:ring-primary/20 outline-none transition-all"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Area (ha)</label>
              <input
                type="number"
                value={area}
                onChange={(e) => setArea(Number(e.target.value))}
                className="w-full px-3 py-2 border rounded-lg bg-background focus:ring-2 focus:ring-primary/20 outline-none transition-all"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Mandi Price (₹/q)</label>
              <input
                type="number"
                value={mandiPrice}
                onChange={(e) => setMandiPrice(Number(e.target.value))}
                className="w-full px-3 py-2 border rounded-lg bg-background focus:ring-2 focus:ring-primary/20 outline-none transition-all"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Labor Rate (₹/day)</label>
              <input
                type="number"
                value={laborRate}
                onChange={(e) => setLaborRate(Number(e.target.value))}
                className="w-full px-3 py-2 border rounded-lg bg-background focus:ring-2 focus:ring-primary/20 outline-none transition-all"
              />
            </div>
          </div>

          <Separator className="bg-foreground/10" />

          <div className="space-y-4">
            <p className="text-sm font-semibold uppercase tracking-tight text-foreground/70">Cost Details (per hectare)</p>
            <div className="grid grid-cols-2 gap-x-6 gap-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Seed Cost (₹)</label>
                <input
                  type="number"
                  value={seedCost}
                  onChange={(e) => setSeedCost(Number(e.target.value))}
                  className="w-full px-2 py-1 text-sm border-b bg-transparent border-foreground/20 focus:border-primary outline-none transition-all"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Labor Days</label>
                <input
                  type="number"
                  value={laborDays}
                  onChange={(e) => setLaborDays(Number(e.target.value))}
                  className="w-full px-2 py-1 text-sm border-b bg-transparent border-foreground/20 focus:border-primary outline-none transition-all"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Fertilizer (₹)</label>
                <input
                  type="number"
                  value={fertilizerCost}
                  onChange={(e) => setFertilizerCost(Number(e.target.value))}
                  className="w-full px-2 py-1 text-sm border-b bg-transparent border-foreground/20 focus:border-primary outline-none transition-all"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Irrigation (₹)</label>
                <input
                  type="number"
                  value={irrigationCost}
                  onChange={(e) => setIrrigationCost(Number(e.target.value))}
                  className="w-full px-2 py-1 text-sm border-b bg-transparent border-foreground/20 focus:border-primary outline-none transition-all"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Pesticide (₹)</label>
                <input
                  type="number"
                  value={pesticideCost}
                  onChange={(e) => setPesticideCost(Number(e.target.value))}
                  className="w-full px-2 py-1 text-sm border-b bg-transparent border-foreground/20 focus:border-primary outline-none transition-all"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Results Section */}
        <div className="flex flex-col justify-between rounded-xl bg-background/50 p-6 border shadow-inner">
          <div className="space-y-4">
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground font-medium">Gross Revenue</span>
              <span className="text-foreground font-bold">{formatIndianNumber(revenue)}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground font-medium">Base Production Costs</span>
              <span className="text-red-600 font-bold">- {formatIndianNumber(baseTotalCost)}</span>
            </div>
            {soilAmendmentCost > 0 && (
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground font-medium">Soil Amendments</span>
                <span className="text-amber-600 font-bold">- {formatIndianNumber(soilAmendmentCost * area)}</span>
              </div>
            )}
            <div className="flex justify-between items-center text-sm font-medium border-t border-dashed pt-2">
              <span className="text-muted-foreground">Total Expenses ({area} ha)</span>
              <span className="text-red-700 font-bold">{formatIndianNumber(totalCost)}</span>
            </div>
            <Separator className="bg-foreground/5" />
            
            <div className="py-2">
              <p className="text-sm font-medium text-muted-foreground mb-1 uppercase tracking-wider">Estimated Net Profit</p>
              <p className={`text-4xl font-extrabold tracking-tight ${
                isLoss ? 'text-red-700' : 'text-green-700'
              }`}>
                {formatIndianNumber(netProfit)}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-4">
              <div className="p-3 bg-foreground/5 rounded-lg border">
                <p className="text-[10px] uppercase font-bold text-muted-foreground mb-1">Profit Margin</p>
                <p className={`text-xl font-bold ${isLoss ? 'text-red-600' : 'text-green-600'}`}>
                  {profitMargin.toFixed(1)}%
                </p>
              </div>
              <div className="p-3 bg-foreground/5 rounded-lg border">
                <p className="text-[10px] uppercase font-bold text-muted-foreground mb-1">Cost / Hectare</p>
                <p className="text-xl font-bold text-foreground">
                  {formatIndianNumber(totalCost / area)}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-8 text-[11px] text-muted-foreground italic leading-relaxed">
            * This is an estimate based on average regional costs. Actual profitability may vary due to local market conditions, weather, and management practices.
          </div>
        </div>
      </div>
      
      {/* Decision Support Section */}
      {currentSoil && (
        <div className="mt-8 space-y-6">
          <Separator className="bg-foreground/10" />
          
          <div className="flex items-center gap-2 mb-4">
            <Calculator className="h-5 w-5 text-primary" />
            <h4 className="text-lg font-bold text-foreground">Decision Support Analysis</h4>
          </div>
          
          <div className="grid gap-6 lg:grid-cols-3">
            {/* ROI Card */}
            {soilAmendmentCost > 0 && (
              <div className="rounded-xl border bg-gradient-to-br from-blue-50 to-blue-100/50 p-5">
                <div className="flex items-center gap-2 mb-3">
                  <TrendingUp className="h-4 w-4 text-blue-600" />
                  <h5 className="font-bold text-blue-900">Soil Investment ROI</h5>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-blue-700">Investment:</span>
                    <span className="font-bold text-blue-900">₹{formatIndianNumber(soilAmendmentCost * area)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-blue-700">Expected Return:</span>
                    <span className="font-bold text-green-700">+₹{formatIndianNumber(additionalProfitFromAmendments)}</span>
                  </div>
                  <div className="flex justify-between text-sm border-t border-blue-200 pt-2">
                    <span className="text-blue-700">ROI:</span>
                    <span className={`font-bold ${roiOnAmendments > 100 ? 'text-green-700' : 'text-amber-700'}`}>
                      {roiOnAmendments.toFixed(0)}%
                    </span>
                  </div>
                  <p className="text-[10px] text-blue-600 mt-2">
                    {roiOnAmendments > 200 
                      ? 'Excellent investment! High return on soil improvement.'
                      : roiOnAmendments > 100
                      ? 'Good investment. Soil amendments will pay off.'
                      : 'Moderate returns. Consider priority amendments only.'}
                  </p>
                </div>
              </div>
            )}
            
            {/* Scenario Comparison */}
            <div className="rounded-xl border bg-gradient-to-br from-purple-50 to-purple-100/50 p-5">
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle className="h-4 w-4 text-purple-600" />
                <h5 className="font-bold text-purple-900">Yield Scenarios</h5>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-purple-700">Current Soil:</span>
                  <span className="font-medium">{yieldVal.toFixed(1)} t/ha</span>
                </div>
                {hasDeficiency && (
                  <div className="flex justify-between">
                    <span className="text-green-700">After Amendments:</span>
                    <span className="font-medium text-green-700">{improvedYield.toFixed(1)} t/ha</span>
                  </div>
                )}
                <div className="flex justify-between text-red-600">
                  <span>Bad Weather:</span>
                  <span className="font-medium">{worstCaseYield.toFixed(1)} t/ha</span>
                </div>
                <div className="flex justify-between text-green-600">
                  <span>Good Weather:</span>
                  <span className="font-medium">{bestCaseYield.toFixed(1)} t/ha</span>
                </div>
              </div>
            </div>
            
            {/* Break-even Analysis */}
            <div className="rounded-xl border bg-gradient-to-br from-amber-50 to-amber-100/50 p-5">
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
                <h5 className="font-bold text-amber-900">Break-even Analysis</h5>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-amber-700">Break-even Yield:</span>
                  <span className="font-bold text-amber-900">{breakEvenYield.toFixed(2)} t/ha</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-amber-700">Safety Margin:</span>
                  <span className={`font-bold ${breakEvenMargin > 30 ? 'text-green-700' : breakEvenMargin > 15 ? 'text-amber-700' : 'text-red-700'}`}>
                    {breakEvenMargin.toFixed(1)}%
                  </span>
                </div>
                <p className="text-[10px] text-amber-700 mt-2">
                  {breakEvenMargin > 30 
                    ? 'Safe margin. Low risk of losses.'
                    : breakEvenMargin > 15
                    ? 'Moderate margin. Monitor costs closely.'
                    : 'Tight margin. High risk if yields drop.'}
                </p>
              </div>
            </div>
          </div>
          
          {/* Risk Summary */}
          <div className="rounded-xl border bg-slate-50 p-4">
            <h5 className="font-bold text-slate-900 mb-3">Profit Range (Weather Risk)</h5>
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <div className="h-3 bg-gradient-to-r from-red-400 via-yellow-400 to-green-400 rounded-full relative">
                  <div 
                    className="absolute top-0 w-1 h-4 bg-slate-900 -mt-0.5 rounded"
                    style={{ left: `${Math.min(100, Math.max(0, (netProfit - worstCaseProfit) / (bestCaseProfit - worstCaseProfit) * 100))}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs mt-2 text-slate-600">
                  <span>Worst: ₹{formatIndianNumber(worstCaseProfit)}</span>
                  <span className="font-bold">Expected: ₹{formatIndianNumber(netProfit)}</span>
                  <span>Best: ₹{formatIndianNumber(bestCaseProfit)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
