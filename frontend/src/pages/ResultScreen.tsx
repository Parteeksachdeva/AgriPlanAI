import { useLocation, useNavigate } from 'react-router-dom'
import type { PredictionResult, PredictionFormData, CropResult } from '@/types'
import { ResultChatbot } from '@/components/ResultChatbot'
import { ProfitCalculator } from '@/components/ProfitCalculator'
import { useState } from 'react'

interface LocationState {
  result: PredictionResult
  formData: PredictionFormData
}

import { AlertTriangle, CheckCircle, Calculator } from 'lucide-react'

export function ResultScreen() {
  const { state } = useLocation() as { state: LocationState | null }
  const navigate = useNavigate()
  const [selectedCropForCalculator, setSelectedCropForCalculator] = useState<CropResult | null>(null)

  if (!state?.result) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-10 text-center">
        <p className="text-muted-foreground">No prediction data. Submit the form first.</p>
        <button
          type="button"
          onClick={() => navigate('/')}
          className="mt-4 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          Go to form
        </button>
      </div>
    )
  }

  const { result, formData } = state
  const { recommendations } = result
  const top = recommendations[0]

  // Initialize selected crop if none selected
  if (!selectedCropForCalculator && top) {
    setSelectedCropForCalculator(top);
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <div className="rounded-2xl border bg-card p-8 shadow-sm">
        <h2 className="mb-2 text-2xl font-semibold tracking-tight text-foreground">
          Crop recommendations
        </h2>
        <p className="mb-8 text-muted-foreground">
          Crops ranked by suitability and expected revenue for your conditions.
          <span className="mt-2 block text-xs italic">
            Note: We prioritize crops traditionally or commonly grown in your state over those with higher revenue but lower suitability.
          </span>
        </p>

        <div className="space-y-10">

          {/* Top pick highlight */}
          {top && (
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-xl bg-primary/5 p-5 relative overflow-hidden">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Top crop</p>
                    <p className="mt-1 text-2xl font-bold text-foreground">{top.crop}</p>
                  </div>
                  {top.suitability === 'rare' ? (
                    <AlertTriangle className="h-5 w-5 text-amber-500" />
                  ) : (
                    <CheckCircle className={`h-5 w-5 ${top.suitability === 'traditional' ? 'text-green-500' : 'text-blue-500'}`} />
                  )}
                </div>
                <p className="mt-2 text-[10px] uppercase tracking-wider font-semibold text-muted-foreground/60">
                  {top.suitability === 'traditional' ? 'Traditionally grown in ' : 
                   top.suitability === 'common' ? 'Commonly grown in ' : 'Low suitability for '}{formData.state}
                </p>
              </div>
              <div className="rounded-xl bg-primary/5 p-5">
                <p className="text-sm font-medium text-muted-foreground">Predicted yield</p>
                <p className="mt-1 text-2xl font-bold text-foreground">
                  {top.predicted_yield.toLocaleString(undefined, { maximumFractionDigits: 2 })} t/ha
                </p>
              </div>
              <div className="rounded-xl bg-green-500/10 p-5">
                <p className="text-sm font-medium text-muted-foreground">Expected revenue</p>
                <p className="mt-1 text-2xl font-bold text-green-700 dark:text-green-400">
                  ₹{top.expected_revenue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </p>
              </div>
            </div>
          )}

          {/* Full ranked list */}
          {recommendations.length > 0 && (
            <div className="rounded-lg border overflow-hidden">
              <div className="bg-muted/30 px-4 py-2.5 text-sm font-medium text-foreground">
                All recommendations
              </div>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="px-4 py-2.5 font-medium">#</th>
                    <th className="px-4 py-2.5 font-medium">Crop</th>
                    <th className="px-4 py-2.5 font-medium text-right">Yield (t/ha)</th>
                    <th className="px-4 py-2.5 font-medium text-right text-nowrap">Mandi price (₹/q)</th>
                    <th className="px-4 py-2.5 font-medium text-right">Revenue (₹)</th>
                    <th className="px-4 py-2.5 font-medium text-center">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {recommendations.map((item, i) => {
                    const hasHigherRevenueThanBetterRank = recommendations
                      .slice(0, i)
                      .some(betterRanked => item.expected_revenue > betterRanked.expected_revenue);

                    return (
                      <tr
                        key={item.crop}
                        className={`border-b last:border-0 ${item.crop === selectedCropForCalculator?.crop ? 'bg-primary/5' : ''} ${item.suitability === 'rare' ? 'opacity-80' : ''}`}
                      >
                        <td className="px-4 py-2.5 text-muted-foreground">{i + 1}</td>
                        <td className="px-4 py-2.5 font-medium text-foreground">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="capitalize">{item.crop}</span>
                            {item.suitability === 'rare' && (
                              <span className="inline-flex items-center rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-medium text-amber-800 dark:bg-amber-900/30 dark:text-amber-400">
                                <AlertTriangle className="mr-0.5 h-3 w-3" />
                                Rare in {formData.state}
                              </span>
                            )}
                            {item.suitability === 'traditional' && (
                              <span className="inline-flex items-center rounded-full bg-green-100 px-1.5 py-0.5 text-[10px] font-medium text-green-800 dark:bg-green-900/30 dark:text-green-400">
                                <CheckCircle className="mr-0.5 h-3 w-3" />
                                Traditionally grown
                              </span>
                            )}
                            {item.suitability === 'common' && (
                              <span className="inline-flex items-center rounded-full bg-blue-100 px-1.5 py-0.5 text-[10px] font-medium text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                                <CheckCircle className="mr-0.5 h-3 w-3" />
                                Commonly grown
                              </span>
                            )}
                            {hasHigherRevenueThanBetterRank && (
                              <span className="inline-flex items-center rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-600 dark:bg-slate-800/50 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                                Higher revenue but ranked lower
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-2.5 text-right">
                          {item.predicted_yield.toLocaleString(undefined, { maximumFractionDigits: 1 })}
                        </td>
                        <td className="px-4 py-2.5 text-right">
                          {item.avg_price.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                        </td>
                        <td className="px-4 py-2.5 text-right font-medium text-green-700 dark:text-green-400">
                          ₹{item.expected_revenue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                        </td>
                        <td className="px-4 py-2.5 text-center">
                          <button 
                            onClick={() => setSelectedCropForCalculator(item)}
                            className={`p-1.5 rounded-md transition-all ${item.crop === selectedCropForCalculator?.crop ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground'}`}
                            title="Calculate Profit"
                          >
                            <Calculator className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Profit Calculator Section */}
          {selectedCropForCalculator && (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex items-center gap-2 text-sm font-semibold text-primary uppercase tracking-wider">
                <Calculator className="h-4 w-4" />
                <span>Profit Analysis</span>
              </div>
              <ProfitCalculator
                key={selectedCropForCalculator.crop}
                initialCropName={selectedCropForCalculator.crop}
                initialYield={selectedCropForCalculator.predicted_yield}
                initialArea={formData.area}
                initialMandiPrice={selectedCropForCalculator.avg_price}
              />
            </div>
          )}

          {/* Input summary */}
          <div className="rounded-lg border p-4 bg-muted/20">
            <p className="mb-3 text-sm font-medium text-foreground">Your farm configuration</p>
            <ul className="grid gap-x-8 gap-y-1.5 text-xs text-muted-foreground sm:grid-cols-2">
              <li className="flex justify-between border-b border-muted py-1"><span>State:</span> <span className="font-medium text-foreground">{formData.state}</span></li>
              <li className="flex justify-between border-b border-muted py-1"><span>Season:</span> <span className="font-medium text-foreground">{formData.season}</span></li>
              <li className="flex justify-between border-b border-muted py-1"><span>Annual rainfall:</span> <span className="font-medium text-foreground">{formData.annual_rainfall} mm</span></li>
              <li className="flex justify-between border-b border-muted py-1"><span>Area:</span> <span className="font-medium text-foreground">{formData.area} ha</span></li>
              <li className="flex justify-between border-b border-muted py-1"><span>Fertilizer:</span> <span className="font-medium text-foreground">{formData.fertilizer} kg</span></li>
              <li className="flex justify-between border-b border-muted py-1"><span>Pesticide:</span> <span className="font-medium text-foreground">{formData.pesticide} kg</span></li>
            </ul>
          </div>
        </div>

        <div className="mt-8 flex justify-between items-center">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="rounded-lg bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-all shadow-sm"
          >
            New prediction
          </button>
          <span className="text-[10px] text-muted-foreground italic">
            * Data based on historical Mandi prices & Kaggle Crop dataset.
          </span>
        </div>
      </div>

      <ResultChatbot result={result} formData={formData} />
    </div>
  )
}
