import { useState, useEffect } from 'react';
import { formatIndianNumber } from '../lib/utils';
import { TrendingUp, TrendingDown, Minus, AlertCircle, Calendar, DollarSign, Activity } from 'lucide-react';

// Mapping from crop keys to mandi commodity names used in price data
const CROP_TO_MANDI_COMMODITY: Record<string, string> = {
  // Cereals
  rice: 'Paddy(Common)',
  wheat: 'Wheat',
  maize: 'Maize',
  
  // Pulses
  chickpea: 'Bengal Gram(Gram)(Whole)',
  kidneybeans: 'Beans',
  pigeonpeas: 'Arhar(Tur/Red Gram)(Whole)',
  mothbeans: 'Moth Beans',
  mungbean: 'Green Gram (Moong)(Whole)',
  blackgram: 'Black Gram (Urd Beans)(Whole)',
  lentil: 'Lentil (Masur)(Whole)',
  
  // Fruits
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
  
  // Cash Crops
  cotton: 'Cotton',
  jute: 'Jute',
  
  // Plantation
  coffee: 'Coffee',
  tea: 'Tea',
  
  // Oilseeds
  mustard: 'Mustard',
  
  // Vegetables
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

  // Map crop key to mandi commodity name
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

  const getRecommendationColor = (recommendation: string) => {
    switch (recommendation) {
      case 'SELL_NOW':
      case 'SELL_SOON':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'WAIT':
      case 'HOLD':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-amber-100 text-amber-800 border-amber-200';
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'UP':
        return <TrendingUp className="h-5 w-5 text-green-600" />;
      case 'DOWN':
        return <TrendingDown className="h-5 w-5 text-red-600" />;
      default:
        return <Minus className="h-5 w-5 text-amber-600" />;
    }
  };

  if (loading) {
    return (
      <div className="rounded-xl border bg-card p-6 animate-pulse">
        <div className="h-4 bg-muted rounded w-1/3 mb-4"></div>
        <div className="h-8 bg-muted rounded w-1/2 mb-2"></div>
        <div className="h-4 bg-muted rounded w-2/3"></div>
      </div>
    );
  }

  if (error || !prediction) {
    return (
      <div className="rounded-xl border bg-gradient-to-br from-amber-50 to-orange-50 p-6">
        <div className="flex items-center gap-2 text-amber-800">
          <AlertCircle className="h-5 w-5" />
          <p className="font-medium">Price forecast coming soon!</p>
        </div>
        <p className="text-sm text-amber-700 mt-2">
          We're currently expanding our mandi price database to include more crops. 
          Price predictions for {commodity} will be available shortly.
        </p>
        <div className="mt-4 p-3 bg-white rounded-lg border text-sm text-gray-600">
          <p className="font-medium text-gray-800 mb-1">What this feature will offer:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>7-30 day price forecasts</li>
            <li>"Sell now" or "Wait" recommendations</li>
            <li>Price confidence intervals</li>
            <li>Historical price trends</li>
          </ul>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Price Prediction Card */}
      <div className="rounded-xl border bg-gradient-to-br from-blue-50 to-indigo-50 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-blue-600" />
            <h4 className="font-bold text-blue-900">Mandi Price Prediction</h4>
          </div>
          <select
            value={daysAhead}
            onChange={(e) => setDaysAhead(Number(e.target.value))}
            className="text-sm border rounded px-2 py-1 bg-white"
          >
            <option value={3}>3 days</option>
            <option value={7}>7 days</option>
            <option value={14}>14 days</option>
            <option value={30}>30 days</option>
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="bg-white rounded-lg p-4 border">
            <p className="text-xs text-gray-600 uppercase font-medium">Current Price</p>
            <p className="text-2xl font-bold text-gray-900">₹{formatIndianNumber(prediction.current_price)}</p>
            <p className="text-xs text-gray-500">per quintal</p>
          </div>
          <div className="bg-white rounded-lg p-4 border">
            <p className="text-xs text-gray-600 uppercase font-medium">Predicted ({daysAhead} days)</p>
            <p className={`text-2xl font-bold ${prediction.predicted_price > prediction.current_price ? 'text-green-700' : 'text-red-700'}`}>
              ₹{formatIndianNumber(prediction.predicted_price)}
            </p>
            <p className={`text-xs font-medium ${prediction.price_change_pct > 0 ? 'text-green-600' : 'text-red-600'}`}>
              {prediction.price_change_pct > 0 ? '+' : ''}{prediction.price_change_pct}% expected
            </p>
          </div>
        </div>

        {/* Confidence Interval */}
        <div className="bg-white rounded-lg p-4 border mb-4">
          <p className="text-xs text-gray-600 uppercase font-medium mb-2">Price Range (95% Confidence)</p>
          <div className="relative h-2 bg-gray-200 rounded-full">
            <div 
              className="absolute h-full bg-blue-500 rounded-full"
              style={{
                left: `${((prediction.confidence_interval.lower - prediction.confidence_interval.lower) / (prediction.confidence_interval.upper - prediction.confidence_interval.lower)) * 100}%`,
                width: '100%'
              }}
            />
            <div 
              className="absolute w-3 h-3 bg-blue-700 rounded-full -mt-0.5 transform -translate-x-1/2"
              style={{
                left: `${((prediction.current_price - prediction.confidence_interval.lower) / (prediction.confidence_interval.upper - prediction.confidence_interval.lower)) * 100}%`
              }}
            />
          </div>
          <div className="flex justify-between text-xs text-gray-600 mt-1">
            <span>₹{formatIndianNumber(prediction.confidence_interval.lower)}</span>
            <span className="font-medium">Current: ₹{formatIndianNumber(prediction.current_price)}</span>
            <span>₹{formatIndianNumber(prediction.confidence_interval.upper)}</span>
          </div>
        </div>

        {/* Recommendation */}
        <div className={`rounded-lg p-4 border-2 ${getRecommendationColor(prediction.recommendation)}`}>
          <div className="flex items-start gap-3">
            {getTrendIcon(prediction.price_trend)}
            <div>
              <p className="font-bold text-lg">
                {prediction.recommendation === 'SELL_NOW' ? 'Sell Immediately' :
                 prediction.recommendation === 'SELL_SOON' ? 'Sell Soon' :
                 prediction.recommendation === 'WAIT' ? 'Wait for Better Price' :
                 prediction.recommendation === 'HOLD' ? 'Hold & Monitor' : 'Neutral'}
              </p>
              <p className="text-sm mt-1 opacity-90">{prediction.recommendation_reason}</p>
              <div className="flex items-center gap-4 mt-3 text-xs">
                <span className="flex items-center gap-1">
                  <Activity className="h-3 w-3" />
                  Confidence: {prediction.confidence_score}
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  Prediction for: {new Date(prediction.prediction_date).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Market Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-lg border bg-white p-4 text-center">
          <p className="text-xs text-gray-600 uppercase font-medium">Trend</p>
          <div className="flex items-center justify-center gap-1 mt-1">
            {getTrendIcon(prediction.price_trend)}
            <span className="font-bold">{prediction.price_trend}</span>
          </div>
        </div>
        <div className="rounded-lg border bg-white p-4 text-center">
          <p className="text-xs text-gray-600 uppercase font-medium">Volatility</p>
          <p className={`font-bold mt-1 ${prediction.volatility_level === 'HIGH' ? 'text-red-600' : prediction.volatility_level === 'MEDIUM' ? 'text-amber-600' : 'text-green-600'}`}>
            {prediction.volatility_level}
          </p>
        </div>
        <div className="rounded-lg border bg-white p-4 text-center">
          <p className="text-xs text-gray-600 uppercase font-medium">Data Quality</p>
          <p className="font-bold text-blue-600 mt-1">{prediction.confidence_score}</p>
        </div>
      </div>

      {/* Price History Chart (Simple) */}
      {history.length > 0 && (
        <div className="rounded-xl border bg-white p-6">
          <h5 className="font-bold text-gray-900 mb-4">Recent Price History</h5>
          <div className="space-y-2">
            {history.slice(-7).map((point, idx) => (
              <div key={idx} className="flex items-center justify-between text-sm py-2 border-b last:border-0">
                <span className="text-gray-600">{new Date(point.date).toLocaleDateString()}</span>
                <div className="flex items-center gap-4">
                  <span className="text-xs text-gray-500">
                    ₹{formatIndianNumber(point.min_price)} - ₹{formatIndianNumber(point.max_price)}
                  </span>
                  <span className="font-bold text-gray-900">
                    ₹{formatIndianNumber(point.modal_price)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
