import { useState } from 'react';
import type { CropResult } from '@/types';
import { cn } from '@/lib/utils';
import { 
  Radar, 
  RadarChart, 
  PolarGrid, 
  PolarAngleAxis, 
  PolarRadiusAxis, 
  ResponsiveContainer,
  Legend
} from 'recharts';
import { 
  Scale, 
  TrendingUp, 
  Wallet, 
  AlertTriangle,
  CheckCircle2,
  BarChart3
} from 'lucide-react';

interface CropComparisonProps {
  crops: CropResult[];
  formData: {
    state: string;
    season: string;
    annual_rainfall: number;
    area: number;
  };
}

interface ComparisonMetric {
  label: string;
  key: keyof CropResult | 'water_efficiency' | 'profit_per_rupee' | 'risk_score';
  icon: React.ReactNode;
  format: (value: number) => string;
  higherIsBetter: boolean;
}

const METRICS: ComparisonMetric[] = [
  { 
    label: 'Revenue', 
    key: 'expected_revenue', 
    icon: <Wallet className="h-4 w-4" />,
    format: (v) => `₹${(v/1000).toFixed(0)}K`,
    higherIsBetter: true 
  },
  { 
    label: 'Yield', 
    key: 'predicted_yield', 
    icon: <Scale className="h-4 w-4" />,
    format: (v) => `${v.toFixed(1)} t/ha`,
    higherIsBetter: true 
  },
  { 
    label: 'Market Price', 
    key: 'avg_price', 
    icon: <TrendingUp className="h-4 w-4" />,
    format: (v) => `₹${v.toFixed(0)}/q`,
    higherIsBetter: true 
  },
];

export function CropComparison({ crops, formData }: CropComparisonProps) {
  const [selectedCrops, setSelectedCrops] = useState<string[]>([crops[0]?.crop, crops[1]?.crop].filter(Boolean));
  const [showRadar, setShowRadar] = useState(true);

  const toggleCrop = (cropName: string) => {
    setSelectedCrops(prev => {
      if (prev.includes(cropName)) {
        return prev.filter(c => c !== cropName);
      }
      if (prev.length >= 3) {
        return [...prev.slice(1), cropName];
      }
      return [...prev, cropName];
    });
  };

  const comparedCrops = crops.filter(c => selectedCrops.includes(c.crop));

  // Prepare radar chart data
  const radarData: Record<string, number | string>[] = [
    { metric: 'Revenue', fullMark: 100 },
    { metric: 'Yield', fullMark: 100 },
    { metric: 'Price', fullMark: 100 },
    { metric: 'Suitability', fullMark: 100 },
  ];

  // Normalize values for radar chart (0-100 scale)
  const maxRevenue = Math.max(...crops.map(c => c.expected_revenue));
  const maxYield = Math.max(...crops.map(c => c.predicted_yield));
  const maxPrice = Math.max(...crops.map(c => c.avg_price));

  comparedCrops.forEach(crop => {
    radarData[0][crop.crop] = (crop.expected_revenue / maxRevenue) * 100;
    radarData[1][crop.crop] = (crop.predicted_yield / maxYield) * 100;
    radarData[2][crop.crop] = (crop.avg_price / maxPrice) * 100;
    radarData[3][crop.crop] = crop.suitability === 'traditional' ? 100 : crop.suitability === 'common' ? 70 : 40;
  });

  const getSuitabilityColor = (suitability: string) => {
    switch (suitability) {
      case 'traditional': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'common': return 'bg-blue-100 text-blue-700 border-blue-200';
      default: return 'bg-amber-100 text-amber-700 border-amber-200';
    }
  };

  const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-100 rounded-lg">
            <BarChart3 className="h-5 w-5 text-indigo-600" />
          </div>
          <div>
            <h3 className="font-bold text-foreground">Crop Comparison</h3>
            <p className="text-xs text-muted-foreground">Compare up to 3 crops side-by-side</p>
          </div>
        </div>
        <button
          onClick={() => setShowRadar(!showRadar)}
          className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
        >
          {showRadar ? 'Hide Chart' : 'Show Chart'}
        </button>
      </div>

      {/* Crop Selector */}
      <div className="flex flex-wrap gap-2">
        {crops.slice(0, 6).map((crop) => {
          const isSelected = selectedCrops.includes(crop.crop);
          return (
            <button
              key={crop.crop}
              onClick={() => toggleCrop(crop.crop)}
              className={cn(
                "px-4 py-2 rounded-full text-sm font-medium transition-all border",
                isSelected
                  ? "bg-indigo-100 border-indigo-300 text-indigo-700"
                  : "bg-white border-slate-200 text-slate-600 hover:border-indigo-200"
              )}
            >
              <span className="capitalize">{crop.crop}</span>
              {isSelected && <span className="ml-2 text-xs">✓</span>}
            </button>
          );
        })}
      </div>

      {comparedCrops.length < 2 ? (
        <div className="text-center py-8 bg-slate-50 rounded-2xl border border-dashed">
          <p className="text-slate-500">Select at least 2 crops to compare</p>
        </div>
      ) : (
        <>
          {/* Radar Chart */}
          {showRadar && (
            <div className="bg-white rounded-2xl p-6 border">
              <h4 className="text-sm font-semibold text-slate-700 mb-4">Multi-Dimensional Comparison</h4>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart 
                    data={radarData} 
                    margin={{ top: 20, right: 40, bottom: 40, left: 40 }}
                  >
                    <PolarGrid stroke="#e2e8f0" />
                    <PolarAngleAxis 
                      dataKey="metric" 
                      tick={{ fill: '#64748b', fontSize: 11, fontWeight: 500 }}
                      dy={5}
                    />
                    <PolarRadiusAxis 
                      angle={45} 
                      domain={[0, 100]} 
                      tick={false}
                      axisLine={false}
                    />
                    {comparedCrops.map((crop, idx) => (
                      <Radar
                        key={crop.crop}
                        name={crop.crop}
                        dataKey={crop.crop}
                        stroke={COLORS[idx % COLORS.length]}
                        fill={COLORS[idx % COLORS.length]}
                        fillOpacity={0.15}
                        strokeWidth={2.5}
                      />
                    ))}
                    <Legend 
                      verticalAlign="bottom" 
                      align="center"
                      height={40}
                      iconType="circle"
                      wrapperStyle={{ paddingTop: '20px' }}
                      formatter={(value) => <span className="capitalize text-sm font-medium ml-1">{value}</span>}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Comparison Table */}
          <div className="bg-white rounded-2xl border overflow-hidden">
            <div className="grid grid-cols-[140px_repeat(auto-fit,minmax(120px,1fr))] bg-slate-50 border-b">
              <div className="p-4 font-semibold text-sm text-slate-700">Metric</div>
              {comparedCrops.map(crop => (
                <div key={crop.crop} className="p-4 text-center">
                  <span className="font-bold text-foreground capitalize">{crop.crop}</span>
                  <span className={cn(
                    "ml-2 px-2 py-0.5 rounded-full text-[10px] font-medium border",
                    getSuitabilityColor(crop.suitability)
                  )}>
                    {crop.suitability}
                  </span>
                </div>
              ))}
            </div>

            {METRICS.map((metric) => (
              <div 
                key={metric.key as string} 
                className="grid grid-cols-[140px_repeat(auto-fit,minmax(120px,1fr))] border-b last:border-b-0 hover:bg-slate-50/50"
              >
                <div className="p-4 flex items-center gap-2 text-sm text-slate-600">
                  {metric.icon}
                  {metric.label}
                </div>
                {comparedCrops.map(crop => {
                  const value = crop[metric.key as keyof CropResult] as number;
                  const isBest = metric.higherIsBetter 
                    ? value === Math.max(...comparedCrops.map(c => c[metric.key as keyof CropResult] as number))
                    : value === Math.min(...comparedCrops.map(c => c[metric.key as keyof CropResult] as number));
                  
                  return (
                    <div key={crop.crop} className="p-4 text-center">
                      <span className={cn(
                        "font-semibold",
                        isBest ? "text-emerald-600" : "text-slate-700"
                      )}>
                        {metric.format(value)}
                      </span>
                      {isBest && <span className="ml-1 text-emerald-500">★</span>}
                    </div>
                  );
                })}
              </div>
            ))}

            {/* Risk Row */}
            <div className="grid grid-cols-[140px_repeat(auto-fit,minmax(120px,1fr))] bg-slate-50/50">
              <div className="p-4 flex items-center gap-2 text-sm text-slate-600">
                <AlertTriangle className="h-4 w-4" />
                Risk Level
              </div>
              {comparedCrops.map(crop => (
                <div key={crop.crop} className="p-4 text-center">
                  <span className={cn(
                    "px-3 py-1 rounded-full text-xs font-medium",
                    crop.suitability === 'traditional' 
                      ? 'bg-emerald-100 text-emerald-700' 
                      : crop.suitability === 'common'
                      ? 'bg-amber-100 text-amber-700'
                      : 'bg-rose-100 text-rose-700'
                  )}>
                    {crop.suitability === 'traditional' ? 'Low' : crop.suitability === 'common' ? 'Medium' : 'High'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Winner Banner */}
          {comparedCrops.length >= 2 && (
            <div className="bg-gradient-to-r from-emerald-500 to-green-600 rounded-2xl p-5 text-white">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-6 w-6" />
                <div>
                  <p className="font-semibold">Best Choice for You</p>
                  <p className="text-sm text-emerald-100">
                    Based on your conditions in {formData.state},{' '}
                    <span className="font-bold capitalize">
                      {comparedCrops.reduce((best, crop) => 
                        crop.expected_revenue > best.expected_revenue ? crop : best
                      ).crop}
                    </span>
                    {' '}offers the highest revenue potential
                  </p>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
