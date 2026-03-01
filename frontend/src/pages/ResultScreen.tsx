import { useLocation, useNavigate } from 'react-router-dom'
import type { PredictionResult, PredictionFormData, CropResult } from '@/types'
import { ResultChatbot } from '@/components/ResultChatbot'
import { ProfitCalculator } from '@/components/ProfitCalculator'
import { CropCalendar } from '@/components/CropCalendar'
import { SoilRecommendations } from '@/components/SoilRecommendations'
import { PricePrediction } from '@/components/PricePrediction'
import { useState } from 'react'
import { cn } from '@/lib/utils'
import { CROP_RISK_META, DEFAULT_RISK_META, CROP_MIN_RAINFALL, type RiskLevel } from '@/lib/crop_risk_data'

interface LocationState {
  result: PredictionResult
  formData: PredictionFormData
}

import { AlertTriangle, CheckCircle, Calculator, Calendar, HelpCircle, Beaker, TrendingUp } from 'lucide-react'

export function ResultScreen() {
  const { state } = useLocation() as { state: LocationState | null }
  const navigate = useNavigate()
  const [selectedCropForCalculator, setSelectedCropForCalculator] = useState<CropResult | null>(null)
  const [activeTab, setActiveTab] = useState<'calendar' | 'profit' | 'soil' | 'prices'>('calendar')

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

  // Risk calculation logic
  const getRiskInfo = (crop: string, suitability: string) => {
    const meta = CROP_RISK_META[crop.toLowerCase()] || DEFAULT_RISK_META;
    const minRainfall = CROP_MIN_RAINFALL[crop.toLowerCase()] || 0;
    
    let score = 0;
    const reasons: string[] = [];

    // 1. Suitability (Point Based)
    if (suitability === 'rare') {
      score += 2;
      reasons.push("Rarely grown in your state");
    } else if (suitability === 'common') {
      score += 1;
      reasons.push("Common but not a staple in your state");
    }

    // 2. Price Volatility
    score += meta.volatility;
    if (meta.volatility === 2) reasons.push("High price volatility");
    else if (meta.volatility === 1) reasons.push("Moderate price shifts");

    // 3. Yield Predictability
    score += meta.predictability;
    if (meta.predictability === 2) reasons.push("Yield is highly sensitive to climate");
    else if (meta.predictability === 1) reasons.push("Moderate yield unpredictability");

    // 4. Water Dependency
    if (meta.water_sensitive && formData.annual_rainfall < minRainfall) {
      score += 1;
      reasons.push("High water needs vs rainfall shortage");
    }

    let level: RiskLevel = 'low';
    if (score >= 4) level = 'high';
    else if (score >= 2) level = 'medium';

    return { level, reasons };
  };

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
                    <p className="mt-1 text-2xl font-bold text-foreground capitalize">{top.crop}</p>
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
                <p className="text-sm font-medium text-muted-foreground font-bold flex items-center gap-1.5">
                  Predicted yield
                </p>
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
            <div>
              <div className="rounded-lg border overflow-hidden">
                <div className="bg-muted/30 px-4 py-2.5 text-sm font-medium text-foreground flex justify-between items-center">
                  <span>All recommendations</span>
                  <span className="text-[10px] text-muted-foreground italic">Click <Calculator className="inline h-3 w-3" /> or <Calendar className="inline h-3 w-3" /> to analyze</span>
                </div>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-muted-foreground">
                      <th className="px-4 py-2.5 font-medium">#</th>
                      <th className="px-4 py-2.5 font-medium">Crop</th>
                      <th className="px-4 py-2.5 font-medium text-right">Yield</th>
                      <th className="px-4 py-2.5 font-medium text-center">Risk</th>
                      <th className="px-4 py-2.5 font-medium text-right">Revenue (₹)</th>
                      <th className="px-4 py-2.5 font-medium text-center whitespace-nowrap">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recommendations.map((item, i) => {
                      const { level, reasons } = getRiskInfo(item.crop, item.suitability);
                      
                      return (
                        <tr
                          key={item.crop}
                          className={`border-b last:border-0 ${item.crop === selectedCropForCalculator?.crop ? 'bg-primary/5' : ''} ${item.suitability === 'rare' ? 'opacity-80' : ''}`}
                        >
                          <td className="px-4 py-2.5 text-muted-foreground">{i + 1}</td>
                          <td className="px-4 py-2.5 font-medium text-foreground">
                            <div className="flex flex-col">
                              <span className="capitalize">{item.crop}</span>
                              <span className="text-[9px] uppercase tracking-wide text-muted-foreground/60">{item.suitability}</span>
                            </div>
                          </td>
                          <td className="px-4 py-2.5 text-right font-medium">
                            {item.predicted_yield.toLocaleString(undefined, { maximumFractionDigits: 1 })}
                            <span className="text-[9px] text-muted-foreground ml-0.5">t/ha</span>
                          </td>
                          <td className="px-4 py-2.5 text-center">
                            <div className="relative group inline-block">
                              <span className={cn(
                                "inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-tighter cursor-help whitespace-nowrap",
                                level === 'low' ? 'bg-green-100 text-green-700' : 
                                level === 'medium' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'
                              )}>
                                {level === 'low' ? 'Low' : level === 'medium' ? 'Medium' : 'High'}
                              </span>
                              
                              {/* Tooltip */}
                              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-50 w-48 p-2 bg-slate-900 text-white text-[10px] rounded-lg shadow-xl animate-in fade-in zoom-in-95 duration-200">
                                <p className="font-bold mb-1 border-b border-white/20 pb-1">Risk Factors:</p>
                                <ul className="space-y-1 list-disc list-inside">
                                  {reasons.length > 0 ? reasons.map(r => <li key={r}>{r}</li>) : <li>Stable staple crop</li>}
                                </ul>
                                <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-slate-900" />
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-2.5 text-right font-bold text-green-700 dark:text-green-400">
                            ₹{item.expected_revenue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                          </td>
                          <td className="px-4 py-2.5 text-center">
                            <div className="flex items-center justify-center gap-2">
                                <button 
                                  onClick={() => { setSelectedCropForCalculator(item); setActiveTab('profit'); }}
                                  className={`p-1.5 rounded-md transition-all ${item.crop === selectedCropForCalculator?.crop && activeTab === 'profit' ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80'}`}
                                  title="Calculate Profit"
                                >
                                  <Calculator className="h-3.5 w-3.5" />
                                </button>
                                <button 
                                  onClick={() => { setSelectedCropForCalculator(item); setActiveTab('calendar'); }}
                                  className={`p-1.5 rounded-md transition-all ${item.crop === selectedCropForCalculator?.crop && activeTab === 'calendar' ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80'}`}
                                  title="Crop Calendar"
                                >
                                  <Calendar className="h-3.5 w-3.5" />
                                </button>
                                <button 
                                  onClick={() => { setSelectedCropForCalculator(item); setActiveTab('soil'); }}
                                  className={`p-1.5 rounded-md transition-all ${item.crop === selectedCropForCalculator?.crop && activeTab === 'soil' ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80'}`}
                                  title="Soil Health"
                                >
                                  <Beaker className="h-3.5 w-3.5" />
                                </button>
                                <button 
                                  onClick={() => { setSelectedCropForCalculator(item); setActiveTab('prices'); }}
                                  className={`p-1.5 rounded-md transition-all ${item.crop === selectedCropForCalculator?.crop && activeTab === 'prices' ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80'}`}
                                  title="Price Prediction"
                                >
                                  <TrendingUp className="h-3.5 w-3.5" />
                                </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              
              <div className="mt-3 flex items-center justify-end gap-4 text-[9px] text-muted-foreground font-medium uppercase tracking-wider">
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-400" /> Low Risk</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-yellow-400" /> Medium Risk</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-400" /> High Risk</span>
                <span className="flex items-center gap-1 ml-2 italic"><HelpCircle className="h-3 w-3" /> Hover for details</span>
              </div>
            </div>
          )}

          {/* Analysis View (Calculator or Calendar) */}
          {selectedCropForCalculator && (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex border-b overflow-x-auto">
                <button 
                  onClick={() => setActiveTab('profit')}
                  className={cn(
                    "px-4 py-2 text-xs font-bold uppercase tracking-widest transition-all border-b-2 whitespace-nowrap",
                    activeTab === 'profit' ? "border-primary text-primary" : "border-transparent text-muted-foreground"
                  )}
                >
                  <div className="flex items-center gap-2">
                    <Calculator className="h-3 w-3" />
                    Profit Analysis
                  </div>
                </button>
                <button 
                  onClick={() => setActiveTab('calendar')}
                  className={cn(
                    "px-4 py-2 text-xs font-bold uppercase tracking-widest transition-all border-b-2 whitespace-nowrap",
                    activeTab === 'calendar' ? "border-primary text-primary" : "border-transparent text-muted-foreground"
                  )}
                >
                  <div className="flex items-center gap-2">
                    <Calendar className="h-3 w-3" />
                    Crop Calendar
                  </div>
                </button>
                <button 
                  onClick={() => setActiveTab('soil')}
                  className={cn(
                    "px-4 py-2 text-xs font-bold uppercase tracking-widest transition-all border-b-2 whitespace-nowrap",
                    activeTab === 'soil' ? "border-primary text-primary" : "border-transparent text-muted-foreground"
                  )}
                >
                  <div className="flex items-center gap-2">
                    <Beaker className="h-3 w-3" />
                    Soil Health
                  </div>
                </button>
                <button 
                  onClick={() => setActiveTab('prices')}
                  className={cn(
                    "px-4 py-2 text-xs font-bold uppercase tracking-widest transition-all border-b-2 whitespace-nowrap",
                    activeTab === 'prices' ? "border-primary text-primary" : "border-transparent text-muted-foreground"
                  )}
                >
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-3 w-3" />
                    Price Forecast
                  </div>
                </button>
              </div>

              {activeTab === 'calendar' ? (
                <CropCalendar 
                  cropName={selectedCropForCalculator.crop}
                  season={formData.season}
                />
              ) : activeTab === 'profit' ? (
                <ProfitCalculator
                  key={selectedCropForCalculator.crop}
                  initialCropName={selectedCropForCalculator.crop}
                  initialYield={selectedCropForCalculator.predicted_yield}
                  initialArea={formData.area}
                  initialMandiPrice={selectedCropForCalculator.avg_price}
                  currentSoil={{
                    n: formData.n_soil || 50,
                    p: formData.p_soil || 50,
                    k: formData.k_soil || 50,
                    ph: formData.ph || 6.5
                  }}
                  annualRainfall={formData.annual_rainfall || 800}
                />
              ) : activeTab === 'prices' ? (
                <PricePrediction
                  commodity={selectedCropForCalculator.crop}
                  state={formData.state}
                />
              ) : (
                <SoilRecommendations
                  currentSoil={{
                    n: formData.n_soil || 50,
                    p: formData.p_soil || 50,
                    k: formData.k_soil || 50,
                    ph: formData.ph || 6.5
                  }}
                  targetCrop={selectedCropForCalculator.crop}
                />
              )}
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
