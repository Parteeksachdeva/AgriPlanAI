import { type SoilNutrients, calculateSoilRecommendations, SOIL_REQUIREMENTS, DEFAULT_REQUIREMENT } from '@/lib/soil_data'
import { cn } from '@/lib/utils'
import { Beaker, TrendingUp, Clock, Info, CheckCircle2, ArrowRight } from 'lucide-react'

interface SoilRecommendationsProps {
  currentSoil: SoilNutrients
  targetCrop: string
}

export function SoilRecommendations({ currentSoil, targetCrop }: SoilRecommendationsProps) {
  const recommendations = calculateSoilRecommendations(currentSoil, targetCrop)
  const req = SOIL_REQUIREMENTS[targetCrop.toLowerCase()] || DEFAULT_REQUIREMENT

  const nutrients = [
    { label: 'pH', current: currentSoil.ph, ideal: req.ideal.ph, unit: '', max: 14, color: 'bg-indigo-500' },
    { label: 'Nitrogen (N)', current: currentSoil.n, ideal: req.ideal.n, unit: 'mg/kg', max: 150, color: 'bg-orange-500' },
    { label: 'Phosphorus (P)', current: currentSoil.p, ideal: req.ideal.p, unit: 'mg/kg', max: 150, color: 'bg-blue-500' },
    { label: 'Potassium (K)', current: currentSoil.k, ideal: req.ideal.k, unit: 'mg/kg', max: 300, color: 'bg-green-500' },
  ]

  const totalCost = recommendations.reduce((sum, rec) => sum + rec.cost, 0)

  return (
    <div className="space-y-6">
      {/* Nutrient Progress Bars */}
      <div className="grid gap-4 sm:grid-cols-2">
        {nutrients.map((n) => (
          <div key={n.label} className="rounded-xl border bg-card p-4 shadow-sm">
            <div className="mb-2 flex justify-between items-end">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{n.label}</span>
              <span className="text-xs font-medium">
                <span className="text-foreground font-bold">{n.current.toFixed(1)}</span>
                <span className="text-muted-foreground mx-1">/</span>
                <span className="text-primary font-bold">{n.ideal.toFixed(1)}</span>
                <span className="text-[10px] text-muted-foreground ml-1">{n.unit}</span>
              </span>
            </div>
            <div className="relative h-2 w-full overflow-hidden rounded-full bg-muted/50">
              {/* Ideal marker */}
              <div 
                className="absolute top-0 bottom-0 w-0.5 bg-primary z-10 opacity-50"
                style={{ left: `${(n.ideal / n.max) * 100}%` }}
              />
              {/* Current value bar */}
              <div 
                className={cn("h-full transition-all duration-1000 ease-out", n.color)}
                style={{ width: `${Math.min(100, (n.current / n.max) * 100)}%` }}
              />
            </div>
            <div className="mt-2 flex justify-between text-[9px] text-muted-foreground italic">
              <span>Current</span>
              <span>Target: {n.ideal.toFixed(1)}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Recommendations Cards */}
      <div className="rounded-2xl border bg-gradient-to-br from-card to-muted/20 p-6 shadow-md border-primary/10">
        <div className="flex items-center gap-2 mb-6">
          <div className="p-2 rounded-lg bg-primary/10 text-primary">
            <Beaker className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-foreground">Amendment Plan</h3>
            <p className="text-xs text-muted-foreground">Strategic actions to optimize soil for <span className="text-primary font-semibold capitalize">{targetCrop}</span></p>
          </div>
        </div>

        {recommendations.length > 0 ? (
          <div className="space-y-4">
            {recommendations.map((rec, i) => (
              <div key={i} className="group relative rounded-xl border bg-card p-4 hover:shadow-md transition-all hover:border-primary/30">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/20 text-[10px] font-bold text-primary">
                        {i + 1}
                      </span>
                      <h4 className="font-bold text-foreground">{rec.name}</h4>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground flex items-center gap-1.5">
                      <Clock className="h-3 w-3" /> {rec.timing}
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-1 gap-2 text-right">
                    <div>
                      <p className="text-[10px] uppercase font-bold text-muted-foreground/60">Amount</p>
                      <p className="text-sm font-bold text-foreground">{rec.amount.toLocaleString()} kg/ha</p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase font-bold text-muted-foreground/60">Cost</p>
                      <p className="text-sm font-bold text-green-600">₹{rec.cost.toLocaleString()}</p>
                    </div>
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t border-dashed flex items-start gap-2">
                  <TrendingUp className="h-3.5 w-3.5 mt-0.5 text-blue-500" />
                  <div>
                    <p className="text-[10px] font-bold uppercase text-muted-foreground/60 mb-1">Expected Improvement</p>
                    <p className="text-xs font-medium text-foreground/80">{rec.expectedImprovement}</p>
                  </div>
                </div>
              </div>
            ))}

            {/* Before/After Summary Card (Visual highlights requested) */}
            <div className="mt-6 rounded-xl bg-slate-900 p-5 text-white shadow-lg overflow-hidden relative">
              <div className="absolute top-0 right-0 p-8 opacity-10">
                <CheckCircle2 className="w-24 h-24" />
              </div>
              <p className="text-[10px] uppercase font-bold tracking-widest text-white/50 mb-4">Summary Comparison</p>
              
              <div className="flex items-center justify-between gap-4">
                <div className="flex-1 text-center">
                  <p className="text-[9px] text-white/50 uppercase mb-1">Current State</p>
                  <div className="flex items-center justify-center gap-2">
                    <span className="text-lg font-bold">pH {currentSoil.ph.toFixed(1)}</span>
                    <div className="flex flex-col text-[8px] text-white/40 text-left">
                      <span>N: {currentSoil.n}</span>
                      <span>P: {currentSoil.p}</span>
                    </div>
                  </div>
                </div>

                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10">
                  <ArrowRight className="h-4 w-4" />
                </div>

                <div className="flex-1 text-center">
                  <p className="text-[9px] text-primary uppercase mb-1 font-bold">Post Treatment</p>
                  <div className="flex items-center justify-center gap-2">
                    <span className="text-lg font-bold text-primary">pH {req.ideal.ph.toFixed(1)}</span>
                    <div className="flex flex-col text-[8px] text-primary/60 text-left">
                      <span>N: {req.ideal.n}</span>
                      <span>P: {req.ideal.p}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-white/10 flex justify-between items-center text-xs">
                <span className="text-white/60">Total Estimated Cost (per ha)</span>
                <span className="text-lg font-black text-green-400">₹{totalCost.toLocaleString()}</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="rounded-xl border-2 border-dashed border-green-500/30 bg-green-500/5 p-8 text-center">
            <CheckCircle2 className="mx-auto h-12 w-12 text-green-500 mb-3 opacity-50" />
            <h4 className="text-lg font-bold text-green-700">Excellent Soil Quality!</h4>
            <p className="mt-2 text-sm text-green-600/80">Your current soil parameters are already within the ideal range for <span className="capitalize font-bold">{targetCrop}</span>. No major amendments are required.</p>
          </div>
        )}
      </div>

      {/* Pro-Tip */}
      <div className="flex items-start gap-3 rounded-lg bg-blue-50/50 p-4 border border-blue-100">
        <Info className="h-5 w-5 text-blue-500 mt-0.5 shrink-0" />
        <div className="text-xs text-blue-800 leading-relaxed">
          <span className="font-bold">Agricultural Tip:</span> Soil pH affects nutrient availability. It's recommended to adjust pH first before applying major fertilizers for maximum efficiency.
        </div>
      </div>
    </div>
  )
}
