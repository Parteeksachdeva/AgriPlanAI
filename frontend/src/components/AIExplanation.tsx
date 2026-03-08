import { useState, useEffect } from 'react';
import { API_BASE } from '@/api';
import type { CropResult } from '@/types';
import { cn } from '@/lib/utils';
import { 
  Sparkles, 
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Info,
  Brain,
  Activity,
  Scale
} from 'lucide-react';

interface AIExplanationProps {
  crop: CropResult;
  displayRank?: number;
  formData: {
    state: string;
    season: string;
    annual_rainfall: number;
    temperature?: number;
    humidity?: number;
    ph?: number;
    n_soil?: number;
    p_soil?: number;
    k_soil?: number;
  };
}

interface AIAnalysisData {
  crop: string;
  confidence_score: number;
  crop_rank: number;
  total_crops_considered: number;
  feature_importance: Array<{
    feature: string;
    importance: number;
    impact: string;
  }>;
  yield_factors: {
    base_yield: number;
    npk_factor: number;
    climate_factor: number;
    soil_factor: number;
  };
  price_trend: string;
  market_volatility: string;
  recommendation_strength: string;
}

export function AIExplanation({ crop, displayRank, formData }: AIExplanationProps) {
  const [analysis, setAnalysis] = useState<AIAnalysisData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAIAnalysis();
  }, [crop.crop, formData.state]);

  const fetchAIAnalysis = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE}/api/ai-analysis`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          crop: crop.crop,
          state: formData.state,
          season: formData.season,
          annual_rainfall: formData.annual_rainfall,
          n_soil: formData.n_soil,
          p_soil: formData.p_soil,
          k_soil: formData.k_soil,
          temperature: formData.temperature,
          humidity: formData.humidity,
          ph: formData.ph
        })
      });

      if (!response.ok) {
        throw new Error('Failed to fetch AI analysis');
      }

      const data = await response.json();
      setAnalysis(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load analysis');
    } finally {
      setLoading(false);
    }
  };

  const getImpactIcon = (impact: string) => {
    switch (impact) {
      case 'positive': return <CheckCircle2 className="h-4 w-4 text-emerald-600" />;
      case 'negative': return <AlertCircle className="h-4 w-4 text-rose-600" />;
      default: return <Info className="h-4 w-4 text-blue-600" />;
    }
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'positive': return 'text-emerald-600 bg-emerald-100';
      case 'negative': return 'text-rose-600 bg-rose-100';
      default: return 'text-blue-600 bg-blue-100';
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-32 bg-slate-100 rounded-2xl animate-pulse" />
        <div className="h-48 bg-slate-100 rounded-2xl animate-pulse" />
      </div>
    );
  }

  if (error || !analysis) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="h-12 w-12 text-amber-500 mx-auto mb-4" />
        <p className="text-slate-600">Unable to load AI analysis</p>
        <p className="text-sm text-slate-400 mt-2">{error}</p>
      </div>
    );
  }

  const overallYieldFactor = analysis.yield_factors.npk_factor * 
                            analysis.yield_factors.climate_factor * 
                            analysis.yield_factors.soil_factor;

  const currentRank = displayRank || analysis.crop_rank;

  return (
    <div className="space-y-6">
      {/* Summary - Now at the top for quick insight */}
      <div className="bg-gradient-to-r from-violet-600 to-purple-600 rounded-2xl p-5 text-white shadow-lg">
        <div className="flex items-start gap-3">
          <Sparkles className="h-6 w-6 text-amber-300 mt-0.5" />
          <div>
            <h4 className="font-bold text-lg mb-1">Our AI's Advice</h4>
            <p className="text-sm text-violet-100 leading-relaxed font-medium">
              We've analyzed your farm details against thousands of successful harvests. 
              <span className="text-white font-bold capitalize"> {crop.crop}</span> is ranked{' '}
              <span className="text-amber-300 font-bold">#{currentRank}</span> for your conditions.{' '}
              {currentRank <= 2 ? 'This is an excellent choice with very high success probability!' : 'This is a solid choice that can work well on your farm.'}
              {analysis.yield_factors.npk_factor < 1.0 && ' We suggest adding some nutrients to your soil for better results. '}
              Market shows {analysis.price_trend === 'UP' ? 'rising' : 'stable'} prices nearby.
            </p>
          </div>
        </div>
      </div>

      {/* Header with High-Tech Badge - Simplified */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-violet-100 to-purple-100 rounded-lg">
            <Brain className="h-5 w-5 text-violet-600" />
          </div>
          <div>
            <h3 className="font-bold text-foreground font-inter">Smart Recommendation</h3>
            <p className="text-xs text-muted-foreground">Based on local farming data</p>
          </div>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 rounded-full border border-emerald-200">
          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          <span className="text-xs font-semibold text-emerald-700">Recommended Success Rate</span>
          <span className="text-sm font-bold text-emerald-800">{analysis.confidence_score}%</span>
        </div>
      </div>

      {/* Feature Importance - Simplified to "Why we chose this" */}
      <div className="bg-white rounded-2xl border p-5 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <Activity className="h-5 w-5 text-violet-600" />
          <h4 className="font-bold text-slate-800">Why we chose this for you</h4>
        </div>
        <p className="text-xs text-slate-500 mb-4">
          These are the main reasons why this crop grew well in similar farms:
        </p>
        
        <div className="space-y-3">
          {analysis.feature_importance.map((feature, idx) => (
            <div key={idx} className="flex items-center gap-3">
              <div className={cn("p-1.5 rounded-lg", getImpactColor(feature.impact))}>
                {getImpactIcon(feature.impact)}
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm font-bold text-slate-700">{feature.feature === 'annual_rainfall' ? 'Rainfall Matching' : feature.feature === 'humidity' ? 'Climate Match' : feature.feature === 'ph' ? 'Soil pH Level' : feature.feature}</span>
                  <span className="text-xs font-bold text-slate-600">{feature.importance}%</span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div 
                    className={cn(
                      "h-full rounded-full",
                      feature.impact === 'positive' ? 'bg-emerald-500' : 
                      feature.impact === 'negative' ? 'bg-rose-500' : 'bg-blue-500'
                    )}
                    style={{ width: `${feature.importance}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Yield Factor Breakdown */}
      <div className="bg-white rounded-2xl border p-5">
        <div className="flex items-center gap-2 mb-4">
          <Scale className="h-5 w-5 text-amber-600" />
          <h4 className="font-semibold text-slate-800">Yield Impact Analysis</h4>
        </div>
        
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-slate-50 rounded-xl p-3">
            <p className="text-xs text-slate-500 mb-1">NPK Factor</p>
            <p className={cn(
              "text-lg font-bold",
              analysis.yield_factors.npk_factor >= 1.0 ? 'text-emerald-600' : 'text-amber-600'
            )}>
              {analysis.yield_factors.npk_factor.toFixed(2)}x
            </p>
            <p className="text-[10px] text-slate-400">
              {analysis.yield_factors.npk_factor >= 1.0 ? 'Optimal nutrients' : 'Below optimal'}
            </p>
          </div>
          <div className="bg-slate-50 rounded-xl p-3">
            <p className="text-xs text-slate-500 mb-1">Climate Factor</p>
            <p className={cn(
              "text-lg font-bold",
              analysis.yield_factors.climate_factor >= 0.95 ? 'text-emerald-600' : 'text-amber-600'
            )}>
              {analysis.yield_factors.climate_factor.toFixed(2)}x
            </p>
            <p className="text-[10px] text-slate-400">
              Based on {formData.annual_rainfall}mm rainfall
            </p>
          </div>
          <div className="bg-slate-50 rounded-xl p-3">
            <p className="text-xs text-slate-500 mb-1">Soil pH Factor</p>
            <p className={cn(
              "text-lg font-bold",
              analysis.yield_factors.soil_factor >= 1.0 ? 'text-emerald-600' : 'text-amber-600'
            )}>
              {analysis.yield_factors.soil_factor.toFixed(2)}x
            </p>
            <p className="text-[10px] text-slate-400">
              pH {formData.ph || 6.5}
            </p>
          </div>
          <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-xl p-3 border border-emerald-200">
            <p className="text-xs text-emerald-600 mb-1">Overall Factor</p>
            <p className="text-lg font-bold text-emerald-700">
              {overallYieldFactor.toFixed(2)}x
            </p>
            <p className="text-[10px] text-emerald-500">
              Combined impact
            </p>
          </div>
        </div>
      </div>

      {/* Market Intelligence */}
      <div className="bg-white rounded-2xl border p-5">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="h-5 w-5 text-blue-600" />
          <h4 className="font-semibold text-slate-800">Market Intelligence</h4>
        </div>
        
        <div className="flex gap-4">
          <div className="flex-1 bg-slate-50 rounded-xl p-3 text-center">
            <p className="text-xs text-slate-500 mb-1">Price Trend</p>
            <p className={cn(
              "text-lg font-bold",
              analysis.price_trend === 'UP' ? 'text-emerald-600' : 
              analysis.price_trend === 'DOWN' ? 'text-rose-600' : 'text-slate-600'
            )}>
              {analysis.price_trend}
            </p>
          </div>
          <div className="flex-1 bg-slate-50 rounded-xl p-3 text-center">
            <p className="text-xs text-slate-500 mb-1">Volatility</p>
            <p className={cn(
              "text-lg font-bold",
              analysis.market_volatility === 'HIGH' ? 'text-rose-600' : 
              analysis.market_volatility === 'MEDIUM' ? 'text-amber-600' : 'text-emerald-600'
            )}>
              {analysis.market_volatility}
            </p>
          </div>
          <div className="flex-1 bg-slate-50 rounded-xl p-3 text-center">
            <p className="text-xs text-slate-500 mb-1">Recommendation</p>
            <p className={cn(
              "text-sm font-bold",
              analysis.recommendation_strength === 'Strong' ? 'text-emerald-600' : 
              analysis.recommendation_strength === 'Moderate' ? 'text-amber-600' : 'text-rose-600'
            )}>
              {analysis.recommendation_strength}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
