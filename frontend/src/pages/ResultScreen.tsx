import { useLocation, useNavigate } from 'react-router-dom'
import type { PredictionResult, PredictionFormData } from '@/types'
import { ResultChatbot } from '@/components/ResultChatbot'

interface LocationState {
  result: PredictionResult
  formData: PredictionFormData
}

import { AlertTriangle, CheckCircle } from 'lucide-react'

export function ResultScreen() {
  const { state } = useLocation() as { state: LocationState | null }
  const navigate = useNavigate()

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

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
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

        <div className="space-y-6">

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
                    <th className="px-4 py-2.5 font-medium text-right">Mandi price (₹/q)</th>
                    <th className="px-4 py-2.5 font-medium text-right">Revenue (₹)</th>
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
                        className={`border-b last:border-0 ${i === 0 ? 'bg-green-500/5' : ''} ${item.suitability === 'rare' ? 'opacity-80' : ''}`}
                      >
                        <td className="px-4 py-2.5 text-muted-foreground">{i + 1}</td>
                        <td className="px-4 py-2.5 font-medium text-foreground">
                          <div className="flex flex-wrap items-center gap-2">
                            <span>{item.crop}</span>
                            {item.suitability === 'rare' && (
                              <span className="inline-flex items-center rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-medium text-amber-800 dark:bg-amber-900/30 dark:text-amber-400">
                                <AlertTriangle className="mr-0.5 h-3 w-3" />
                                Rare in {formData.state}
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
                                Higher revenue but ranked lower due to suitability
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-2.5 text-right">
                          {item.predicted_yield.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                        </td>
                        <td className="px-4 py-2.5 text-right">
                          {item.avg_price.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                        </td>
                        <td className="px-4 py-2.5 text-right font-medium text-green-700 dark:text-green-400">
                          ₹{item.expected_revenue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Input summary */}
          <div className="rounded-lg border p-4">
            <p className="mb-3 text-sm font-medium text-foreground">Your inputs</p>
            <ul className="grid gap-1 text-sm text-muted-foreground sm:grid-cols-2">
              <li>State: {formData.state}</li>
              <li>Season: {formData.season}</li>
              <li>Annual rainfall: {formData.annual_rainfall} mm</li>
              <li>Area: {formData.area} ha</li>
              <li>Fertilizer: {formData.fertilizer} kg</li>
              <li>Pesticide: {formData.pesticide} kg</li>
              {formData.temperature != null && <li>Temperature: {formData.temperature} °C</li>}
              {formData.humidity != null && <li>Humidity: {formData.humidity}%</li>}
              {formData.ph != null && <li>Soil pH: {formData.ph}</li>}
              {formData.n_soil != null && <li>N: {formData.n_soil}</li>}
              {formData.p_soil != null && <li>P: {formData.p_soil}</li>}
              {formData.k_soil != null && <li>K: {formData.k_soil}</li>}
            </ul>
          </div>
        </div>

        <div className="mt-8">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            New prediction
          </button>
        </div>
      </div>

      <ResultChatbot result={result} formData={formData} />
    </div>
  )
}
