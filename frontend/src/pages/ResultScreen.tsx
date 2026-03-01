import { useLocation, useNavigate } from 'react-router-dom'
import type { PredictionResult, PredictionFormData, CropResult } from '@/types'
import { ResultChatbot } from '@/components/ResultChatbot'
import { ProfitCalculator } from '@/components/ProfitCalculator'
import { CropCalendar } from '@/components/CropCalendar'
import { SoilRecommendations } from '@/components/SoilRecommendations'
import { PricePrediction } from '@/components/PricePrediction'
import { CropComparison } from '@/components/CropComparison'
import { AIExplanation } from '@/components/AIExplanation'
import { CropRotationPlanner } from '@/components/CropRotationPlanner'
import { useState } from 'react'
import { cn } from '@/lib/utils'
import { CROP_RISK_META, DEFAULT_RISK_META, CROP_MIN_RAINFALL, type RiskLevel } from '@/lib/crop_risk_data'

interface LocationState {
  result: PredictionResult
  formData: PredictionFormData
}

import { 
  AlertTriangle, 
  CheckCircle, 
  Calendar, 
  TrendingUp,
  Sprout,
  ArrowLeft,
  Sparkles,
  Wallet,
  Leaf,
  Home
} from 'lucide-react'

export function ResultScreen() {
  const { state } = useLocation() as { state: LocationState | null }
  const navigate = useNavigate()
  const [selectedCropForCalculator, setSelectedCropForCalculator] = useState<CropResult | null>(null)
  const [activeTab, setActiveTab] = useState<'overview' | 'earnings' | 'market' | 'planning'>('overview')

  if (!state?.result) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50/50 to-emerald-50/30 flex items-center justify-center px-4">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto">
            <AlertTriangle className="h-8 w-8 text-amber-600" />
          </div>
          <p className="text-muted-foreground">No prediction data available</p>
          <button
            type="button"
            onClick={() => navigate('/')}
            className="rounded-full bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-all shadow-lg hover:shadow-xl"
          >
            Start New Analysis
          </button>
        </div>
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

    if (suitability === 'rare') {
      score += 2;
      reasons.push("Rarely grown in your state");
    } else if (suitability === 'common') {
      score += 1;
      reasons.push("Common but not a staple");
    }

    score += meta.volatility;
    if (meta.volatility === 2) reasons.push("High price volatility");
    else if (meta.volatility === 1) reasons.push("Moderate price shifts");

    score += meta.predictability;
    if (meta.predictability === 2) reasons.push("Yield sensitive to climate");
    else if (meta.predictability === 1) reasons.push("Moderate yield unpredictability");

    if (meta.water_sensitive && formData.annual_rainfall < minRainfall) {
      score += 1;
      reasons.push("High water needs vs rainfall");
    }

    let level: RiskLevel = 'low';
    if (score >= 4) level = 'high';
    else if (score >= 2) level = 'medium';

    return { level, reasons };
  };

  const getRiskColor = (level: RiskLevel) => {
    switch (level) {
      case 'low': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'medium': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'high': return 'bg-rose-100 text-rose-700 border-rose-200';
    }
  };

  const getSuitabilityIcon = (suitability: string) => {
    switch (suitability) {
      case 'traditional': return <CheckCircle className="h-4 w-4 text-emerald-500" />;
      case 'common': return <Leaf className="h-4 w-4 text-blue-500" />;
      default: return <AlertTriangle className="h-4 w-4 text-amber-500" />;
    }
  };

  const getSuitabilityColor = (suitability: string) => {
    switch (suitability) {
      case 'traditional': return 'bg-emerald-50 text-emerald-700 border-emerald-100';
      case 'common': return 'bg-blue-50 text-blue-700 border-blue-100';
      default: return 'bg-amber-50 text-amber-700 border-amber-100';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50/30 via-white to-emerald-50/20">
      {/* Progress Steps */}
      <div className="bg-emerald-50 border-b">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-center">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center">
                  <CheckCircle className="h-4 w-4 text-white" />
                </div>
                <span className="text-sm font-medium text-emerald-700">Enter Details</span>
              </div>
              <div className="w-12 h-0.5 bg-emerald-300" />
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center">
                  <CheckCircle className="h-4 w-4 text-white" />
                </div>
                <span className="text-sm font-medium text-emerald-700">AI Analysis</span>
              </div>
              <div className="w-12 h-0.5 bg-emerald-300" />
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center ring-4 ring-emerald-100">
                  <span className="text-sm font-bold text-white">3</span>
                </div>
                <span className="text-sm font-bold text-emerald-800">Get Results</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Header */}
      <div className="bg-white/80 backdrop-blur-md border-b sticky top-[73px] z-40">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate('/form')}
              className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Form
            </button>
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-amber-500" />
              <span className="font-semibold text-foreground">Your AI Crop Analysis</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => navigate('/')}
                className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                <Home className="h-4 w-4" />
                Home
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Top Recommendation Hero */}
        {top && (
          <div className="mb-8">
            <div className="bg-gradient-to-br from-emerald-600 to-green-700 rounded-3xl p-8 text-white shadow-2xl relative overflow-hidden">
              {/* Decorative elements */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />
              
              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-4">
                  <span className="px-3 py-1 bg-white/20 rounded-full text-xs font-medium backdrop-blur-sm">
                    Top Recommendation
                  </span>
                  <span className={cn(
                    "px-3 py-1 rounded-full text-xs font-medium backdrop-blur-sm flex items-center gap-1.5",
                    getSuitabilityColor(top.suitability).replace('bg-', 'bg-white/').replace('text-', 'text-').replace('border-', '')
                  )}>
                    {getSuitabilityIcon(top.suitability)}
                    {top.suitability === 'traditional' ? 'Traditional Crop' : top.suitability === 'common' ? 'Common Crop' : 'New Crop'}
                  </span>
                </div>
                
                <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
                  <div>
                    <h1 className="text-4xl md:text-5xl font-bold capitalize mb-2">{top.crop}</h1>
                    <p className="text-green-100 text-lg">
                      Best match for {formData.state} • {formData.season} season
                    </p>
                  </div>
                  
                  <div className="flex gap-4">
                    <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 min-w-[140px]">
                      <p className="text-green-200 text-sm mb-1">Expected Yield</p>
                      <p className="text-2xl font-bold">{top.predicted_yield.toFixed(1)} <span className="text-lg font-normal">t/ha</span></p>
                    </div>
                    <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 min-w-[140px]">
                      <p className="text-green-200 text-sm mb-1">Revenue</p>
                      <p className="text-2xl font-bold">₹{(top.expected_revenue / 1000).toFixed(0)}K</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Column - Crop List */}
          <div className="lg:col-span-1 space-y-4">
            <div className="bg-white rounded-2xl shadow-sm border p-6">
              <h2 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                <Sprout className="h-5 w-5 text-emerald-500" />
                All Recommendations
              </h2>
              
              <div className="space-y-3">
                {recommendations.map((item, i) => {
                  const { level } = getRiskInfo(item.crop, item.suitability);
                  const isSelected = item.crop === selectedCropForCalculator?.crop;
                  
                  return (
                    <button
                      key={item.crop}
                      onClick={() => setSelectedCropForCalculator(item)}
                      className={cn(
                        "w-full text-left p-4 rounded-xl transition-all duration-200 border",
                        isSelected 
                          ? "bg-emerald-50 border-emerald-300 shadow-md ring-2 ring-emerald-100" 
                          : "bg-white border-gray-100 hover:border-emerald-200 hover:shadow-sm"
                      )}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-bold text-muted-foreground">#{i + 1}</span>
                            <span className="font-semibold capitalize text-foreground">{item.crop}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={cn(
                              "px-2 py-0.5 rounded-full text-[10px] font-medium border",
                              getRiskColor(level)
                            )}>
                              {level} risk
                            </span>
                            <span className={cn(
                              "px-2 py-0.5 rounded-full text-[10px] font-medium border",
                              getSuitabilityColor(item.suitability)
                            )}>
                              {item.suitability}
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-emerald-600">
                            ₹{(item.expected_revenue / 1000).toFixed(0)}K
                          </p>
                          <p className="text-xs text-muted-foreground">{item.predicted_yield.toFixed(1)} t/ha</p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Farm Summary Card */}
            <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-6 text-white">
              <h3 className="text-sm font-medium text-slate-300 mb-4 uppercase tracking-wider">Your Farm</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-400">Location</span>
                  <span className="font-medium">{formData.state}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Season</span>
                  <span className="font-medium">{formData.season}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Area</span>
                  <span className="font-medium">{formData.area} ha</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Rainfall</span>
                  <span className="font-medium">{formData.annual_rainfall} mm</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Analysis Tabs */}
          <div className="lg:col-span-2">
            {selectedCropForCalculator && (
              <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
                {/* Tab Navigation - Simplified for Farmers */}
                <div className="border-b bg-gray-50/50">
                  <div className="flex">
                    {[
                      { 
                        id: 'overview', 
                        label: 'Crop Overview', 
                        icon: Sprout,
                        desc: 'Why this crop suits you'
                      },
                      { 
                        id: 'earnings', 
                        label: 'Your Earnings', 
                        icon: Wallet,
                        desc: 'Profit & costs'
                      },
                      { 
                        id: 'market', 
                        label: 'Market Prices', 
                        icon: TrendingUp,
                        desc: 'When & where to sell'
                      },
                      { 
                        id: 'planning', 
                        label: 'Farm Planning', 
                        icon: Calendar,
                        desc: 'Calendar & rotation'
                      },
                    ].map((tab) => (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as typeof activeTab)}
                        className={cn(
                          "flex-1 flex flex-col items-center gap-1 px-4 py-4 text-sm font-medium transition-all border-b-2",
                          activeTab === tab.id
                            ? "border-emerald-500 text-emerald-700 bg-white"
                            : "border-transparent text-muted-foreground hover:text-foreground hover:bg-white/50"
                        )}
                      >
                        <tab.icon className="h-5 w-5 mb-1" />
                        <span>{tab.label}</span>
                        <span className="text-[10px] font-normal opacity-70 hidden sm:block">{tab.desc}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Tab Content */}
                <div className="p-6">
                  {activeTab === 'overview' ? (
                    <div className="space-y-6">
                      {/* AI Explanation */}
                      <AIExplanation 
                        crop={selectedCropForCalculator}
                        formData={{
                          state: formData.state,
                          season: formData.season,
                          annual_rainfall: formData.annual_rainfall,
                          temperature: formData.temperature || undefined,
                          humidity: formData.humidity || undefined,
                          ph: formData.ph || undefined,
                          n_soil: formData.n_soil || undefined,
                          p_soil: formData.p_soil || undefined,
                          k_soil: formData.k_soil || undefined
                        }}
                      />
                      {/* Soil Recommendations */}
                      <div className="border-t pt-6">
                        <SoilRecommendations
                          currentSoil={{
                            n: formData.n_soil || 50,
                            p: formData.p_soil || 50,
                            k: formData.k_soil || 50,
                            ph: formData.ph || 6.5
                          }}
                          targetCrop={selectedCropForCalculator.crop}
                        />
                      </div>
                    </div>
                  ) : activeTab === 'earnings' ? (
                    <div className="space-y-6">
                      {/* Profit Calculator */}
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
                      {/* Crop Comparison */}
                      <div className="border-t pt-6">
                        <CropComparison 
                          crops={recommendations}
                          formData={{
                            state: formData.state,
                            season: formData.season,
                            annual_rainfall: formData.annual_rainfall,
                            area: formData.area
                          }}
                        />
                      </div>
                    </div>
                  ) : activeTab === 'market' ? (
                    <PricePrediction
                      commodity={selectedCropForCalculator.crop}
                      state={formData.state}
                    />
                  ) : (
                    <div className="space-y-6">
                      {/* Crop Calendar */}
                      <CropCalendar 
                        cropName={selectedCropForCalculator.crop}
                        season={formData.season}
                      />
                      {/* Rotation Planner */}
                      <div className="border-t pt-6">
                        <CropRotationPlanner 
                          currentCrop={selectedCropForCalculator.crop}
                          season={formData.season}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Chatbot Section */}
        <div className="mt-8">
          <ResultChatbot result={result} formData={formData} />
        </div>
      </div>
    </div>
  )
}
