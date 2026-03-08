import { useState } from 'react';
import { CROP_COSTS, DEFAULT_COSTS } from '../lib/crop_costs';
import { formatIndianNumber } from '../lib/utils';
import { calculateSoilRecommendations, SOIL_REQUIREMENTS, DEFAULT_REQUIREMENT } from '../lib/soil_data';
import type { SoilNutrients } from '../lib/soil_data';
import { TrendingUp, Wallet, Sun } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ProfitCalculatorProps {
  initialCropName: string;
  initialYield: number;
  initialArea: number;
  initialMandiPrice: number;
  currentSoil?: SoilNutrients;
  annualRainfall?: number;
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

  // Calculations
  const totalLaborCost = laborDays * laborRate;
  const revenue = yieldVal * area * 10 * mandiPrice;
  
  const soilAmendments = currentSoil 
    ? calculateSoilRecommendations(currentSoil, initialCropName)
    : [];
  const soilAmendmentCost = soilAmendments.reduce((sum, rec) => sum + rec.cost, 0);
  
  const baseTotalCost = (seedCost + totalLaborCost + fertilizerCost + irrigationCost + pesticideCost) * area;
  const totalCost = baseTotalCost + (soilAmendmentCost * area);
  const netProfit = revenue - totalCost;
  const profitMargin = revenue > 0 ? (netProfit / revenue) * 100 : 0;
  const isLoss = netProfit < 0;
  
  // Yield scenarios
  const req = SOIL_REQUIREMENTS[initialCropName.toLowerCase()] || DEFAULT_REQUIREMENT;
  const nGap = currentSoil ? Math.max(0, req.ideal.n - currentSoil.n) : 0;
  const pGap = currentSoil ? Math.max(0, req.ideal.p - currentSoil.p) : 0;
  const kGap = currentSoil ? Math.max(0, req.ideal.k - currentSoil.k) : 0;
  const hasDeficiency = nGap > 0 || pGap > 0 || kGap > 0;
  
  const yieldImprovementFactor = hasDeficiency 
    ? 1 + (0.15 * (nGap > 0 ? 0.4 : 0) + 0.10 * (pGap > 0 ? 0.3 : 0) + 0.08 * (kGap > 0 ? 0.3 : 0))
    : 1;
  const improvedYield = yieldVal * Math.min(1.25, yieldImprovementFactor);
  const improvedRevenue = improvedYield * area * 10 * mandiPrice;
  const improvedProfit = improvedRevenue - totalCost;
  
  // Weather scenarios
  const rainfallRiskFactor = annualRainfall < 500 ? 0.85 : annualRainfall > 1500 ? 0.90 : 0.95;
  const worstCaseYield = yieldVal * rainfallRiskFactor * 0.85;
  const bestCaseYield = yieldVal * 1.05;
  const worstCaseRevenue = worstCaseYield * area * 10 * mandiPrice;
  const bestCaseRevenue = bestCaseYield * area * 10 * mandiPrice;
  const worstCaseProfit = worstCaseRevenue - totalCost;
  const bestCaseProfit = bestCaseRevenue - totalCost;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-100 rounded-lg">
            <Wallet className="h-5 w-5 text-emerald-600" />
          </div>
          <div>
            <h3 className="font-bold text-foreground">Profit Calculator</h3>
            <p className="text-xs text-muted-foreground">Estimate your earnings</p>
          </div>
        </div>
        <div className={cn(
          "px-4 py-2 rounded-full text-sm font-bold",
          isLoss ? "bg-rose-100 text-rose-700" : "bg-emerald-100 text-emerald-700"
        )}>
          {isLoss ? 'Potential Loss' : 'Potential Profit'}
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Inputs Column */}
        <div className="space-y-4">
          {/* Quick Stats */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-slate-50 rounded-xl p-3 border">
              <label className="text-xs text-slate-500 block mb-1">Yield (t/ha)</label>
              <input
                type="number"
                value={yieldVal}
                onChange={(e) => setYieldVal(Number(e.target.value))}
                className="w-full text-lg font-bold bg-transparent outline-none"
              />
            </div>
            <div className="bg-slate-50 rounded-xl p-3 border">
              <label className="text-xs text-slate-500 block mb-1">Area (ha)</label>
              <input
                type="number"
                value={area}
                onChange={(e) => setArea(Number(e.target.value))}
                className="w-full text-lg font-bold bg-transparent outline-none"
              />
            </div>
            <div className="bg-slate-50 rounded-xl p-3 border">
              <label className="text-xs text-slate-500 block mb-1">Price (₹/q)</label>
              <input
                type="number"
                value={mandiPrice}
                onChange={(e) => setMandiPrice(Number(e.target.value))}
                className="w-full text-lg font-bold bg-transparent outline-none"
              />
            </div>
          </div>

          {/* Cost Inputs */}
          <div className="bg-white rounded-2xl border p-4 space-y-4">
            <h4 className="text-sm font-semibold text-slate-700">Cost per Hectare</h4>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-slate-500 block mb-1">Seed Cost (₹)</label>
                <input
                  type="number"
                  value={seedCost}
                  onChange={(e) => setSeedCost(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-50 rounded-lg text-sm font-medium outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="text-xs text-slate-500 block mb-1">Labor Days</label>
                <input
                  type="number"
                  value={laborDays}
                  onChange={(e) => setLaborDays(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-50 rounded-lg text-sm font-medium outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="text-xs text-slate-500 block mb-1">Labor Rate (₹/day)</label>
                <input
                  type="number"
                  value={laborRate}
                  onChange={(e) => setLaborRate(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-50 rounded-lg text-sm font-medium outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="text-xs text-slate-500 block mb-1">Fertilizer (₹)</label>
                <input
                  type="number"
                  value={fertilizerCost}
                  onChange={(e) => setFertilizerCost(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-50 rounded-lg text-sm font-medium outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="text-xs text-slate-500 block mb-1">Irrigation (₹)</label>
                <input
                  type="number"
                  value={irrigationCost}
                  onChange={(e) => setIrrigationCost(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-50 rounded-lg text-sm font-medium outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="text-xs text-slate-500 block mb-1">Pesticide (₹)</label>
                <input
                  type="number"
                  value={pesticideCost}
                  onChange={(e) => setPesticideCost(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-50 rounded-lg text-sm font-medium outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Results Column */}
        <div className="space-y-4">
          {/* Main Profit Card */}
          <div className={cn(
            "rounded-2xl p-6 text-white",
            isLoss ? "bg-gradient-to-br from-rose-500 to-rose-600" : "bg-gradient-to-br from-emerald-500 to-emerald-600"
          )}>
            <p className="text-white/80 text-sm mb-1">Estimated Net Profit</p>
            <p className="text-4xl font-bold mb-4">{formatIndianNumber(netProfit)}</p>
            
            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/20">
              <div>
                <p className="text-white/70 text-xs">Revenue</p>
                <p className="font-semibold">{formatIndianNumber(revenue)}</p>
              </div>
              <div>
                <p className="text-white/70 text-xs">Total Cost</p>
                <p className="font-semibold">{formatIndianNumber(totalCost)}</p>
              </div>
            </div>
          </div>

          {/* Profit Margin */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white rounded-xl p-4 border">
              <p className="text-xs text-slate-500 mb-1">Profit Margin</p>
              <p className={cn("text-2xl font-bold", isLoss ? "text-rose-600" : "text-emerald-600")}>
                {profitMargin.toFixed(1)}%
              </p>
            </div>
            <div className="bg-white rounded-xl p-4 border">
              <p className="text-xs text-slate-500 mb-1">Cost per Ha</p>
              <p className="text-2xl font-bold text-slate-700">
                ₹{(totalCost / area / 1000).toFixed(1)}K
              </p>
            </div>
          </div>

          {/* Scenarios */}
          <div className="bg-slate-50 rounded-2xl p-4 border">
            <h4 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
              <Sun className="h-4 w-4" />
              Weather Scenarios
            </h4>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-500">Best Case</span>
                <span className="font-medium text-emerald-600">{formatIndianNumber(bestCaseProfit)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-500">Expected</span>
                <span className={cn("font-bold", isLoss ? "text-rose-600" : "text-emerald-600")}>
                  {formatIndianNumber(netProfit)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-500">Worst Case</span>
                <span className={cn("font-medium", worstCaseProfit < 0 ? "text-rose-600" : "text-slate-700")}>
                  {formatIndianNumber(worstCaseProfit)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Soil Amendment ROI */}
      {currentSoil && soilAmendmentCost > 0 && (
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-5 border border-blue-100">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="h-5 w-5 text-blue-600" />
            <h4 className="font-semibold text-blue-900">Soil Investment Opportunity</h4>
          </div>
          
          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-white rounded-xl p-4">
              <p className="text-xs text-slate-500 mb-1">Investment Needed</p>
              <p className="text-xl font-bold text-slate-700">₹{(soilAmendmentCost * area / 1000).toFixed(1)}K</p>
            </div>
            <div className="bg-white rounded-xl p-4">
              <p className="text-xs text-slate-500 mb-1">Additional Profit</p>
              <p className="text-xl font-bold text-emerald-600">+{formatIndianNumber(improvedProfit - netProfit)}</p>
            </div>
          </div>
        </div>
      )}

      {/* Disclaimer */}
      <p className="text-xs text-slate-400 text-center">
        * Estimates based on average regional costs. Actual results may vary.
      </p>
    </div>
  );
}
