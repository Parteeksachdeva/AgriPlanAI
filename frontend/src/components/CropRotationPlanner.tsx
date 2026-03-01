import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { 
  RotateCcw, 
  Sprout, 
  Droplets, 
  Leaf,
  AlertCircle,
  Calendar,
  Scale,
  CheckCircle2
} from 'lucide-react';

interface CropRotationPlannerProps {
  currentCrop: string;
  season: string;
}

interface RotationPlan {
  rotation_sequence: string[];
  seasons: string[];
  soil_impact: {
    nitrogen_kg_ha: number;
    phosphorus_kg_ha: number;
    potassium_kg_ha: number;
    soil_health_score: number;
    impact_rating: string;
  };
  yearly_breakdown: Array<{
    crop: string;
    season: string;
    revenue: number;
    costs: number;
    profit: number;
  }>;
  total_profit_3yr: number;
  avg_annual_profit: number;
  benefits: string[];
  water_diversity: string[];
}

interface SoilRecoveryPlan {
  current_soil_status: {
    nitrogen: number;
    phosphorus: number;
    potassium: number;
  };
  target_crop: string;
  target_requirements: {
    nitrogen_need: number;
    phosphorus_need: number;
    potassium_need: number;
  };
  recommended_recovery_crops: Array<{
    crop: string;
    nitrogen_added: number;
    season: string;
    profit: number;
    reason: string;
  }>;
  advice: string;
}

const SEASON_COLORS: Record<string, string> = {
  'Kharif': 'bg-emerald-100 text-emerald-700 border-emerald-200',
  'Rabi': 'bg-amber-100 text-amber-700 border-amber-200',
  'Zaid': 'bg-rose-100 text-rose-700 border-rose-200',
  'Year-round': 'bg-blue-100 text-blue-700 border-blue-200'
};

const CROP_EMOJIS: Record<string, string> = {
  'Rice': '🌾',
  'Wheat': '🌾',
  'Moong Bean': '🫘',
  'Chickpea': '🫘',
  'Mustard': '🌻',
  'Cotton': '🧶',
  'Maize': '🌽',
  'Sugarcane': '🎋',
  'Potato': '🥔',
  'Tomato': '🍅',
  'Onion': '🧅',
  'Groundnut': '🥜',
  'Banana': '🍌',
  'Pomegranate': '🍎',
  'Mango': '🥭',
  'Grapes': '🍇',
  'Watermelon': '🍉',
  'Apple': '🍎',
  'Orange': '🍊',
  'Papaya': '🥭',
  'Coconut': '🥥',
  'Jute': '🌿',
  'Coffee': '☕'
};

export function CropRotationPlanner({ currentCrop, season }: CropRotationPlannerProps) {
  const [rotationPlans, setRotationPlans] = useState<RotationPlan[]>([]);
  const [soilRecovery, setSoilRecovery] = useState<SoilRecoveryPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<number>(0);
  const [showSoilRecovery, setShowSoilRecovery] = useState(false);

  useEffect(() => {
    fetchRotationPlans();
    fetchSoilRecovery();
  }, [currentCrop, season]);

  const fetchRotationPlans = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('Fetching rotation plans for:', currentCrop, season);
      
      const response = await fetch('http://localhost:8000/api/rotation-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          current_crop: currentCrop,
          season: season,
          years: 3
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `Failed to fetch rotation plans: ${response.status}`);
      }

      const data = await response.json();
      console.log('Rotation plans received:', data);
      
      if (!data.rotation_options || data.rotation_options.length === 0) {
        throw new Error('No rotation plans available for this crop');
      }
      
      setRotationPlans(data.rotation_options);
    } catch (err) {
      console.error('Error fetching rotation plans:', err);
      setError(err instanceof Error ? err.message : 'Failed to load rotation plans');
    } finally {
      setLoading(false);
    }
  };

  const fetchSoilRecovery = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/soil-recovery-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          current_n: 60,
          current_p: 40,
          current_k: 35,
          target_crop: currentCrop
        })
      });

      if (response.ok) {
        const data = await response.json();
        setSoilRecovery(data);
      }
    } catch (err) {
      console.error('Failed to load soil recovery plan:', err);
    }
  };

  const formatCurrency = (value: number) => {
    if (value >= 100000) {
      return `₹${(value / 100000).toFixed(1)}L`;
    }
    return `₹${value.toLocaleString()}`;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-48 bg-slate-100 rounded-2xl animate-pulse" />
        <div className="h-32 bg-slate-100 rounded-2xl animate-pulse" />
      </div>
    );
  }

  if (error || rotationPlans.length === 0) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="h-12 w-12 text-amber-500 mx-auto mb-4" />
        <p className="text-slate-600">Rotation plans not available</p>
        <p className="text-sm text-slate-400 mt-2 max-w-sm mx-auto">
          {error || `Rotation planning is currently only available for major crops like rice, wheat, cotton, etc. 
          ${currentCrop} rotation data coming soon.`}
        </p>
        <div className="mt-6 text-xs text-slate-400">
          <p>Supported crops: Rice, Wheat, Cotton, Maize, Moong, Chickpea,</p>
          <p>Mustard, Sugarcane, Potato, Tomato, Onion, Groundnut</p>
        </div>
      </div>
    );
  }

  const plan = rotationPlans[selectedPlan];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-100 rounded-lg">
            <RotateCcw className="h-5 w-5 text-emerald-600" />
          </div>
          <div>
            <h3 className="font-bold text-foreground">Crop Rotation Planner</h3>
            <p className="text-xs text-muted-foreground">3-year profit & soil optimization</p>
          </div>
        </div>
        {soilRecovery && (
          <button
            onClick={() => setShowSoilRecovery(!showSoilRecovery)}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",
              showSoilRecovery 
                ? "bg-amber-100 text-amber-700" 
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            )}
          >
            <Leaf className="h-4 w-4" />
            {showSoilRecovery ? 'Hide Soil Recovery' : 'Soil Recovery'}
          </button>
        )}
      </div>

      {/* Soil Recovery Section */}
      {showSoilRecovery && soilRecovery && (
        <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl p-5 border border-amber-200">
          <div className="flex items-center gap-2 mb-4">
            <Leaf className="h-5 w-5 text-amber-600" />
            <h4 className="font-semibold text-amber-900">Soil Recovery Plan</h4>
          </div>
          
          <p className="text-sm text-amber-800 mb-4">{soilRecovery.advice}</p>
          
          <div className="space-y-3">
            {soilRecovery.recommended_recovery_crops.map((crop, idx) => (
              <div key={idx} className="bg-white rounded-xl p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center text-xl">
                    {CROP_EMOJIS[crop.crop] || '🌱'}
                  </div>
                  <div>
                    <p className="font-semibold text-slate-800">{crop.crop}</p>
                    <p className="text-xs text-slate-500">{crop.reason}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-emerald-600">+{crop.nitrogen_added} kg N/ha</p>
                  <p className="text-xs text-slate-500">Profit: {formatCurrency(crop.profit)}/ha</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Plan Selector */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {rotationPlans.map((p, idx) => (
          <button
            key={idx}
            onClick={() => setSelectedPlan(idx)}
            className={cn(
              "flex-shrink-0 px-4 py-3 rounded-xl text-left transition-all border",
              selectedPlan === idx
                ? "bg-emerald-100 border-emerald-300"
                : "bg-white border-slate-200 hover:border-emerald-200"
            )}
          >
            <p className={cn("text-xs font-medium", selectedPlan === idx ? "text-emerald-600" : "text-slate-500")}>
              Option {idx + 1}
            </p>
            <p className={cn("font-bold", selectedPlan === idx ? "text-emerald-800" : "text-slate-700")}>
              {formatCurrency(p.total_profit_3yr)}
            </p>
            <p className="text-[10px] text-slate-400">3-year profit</p>
          </button>
        ))}
      </div>

      {/* 3-Year Timeline */}
      <div className="bg-white rounded-2xl border p-5">
        <h4 className="font-semibold text-foreground mb-4 flex items-center gap-2">
          <Calendar className="h-4 w-4 text-slate-500" />
          3-Year Rotation Timeline
        </h4>
        
        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-6 top-8 bottom-8 w-0.5 bg-slate-200" />
          
          <div className="space-y-6">
            {plan.yearly_breakdown.map((year, idx) => (
              <div key={idx} className="relative flex items-start gap-4">
                {/* Year marker */}
                <div className="relative z-10 w-12 h-12 bg-emerald-500 rounded-full flex items-center justify-center text-white font-bold shadow-lg">
                  Y{idx + 1}
                </div>
                
                {/* Content */}
                <div className="flex-1 bg-slate-50 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{CROP_EMOJIS[year.crop] || '🌱'}</span>
                      <div>
                        <p className="font-bold text-slate-800">{year.crop}</p>
                        <span className={cn("text-xs px-2 py-0.5 rounded-full border", SEASON_COLORS[year.season])}>
                          {year.season}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-emerald-600">{formatCurrency(year.profit)}</p>
                      <p className="text-xs text-slate-400">profit/ha</p>
                    </div>
                  </div>
                  
                  <div className="flex gap-4 text-xs text-slate-500">
                    <span>Revenue: {formatCurrency(year.revenue)}</span>
                    <span>Costs: {formatCurrency(year.costs)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Total Profit */}
        <div className="mt-6 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-xl p-4 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-emerald-100">Total 3-Year Profit</p>
              <p className="text-3xl font-bold">{formatCurrency(plan.total_profit_3yr)}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-emerald-100">Annual Average</p>
              <p className="text-xl font-bold">{formatCurrency(plan.avg_annual_profit)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Soil Health Impact */}
      <div className="bg-white rounded-2xl border p-5">
        <h4 className="font-semibold text-foreground mb-4 flex items-center gap-2">
          <Sprout className="h-4 w-4 text-slate-500" />
          Soil Health Impact
        </h4>
        
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="bg-slate-50 rounded-xl p-3 text-center">
            <p className="text-xs text-slate-500 mb-1">Nitrogen</p>
            <p className={cn("text-lg font-bold", plan.soil_impact.nitrogen_kg_ha >= 0 ? 'text-emerald-600' : 'text-rose-600')}>
              {plan.soil_impact.nitrogen_kg_ha > 0 ? '+' : ''}{plan.soil_impact.nitrogen_kg_ha.toFixed(1)}
            </p>
            <p className="text-[10px] text-slate-400">kg/ha</p>
          </div>
          <div className="bg-slate-50 rounded-xl p-3 text-center">
            <p className="text-xs text-slate-500 mb-1">Phosphorus</p>
            <p className={cn("text-lg font-bold", plan.soil_impact.phosphorus_kg_ha >= 0 ? 'text-emerald-600' : 'text-rose-600')}>
              {plan.soil_impact.phosphorus_kg_ha > 0 ? '+' : ''}{plan.soil_impact.phosphorus_kg_ha.toFixed(1)}
            </p>
            <p className="text-[10px] text-slate-400">kg/ha</p>
          </div>
          <div className="bg-slate-50 rounded-xl p-3 text-center">
            <p className="text-xs text-slate-500 mb-1">Potassium</p>
            <p className={cn("text-lg font-bold", plan.soil_impact.potassium_kg_ha >= 0 ? 'text-emerald-600' : 'text-rose-600')}>
              {plan.soil_impact.potassium_kg_ha > 0 ? '+' : ''}{plan.soil_impact.potassium_kg_ha.toFixed(1)}
            </p>
            <p className="text-[10px] text-slate-400">kg/ha</p>
          </div>
        </div>

        <div className="flex items-center justify-between bg-slate-50 rounded-xl p-4">
          <div className="flex items-center gap-2">
            <Scale className="h-5 w-5 text-slate-500" />
            <span className="text-sm text-slate-600">Soil Health Score</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="h-2 w-32 bg-slate-200 rounded-full overflow-hidden">
              <div 
                className={cn(
                  "h-full rounded-full",
                  plan.soil_impact.soil_health_score >= 70 ? 'bg-emerald-500' : 
                  plan.soil_impact.soil_health_score >= 50 ? 'bg-amber-500' : 'bg-rose-500'
                )}
                style={{ width: `${plan.soil_impact.soil_health_score}%` }}
              />
            </div>
            <span className={cn(
              "font-bold",
              plan.soil_impact.soil_health_score >= 70 ? 'text-emerald-600' : 
              plan.soil_impact.soil_health_score >= 50 ? 'text-amber-600' : 'text-rose-600'
            )}>
              {plan.soil_impact.soil_health_score.toFixed(0)}/100
            </span>
          </div>
        </div>

        <div className="mt-4 flex items-center gap-2">
          <span className={cn(
            "px-3 py-1 rounded-full text-xs font-medium",
            plan.soil_impact.impact_rating === 'Improves' ? 'bg-emerald-100 text-emerald-700' :
            plan.soil_impact.impact_rating === 'Maintains' ? 'bg-blue-100 text-blue-700' :
            'bg-amber-100 text-amber-700'
          )}>
            {plan.soil_impact.impact_rating} Soil Health
          </span>
        </div>
      </div>

      {/* Benefits */}
      <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl p-5 border border-emerald-200">
        <h4 className="font-semibold text-emerald-900 mb-4 flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4" />
          Benefits of This Rotation
        </h4>
        
        <div className="space-y-2">
          {plan.benefits.map((benefit, idx) => (
            <div key={idx} className="flex items-start gap-3">
              <div className="w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-white text-xs">✓</span>
              </div>
              <p className="text-sm text-emerald-800">{benefit}</p>
            </div>
          ))}
        </div>

        {plan.water_diversity.length > 1 && (
          <div className="mt-4 pt-4 border-t border-emerald-200">
            <p className="text-sm text-emerald-700 flex items-center gap-2">
              <Droplets className="h-4 w-4" />
              Water Requirements: {plan.water_diversity.join(', ')}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
