import { type SoilNutrients, calculateSoilRecommendations, SOIL_REQUIREMENTS, DEFAULT_REQUIREMENT } from '@/lib/soil_data'
import { cn } from '@/lib/utils'
import { Beaker, TrendingUp, Clock, CheckCircle2, ArrowRight, Leaf } from 'lucide-react'

interface SoilRecommendationsProps {
  currentSoil: SoilNutrients
  targetCrop: string
}

export function SoilRecommendations({ currentSoil, targetCrop }: SoilRecommendationsProps) {
  const recommendations = calculateSoilRecommendations(currentSoil, targetCrop)
  const req = SOIL_REQUIREMENTS[targetCrop.toLowerCase()] || DEFAULT_REQUIREMENT

  const nutrients = [
    { label: 'pH', current: currentSoil.ph, ideal: req.ideal.ph, unit: '', max: 14, color: 'bg-indigo-500', lightColor: 'bg-indigo-100' },
    { label: 'Nitrogen (N)', current: currentSoil.n, ideal: req.ideal.n, unit: 'mg/kg', max: 150, color: 'bg-emerald-500', lightColor: 'bg-emerald-100' },
    { label: 'Phosphorus (P)', current: currentSoil.p, ideal: req.ideal.p, unit: 'mg/kg', max: 150, color: 'bg-blue-500', lightColor: 'bg-blue-100' },
    { label: 'Potassium (K)', current: currentSoil.k, ideal: req.ideal.k, unit: 'mg/kg', max: 300, color: 'bg-amber-500', lightColor: 'bg-amber-100' },
  ]

  const totalCost = recommendations.reduce((sum, rec) => sum + rec.cost, 0)
  const allGood = recommendations.length === 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 bg-amber-100 rounded-lg">
          <Leaf className="h-5 w-5 text-amber-600" />
        </div>
        <div>
          <h3 className="font-bold text-foreground">Soil Health Analysis</h3>
          <p className="text-xs text-muted-foreground">Optimize soil for <span className="capitalize font-medium">{targetCrop}</span></p>
        </div>
      </div>

      {/* Nutrient Status Cards */}
      <div className="grid grid-cols-2 gap-3">
        {nutrients.map((n) => {
          const percentage = Math.min(100, (n.current / n.max) * 100)
          const idealPercentage = (n.ideal / n.max) * 100
          const isGood = Math.abs(n.current - n.ideal) / n.ideal < 0.2

          return (
            <div key={n.label} className="bg-white rounded-xl p-4 border">
              <div className="flex justify-between items-start mb-2">
                <span className="text-xs font-medium text-slate-500">{n.label}</span>
                <span className={cn(
                  "text-xs font-bold px-2 py-0.5 rounded-full",
                  isGood ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
                )}>
                  {isGood ? 'Good' : 'Adjust'}
                </span>
              </div>
              
              <div className="flex items-baseline gap-1 mb-2">
                <span className="text-2xl font-bold text-slate-900">{n.current.toFixed(1)}</span>
                <span className="text-xs text-slate-400">/ {n.ideal.toFixed(1)} {n.unit}</span>
              </div>

              {/* Progress Bar */}
              <div className="relative h-2 bg-slate-100 rounded-full overflow-hidden">
                <div 
                  className={cn("absolute top-0 bottom-0 rounded-full transition-all", n.color)}
                  style={{ width: `${percentage}%` }}
                />
                <div 
                  className="absolute top-0 bottom-0 w-0.5 bg-slate-900"
                  style={{ left: `${idealPercentage}%` }}
                />
              </div>
            </div>
          )
        })}
      </div>

      {/* Recommendations */}
      {allGood ? (
        <div className="bg-emerald-50 rounded-2xl p-6 border border-emerald-100 text-center">
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="h-8 w-8 text-emerald-600" />
          </div>
          <h4 className="text-lg font-bold text-emerald-900 mb-2">Excellent Soil Quality!</h4>
          <p className="text-sm text-emerald-700">
            Your soil is already optimal for <span className="capitalize font-bold">{targetCrop}</span>. No amendments needed.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <h4 className="font-semibold text-slate-700 flex items-center gap-2">
            <Beaker className="h-4 w-4" />
            Recommended Amendments
          </h4>

          <div className="space-y-3">
            {recommendations.map((rec, i) => (
              <div key={i} className="bg-white rounded-xl p-4 border hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-100 text-amber-700 text-xs font-bold">
                        {i + 1}
                      </span>
                      <h5 className="font-semibold text-foreground">{rec.name}</h5>
                    </div>
                    <p className="text-xs text-slate-500 flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {rec.timing}
                    </p>
                  </div>
                  
                  <div className="text-right">
                    <p className="text-sm font-bold text-slate-900">{rec.amount.toLocaleString()} kg/ha</p>
                    <p className="text-xs text-emerald-600 font-medium">₹{rec.cost.toLocaleString()}</p>
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t border-dashed flex items-start gap-2">
                  <TrendingUp className="h-4 w-4 text-blue-500 mt-0.5" />
                  <p className="text-xs text-slate-600">{rec.expectedImprovement}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Summary Card */}
          <div className="bg-slate-900 rounded-2xl p-5 text-white">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm text-slate-400">Total Investment</span>
              <span className="text-2xl font-bold text-emerald-400">₹{totalCost.toLocaleString()}/ha</span>
            </div>
            
            <div className="flex items-center justify-between pt-4 border-t border-slate-700">
              <div className="text-center flex-1">
                <p className="text-xs text-slate-400 mb-1">Current pH</p>
                <p className="text-xl font-bold">{currentSoil.ph.toFixed(1)}</p>
              </div>
              <ArrowRight className="h-5 w-5 text-slate-600" />
              <div className="text-center flex-1">
                <p className="text-xs text-emerald-400 mb-1">Target pH</p>
                <p className="text-xl font-bold text-emerald-400">{req.ideal.ph.toFixed(1)}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
