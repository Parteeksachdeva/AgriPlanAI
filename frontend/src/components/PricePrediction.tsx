import { useState, useEffect } from 'react';
import { formatIndianNumber } from '../lib/utils';
import { TrendingUp, TrendingDown, Minus, AlertCircle, Calendar, DollarSign, Activity, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

// Mapping from crop keys to mandi commodity names used in price data
const CROP_TO_MANDI_COMMODITY: Record<string, string> = {
  rice: 'Paddy(Common)',
  wheat: 'Wheat',
  maize: 'Maize',
  chickpea: 'Bengal Gram(Gram)(Whole)',
  kidneybeans: 'Beans',
  pigeonpeas: 'Arhar(Tur/Red Gram)(Whole)',
  mothbeans: 'Moth Beans',
  mungbean: 'Green Gram (Moong)(Whole)',
  blackgram: 'Black Gram (Urd Beans)(Whole)',
  lentil: 'Lentil (Masur)(Whole)',
  pomegranate: 'Pomegranate',
  banana: 'Banana',
  mango: 'Mango',
  grapes: 'Grapes',
  watermelon: 'Water Melon',
  muskmelon: 'Musk Melon',
  apple: 'Apple',
  orange: 'Orange',
  papaya: 'Papaya',
  coconut: 'Coconut',
  cotton: 'Cotton',
  jute: 'Jute',
  coffee: 'Coffee',
  tea: 'Tea',
  mustard: 'Mustard',
  tomato: 'Tomato',
  onion: 'Onion',
  potato: 'Potato',
  brinjal: 'Brinjal',
  'green chilli': 'Green Chilli',
  carrot: 'Carrot',
  cabbage: 'Cabbage',
  cauliflower: 'Cauliflower',
  'bottle gourd': 'Bottle gourd',
  'bitter gourd': 'Bitter gourd',
  pumpkin: 'Pumpkin',
  bhindi: 'Bhindi(Ladies Finger)',
  garlic: 'Garlic',
  ginger: 'Ginger(Green)',
  coriander: 'Coriander(Leaves)',
  drumstick: 'Drumstick',
  'sweet potato': 'Sweet Potato',
  tapioca: 'Tapioca',
};

interface PricePredictionProps {
  commodity: string;
  state: string;
}

interface PredictionData {
  commodity: string;
  state: string;
  current_price: number;
  predicted_price: number;
  price_change_pct: number;
  confidence_interval: {
    lower: number;
    upper: number;
  };
  prediction_date: string;
  days_ahead: number;
  recommendation: string;
  recommendation_reason: string;
  confidence_score: string;
  price_trend: string;
  volatility_level: string;
}

interface PriceHistoryPoint {
  date: string;
  modal_price: number;
  min_price: number;
  max_price: number;
  market: string;
}

export function PricePrediction({ commodity, state }: PricePredictionProps) {
  const [prediction, setPrediction] = useState<PredictionData | null>(null);
  const [history, setHistory] = useState<PriceHistoryPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [daysAhead, setDaysAhead] = useState(7);

  const mandiCommodity = CROP_TO_MANDI_COMMODITY[commodity.toLowerCase()] || commodity;

  useEffect(() => {
    fetchPrediction();
    fetchHistory();
  }, [commodity, state, daysAhead]);

  const fetchPrediction = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:8000/api/price-prediction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ commodity: mandiCommodity, state, days_ahead: daysAhead })
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch prediction');
      }
      
      const data = await response.json();
      setPrediction(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load prediction');
    } finally {
      setLoading(false);
    }
  };

  const fetchHistory = async () => {
    try {
      const response = await fetch(`http://localhost:8000/api/price-history/${encodeURIComponent(mandiCommodity)}/${encodeURIComponent(state)}?days=30`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch history');
      }
      
      const data = await response.json();
      setHistory(data.history);
    } catch (err) {
      console.error('Failed to load price history:', err);
    }
  };

  const getRecommendationStyle = (recommendation: string) => {
    switch (recommendation) {
      case 'SELL_NOW':
      case 'SELL_SOON':
        return { bg: 'bg-rose-500', light: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200', icon: TrendingDown };
      case 'WAIT':
      case 'HOLD':
        return { bg: 'bg-emerald-500', light: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', icon: TrendingUp };
      default:
        return { bg: 'bg-amber-500', light: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', icon: Minus };
    }
  };

  const getRecommendationLabel = (recommendation: string) => {
    switch (recommendation) {
      case 'SELL_NOW': return 'Sell Immediately';
      case 'SELL_SOON': return 'Sell Soon';
      case 'WAIT': return 'Wait for Better Price';
      case 'HOLD': return 'Hold & Monitor';
      default: return 'Neutral';
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div className="h-32 bg-gray-100 rounded-2xl animate-pulse" />
          <div className="h-32 bg-gray-100 rounded-2xl animate-pulse" />
        </div>
        <div className="h-48 bg-gray-100 rounded-2xl animate-pulse" />
      </div>
    );
  }

  if (error || !prediction) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <AlertCircle className="h-8 w-8 text-amber-500" />
        </div>
        <h3 className="text-lg font-semibold text-foreground mb-2">Price data coming soon</h3>
        <p className="text-muted-foreground text-sm max-w-sm mx-auto">
          We're expanding our mandi price database. Predictions for {commodity} will be available shortly.
        </p>
      </div>
    );
  }

  const style = getRecommendationStyle(prediction.recommendation);
  const TrendIcon = style.icon;
  const isPriceUp = prediction.predicted_price > prediction.current_price;

  return (
    <div className="space-y-6">
      {/* Header with Time Selector */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Sparkles className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <h3 className="font-bold text-foreground">AI Price Forecast</h3>
            <p className="text-xs text-muted-foreground">Based on mandi market trends</p>
          </div>
        </div>
        <select
          value={daysAhead}
          onChange={(e) => setDaysAhead(Number(e.target.value))}
          className="text-sm border rounded-lg px-3 py-2 bg-white focus:ring-2 focus:ring-blue-500 outline-none"
        >
          <option value={3}>Next 3 days</option>
          <option value={7}>Next 7 days</option>
          <option value={14}>Next 14 days</option>
          <option value={30}>Next 30 days</option>
        </select>
      </div>

      {/* Price Cards */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-2xl p-5 border">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="h-4 w-4 text-slate-500" />
            <span className="text-xs font-medium text-slate-500 uppercase">Current Price</span>
          </div>
          <p className="text-3xl font-bold text-slate-900">₹{formatIndianNumber(prediction.current_price)}</p>
          <p className="text-xs text-slate-500 mt-1">per quintal</p>
        </div>

        <div className={cn(
          "rounded-2xl p-5 border",
          isPriceUp ? "bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200" : "bg-gradient-to-br from-rose-50 to-rose-100 border-rose-200"
        )}>
          <div className="flex items-center gap-2 mb-2">
            <Calendar className={cn("h-4 w-4", isPriceUp ? "text-emerald-600" : "text-rose-600")} />
            <span className={cn("text-xs font-medium uppercase", isPriceUp ? "text-emerald-600" : "text-rose-600")}>
              Predicted ({daysAhead}d)
            </span>
          </div>
          <p className={cn("text-3xl font-bold", isPriceUp ? "text-emerald-700" : "text-rose-700")}>
            ₹{formatIndianNumber(prediction.predicted_price)}
          </p>
          <div className="flex items-center gap-1 mt-1">
            {isPriceUp ? (
              <TrendingUp className="h-3 w-3 text-emerald-600" />
            ) : (
              <TrendingDown className="h-3 w-3 text-rose-600" />
            )}
            <span className={cn("text-xs font-medium", isPriceUp ? "text-emerald-600" : "text-rose-600")}>
              {prediction.price_change_pct > 0 ? '+' : ''}{prediction.price_change_pct}%
            </span>
          </div>
        </div>
      </div>

      {/* Recommendation Card */}
      <div className={cn("rounded-2xl p-5 border-2", style.light, style.border)}>
        <div className="flex items-start gap-4">
          <div className={cn("p-3 rounded-xl", style.bg)}>
            <TrendIcon className="h-6 w-6 text-white" />
          </div>
          <div className="flex-1">
            <h4 className={cn("font-bold text-lg", style.text)}>
              {getRecommendationLabel(prediction.recommendation)}
            </h4>
            <p className="text-sm text-slate-600 mt-1">{prediction.recommendation_reason}</p>
            
            <div className="flex items-center gap-4 mt-4">
              <div className="flex items-center gap-1.5">
                <Activity className="h-4 w-4 text-slate-400" />
                <span className="text-xs text-slate-500">
                  Confidence: <span className="font-medium text-slate-700">{prediction.confidence_score}</span>
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <Calendar className="h-4 w-4 text-slate-400" />
                <span className="text-xs text-slate-500">
                  For: <span className="font-medium text-slate-700">{new Date(prediction.prediction_date).toLocaleDateString()}</span>
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white rounded-xl p-4 border text-center">
          <p className="text-xs text-slate-500 uppercase mb-1">Trend</p>
          <div className="flex items-center justify-center gap-1">
            {prediction.price_trend === 'UP' ? (
              <TrendingUp className="h-4 w-4 text-emerald-500" />
            ) : prediction.price_trend === 'DOWN' ? (
              <TrendingDown className="h-4 w-4 text-rose-500" />
            ) : (
              <Minus className="h-4 w-4 text-amber-500" />
            )}
            <span className="font-bold text-sm">{prediction.price_trend}</span>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 border text-center">
          <p className="text-xs text-slate-500 uppercase mb-1">Volatility</p>
          <span className={cn(
            "font-bold text-sm",
            prediction.volatility_level === 'HIGH' ? 'text-rose-600' : 
            prediction.volatility_level === 'MEDIUM' ? 'text-amber-600' : 'text-emerald-600'
          )}>
            {prediction.volatility_level}
          </span>
        </div>
        <div className="bg-white rounded-xl p-4 border text-center">
          <p className="text-xs text-slate-500 uppercase mb-1">Range</p>
          <span className="font-bold text-sm text-slate-700">
            ₹{formatIndianNumber(prediction.confidence_interval.lower)} - ₹{formatIndianNumber(prediction.confidence_interval.upper)}
          </span>
        </div>
      </div>

      {/* Price History */}
      {history.length > 0 && (
        <div className="bg-white rounded-2xl border p-5">
          <h4 className="font-semibold text-foreground mb-4">Recent Price History</h4>
          <div className="space-y-2">
            {history.slice(-5).map((point, idx) => (
              <div key={idx} className="flex items-center justify-between py-2 border-b last:border-0">
                <span className="text-sm text-slate-500">{new Date(point.date).toLocaleDateString()}</span>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-slate-400">
                    ₹{formatIndianNumber(point.min_price)} - ₹{formatIndianNumber(point.max_price)}
                  </span>
                  <span className="font-bold text-slate-700">₹{formatIndianNumber(point.modal_price)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
