import type { CropResult } from '@/types';
import { cn } from '@/lib/utils';
import { 
  Sparkles, 
  MapPin, 
  Droplets, 
  Sprout,
  TrendingUp,
  Shield,
  AlertCircle,
  CheckCircle2,
  Info
} from 'lucide-react';

interface AIExplanationProps {
  crop: CropResult;
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

interface ReasonCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  type: 'positive' | 'neutral' | 'warning';
}

function ReasonCard({ icon, title, description, type }: ReasonCardProps) {
  const styles = {
    positive: 'bg-emerald-50 border-emerald-200 text-emerald-800',
    neutral: 'bg-blue-50 border-blue-200 text-blue-800',
    warning: 'bg-amber-50 border-amber-200 text-amber-800',
  };

  return (
    <div className={cn("p-4 rounded-xl border", styles[type])}>
      <div className="flex items-start gap-3">
        <div className="p-2 bg-white rounded-lg shadow-sm">
          {icon}
        </div>
        <div>
          <h4 className="font-semibold text-sm">{title}</h4>
          <p className="text-xs mt-1 opacity-90">{description}</p>
        </div>
      </div>
    </div>
  );
}

export function AIExplanation({ crop, formData }: AIExplanationProps) {
  // Generate AI-like reasoning based on crop and form data
  const generateReasons = (): ReasonCardProps[] => {
    const reasons: ReasonCardProps[] = [];

    // Suitability reason
    if (crop.suitability === 'traditional') {
      reasons.push({
        icon: <MapPin className="h-4 w-4 text-emerald-600" />,
        title: 'Perfect Regional Match',
        description: `${crop.crop} is traditionally grown in ${formData.state}, meaning ideal climate, established markets, and local expertise support your success.`,
        type: 'positive'
      });
    } else if (crop.suitability === 'common') {
      reasons.push({
        icon: <MapPin className="h-4 w-4 text-blue-600" />,
        title: 'Good Regional Fit',
        description: `${crop.crop} is commonly cultivated in ${formData.state} with proven success records and available market access.`,
        type: 'neutral'
      });
    } else {
      reasons.push({
        icon: <AlertCircle className="h-4 w-4 text-amber-600" />,
        title: 'Emerging Opportunity',
        description: `${crop.crop} is not traditionally grown in ${formData.state}, but your specific conditions make it viable. Consider market risks.`,
        type: 'warning'
      });
    }

    // Season match
    const seasonMatch = formData.season === 'Kharif' 
      ? 'monsoon-fed crops' 
      : formData.season === 'Rabi' 
      ? 'winter crops' 
      : 'year-round cultivation';
    
    reasons.push({
      icon: <Sprout className="h-4 w-4 text-emerald-600" />,
      title: 'Seasonal Alignment',
      description: `Your ${formData.season} season selection aligns with ${seasonMatch}, optimizing natural rainfall and temperature patterns.`,
      type: 'positive'
    });

    // Rainfall analysis
    if (formData.annual_rainfall > 1000) {
      reasons.push({
        icon: <Droplets className="h-4 w-4 text-blue-600" />,
        title: 'Water Abundance',
        description: `With ${formData.annual_rainfall}mm rainfall, you have excellent water availability. ${crop.crop} will thrive with minimal irrigation investment.`,
        type: 'positive'
      });
    } else if (formData.annual_rainfall < 500) {
      reasons.push({
        icon: <Droplets className="h-4 w-4 text-amber-600" />,
        title: 'Water Management Needed',
        description: `At ${formData.annual_rainfall}mm rainfall, consider drip irrigation or drought-resistant varieties for optimal ${crop.crop} yield.`,
        type: 'warning'
      });
    }

    // Soil pH analysis
    if (formData.ph) {
      const ph = formData.ph;
      const cropName = crop.crop.toLowerCase();
      const idealPhRanges: Record<string, [number, number]> = {
        rice: [5.0, 7.5],
        wheat: [6.0, 7.5],
        maize: [5.5, 7.5],
        cotton: [5.5, 8.5],
        sugarcane: [6.0, 7.5],
        potato: [5.0, 6.5],
        tomato: [6.0, 7.5],
        banana: [5.5, 7.5],
      };
      
      const range = idealPhRanges[cropName] || [6.0, 7.5];
      if (ph >= range[0] && ph <= range[1]) {
        reasons.push({
          icon: <CheckCircle2 className="h-4 w-4 text-emerald-600" />,
          title: 'Ideal Soil pH',
          description: `Your soil pH of ${ph} is perfect for ${crop.crop} (ideal: ${range[0]}-${range[1]}), ensuring optimal nutrient uptake.`,
          type: 'positive'
        });
      } else {
        const adjustment = ph < range[0] ? 'lime addition' : 'sulfur or organic matter';
        reasons.push({
          icon: <Info className="h-4 w-4 text-amber-600" />,
          title: 'Soil pH Adjustment Recommended',
          description: `Your pH ${ph} is slightly ${ph < range[0] ? 'acidic' : 'alkaline'} for ${crop.crop}. Consider ${adjustment} for better results.`,
          type: 'warning'
        });
      }
    }

    // Revenue potential
    if (crop.expected_revenue > 100000) {
      reasons.push({
        icon: <TrendingUp className="h-4 w-4 text-emerald-600" />,
        title: 'High Revenue Potential',
        description: `Expected revenue of ₹${(crop.expected_revenue/1000).toFixed(0)}K places this crop in the high-earning category for your area.`,
        type: 'positive'
      });
    }

    // Risk assessment
    if (crop.suitability === 'rare') {
      reasons.push({
        icon: <Shield className="h-4 w-4 text-amber-600" />,
        title: 'Risk Considerations',
        description: `As a non-traditional crop in your region, ensure you have buyers lined up and consider starting with a smaller test plot.`,
        type: 'warning'
      });
    }

    return reasons;
  };

  const reasons = generateReasons();
  const confidenceScore = crop.suitability === 'traditional' ? 95 : crop.suitability === 'common' ? 80 : 65;

  return (
    <div className="space-y-6">
      {/* Header with AI Badge */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-violet-100 to-purple-100 rounded-lg">
            <Sparkles className="h-5 w-5 text-violet-600" />
          </div>
          <div>
            <h3 className="font-bold text-foreground">AI Analysis</h3>
            <p className="text-xs text-muted-foreground">Why this crop matches your farm</p>
          </div>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-violet-50 rounded-full border border-violet-200">
          <span className="text-xs font-medium text-violet-700">Match Score</span>
          <span className="text-sm font-bold text-violet-800">{confidenceScore}%</span>
        </div>
      </div>

      {/* Match Score Bar */}
      <div className="bg-slate-50 rounded-xl p-4 border">
        <div className="flex justify-between text-sm mb-2">
          <span className="text-slate-600">Suitability for your conditions</span>
          <span className={cn(
            "font-bold",
            confidenceScore >= 90 ? "text-emerald-600" : confidenceScore >= 70 ? "text-blue-600" : "text-amber-600"
          )}>
            {confidenceScore >= 90 ? 'Excellent' : confidenceScore >= 70 ? 'Good' : 'Moderate'}
          </span>
        </div>
        <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
          <div 
            className={cn(
              "h-full rounded-full transition-all duration-1000",
              confidenceScore >= 90 ? "bg-emerald-500" : confidenceScore >= 70 ? "bg-blue-500" : "bg-amber-500"
            )}
            style={{ width: `${confidenceScore}%` }}
          />
        </div>
      </div>

      {/* Reason Cards */}
      <div className="grid gap-3">
        {reasons.map((reason, idx) => (
          <ReasonCard key={idx} {...reason} />
        ))}
      </div>

      {/* Summary Box */}
      <div className="bg-gradient-to-r from-slate-800 to-slate-900 rounded-xl p-5 text-white">
        <div className="flex items-start gap-3">
          <Sparkles className="h-5 w-5 text-amber-400 mt-0.5" />
          <div>
            <h4 className="font-semibold text-sm mb-1">AI Summary</h4>
            <p className="text-sm text-slate-300 leading-relaxed">
              Based on your inputs from {formData.state} with {formData.annual_rainfall}mm rainfall during {formData.season} season,{' '}
              <span className="text-white font-medium capitalize">{crop.crop}</span> shows{' '}
              {crop.suitability === 'traditional' ? 'strong potential as a traditional crop with established market support.' : 
               crop.suitability === 'common' ? 'good viability with proven cultivation practices in your region.' : 
               'moderate potential - consider market research and start with pilot cultivation.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
