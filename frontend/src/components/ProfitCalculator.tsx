import { useState } from 'react';
import { CROP_COSTS, DEFAULT_COSTS } from '../lib/crop_costs';
import { formatIndianNumber } from '../lib/utils';
import { Separator } from './ui/separator';

interface ProfitCalculatorProps {
  initialCropName: string;
  initialYield: number; // t/ha
  initialArea: number;  // ha
  initialMandiPrice: number; // ₹/quintal
}

export function ProfitCalculator({
  initialCropName,
  initialYield,
  initialArea,
  initialMandiPrice,
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

  // Derived values
  const totalLaborCost = laborDays * laborRate;
  const revenue = yieldVal * area * 10 * mandiPrice; // 1 ton = 10 quintals
  const totalCost = (seedCost + totalLaborCost + fertilizerCost + irrigationCost + pesticideCost) * area;
  const netProfit = revenue - totalCost;
  const profitMargin = revenue > 0 ? (netProfit / revenue) * 100 : 0;
  const isLoss = netProfit < 0;

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
              <span className="text-muted-foreground font-medium">Total Expenses ({area} ha)</span>
              <span className="text-red-600 font-bold"> - {formatIndianNumber(totalCost)}</span>
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
    </div>
  );
}
