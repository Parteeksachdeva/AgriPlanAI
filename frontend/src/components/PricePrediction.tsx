import { useState, useEffect } from "react";
import { API_BASE } from "@/api";
import { formatIndianNumber } from "../lib/utils";
import {
  TrendingUp,
  TrendingDown,
  Minus,
  AlertCircle,
  Calendar,
  DollarSign,
  Activity,
  Sparkles,
  Warehouse,
  MapPin,
  Store,
} from "lucide-react";
import { cn } from "@/lib/utils";

// Mapping from crop keys to mandi commodity names used in price data
// Note: Backend expects lowercase commodity names as stored in mandi_prices_enhanced.csv
const CROP_TO_MANDI_COMMODITY: Record<string, string> = {
  rice: "rice",
  wheat: "wheat",
  maize: "maize",
  chickpea: "chickpea",
  kidneybeans: "kidneybeans",
  pigeonpeas: "pigeonpeas",
  mothbeans: "mothbeans",
  mungbean: "mungbean",
  blackgram: "blackgram",
  lentil: "lentil",
  pomegranate: "pomegranate",
  banana: "banana",
  mango: "mango",
  grapes: "grapes",
  watermelon: "watermelon",
  muskmelon: "muskmelon",
  apple: "apple",
  orange: "orange",
  papaya: "papaya",
  coconut: "coconut",
  cotton: "cotton",
  jute: "jute",
  coffee: "coffee",
  tea: "tea",
  mustard: "mustard",
  tomato: "tomato",
  onion: "onion",
  potato: "potato",
  brinjal: "brinjal",
  "green chilli": "green chilli",
  carrot: "carrot",
  cabbage: "cabbage",
  cauliflower: "cauliflower",
  "bottle gourd": "bottle gourd",
  "bitter gourd": "bitter gourd",
  pumpkin: "pumpkin",
  bhindi: "bhindi",
  garlic: "garlic",
  ginger: "ginger",
  coriander: "coriander",
  drumstick: "drumstick",
  "sweet potato": "sweet potato",
  tapioca: "tapioca",
};

interface PricePredictionProps {
  commodity: string;
  state: string;
}

interface StorageAnalysis {
  storage_cost: number;
  potential_gain: number;
  net_gain: number;
  break_even_days: number;
  recommendation: string;
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
  storage_analysis?: StorageAnalysis;
}

interface PriceHistoryPoint {
  date: string;
  modal_price: number;
  min_price: number;
  max_price: number;
  market: string;
}

interface SeasonalTrend {
  best_month: {
    month: string;
    avg_price: number;
  };
  worst_month: {
    month: string;
    avg_price: number;
  };
  price_difference_pct: number;
  current_month_best: boolean;
}

interface MandiPrice {
  market: string;
  latest_price: number;
  avg_price_7d: number;
  date: string;
}

export function PricePrediction({ commodity, state }: PricePredictionProps) {
  const [prediction, setPrediction] = useState<PredictionData | null>(null);
  const [history, setHistory] = useState<PriceHistoryPoint[]>([]);
  const [seasonalTrend, setSeasonalTrend] = useState<SeasonalTrend | null>(
    null,
  );
  const [mandiPrices, setMandiPrices] = useState<MandiPrice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [daysAhead, setDaysAhead] = useState(7);
  const [activeTab, setActiveTab] = useState<
    "forecast" | "seasonal" | "mandis"
  >("forecast");

  const mandiCommodity =
    CROP_TO_MANDI_COMMODITY[commodity.toLowerCase()] || commodity;

  useEffect(() => {
    fetchPrediction();
    fetchHistory();
    fetchSeasonalTrend();
    fetchMandiPrices();
  }, [commodity, state, daysAhead]);

  const fetchPrediction = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE}/api/price-prediction`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          commodity: mandiCommodity,
          state,
          days_ahead: daysAhead,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to fetch prediction");
      }

      const data = await response.json();
      setPrediction(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load prediction",
      );
    } finally {
      setLoading(false);
    }
  };

  const fetchHistory = async () => {
    try {
      const response = await fetch(
        `${API_BASE}/api/price-history/${encodeURIComponent(mandiCommodity)}/${encodeURIComponent(state)}?days=30`,
      );

      if (!response.ok) {
        throw new Error("Failed to fetch history");
      }

      const data = await response.json();
      setHistory(data.history);
    } catch (err) {
      console.error("Failed to load price history:", err);
    }
  };

  const fetchSeasonalTrend = async () => {
    try {
      const response = await fetch(
        `${API_BASE}/api/seasonal-trends/${encodeURIComponent(mandiCommodity)}/${encodeURIComponent(state)}`,
      );
      if (response.ok) {
        const data = await response.json();
        setSeasonalTrend(data);
      } else {
        console.log("Seasonal trends not available for", mandiCommodity);
      }
    } catch (err) {
      console.error("Failed to load seasonal trends:", err);
    }
  };

  const fetchMandiPrices = async () => {
    try {
      const response = await fetch(
        `${API_BASE}/api/nearby-mandi-prices/${encodeURIComponent(mandiCommodity)}/${encodeURIComponent(state)}`,
      );
      if (response.ok) {
        const data = await response.json();
        setMandiPrices(data.mandi_prices || []);
      } else {
        console.log("Mandi prices not available for", mandiCommodity);
        setMandiPrices([]);
      }
    } catch (err) {
      console.error("Failed to load mandi prices:", err);
      setMandiPrices([]);
    }
  };

  const getRecommendationStyle = (recommendation: string) => {
    switch (recommendation) {
      case "SELL_NOW":
      case "SELL_SOON":
      case "SELL_IMMEDIATELY":
        return {
          bg: "bg-rose-500",
          light: "bg-rose-50",
          text: "text-rose-700",
          border: "border-rose-200",
          icon: TrendingDown,
        };
      case "STORE_AND_SELL_LATER":
        return {
          bg: "bg-violet-500",
          light: "bg-violet-50",
          text: "text-violet-700",
          border: "border-violet-200",
          icon: Warehouse,
        };
      case "WAIT":
      case "HOLD":
      case "HOLD_IF_STORAGE_AVAILABLE":
        return {
          bg: "bg-emerald-500",
          light: "bg-emerald-50",
          text: "text-emerald-700",
          border: "border-emerald-200",
          icon: TrendingUp,
        };
      default:
        return {
          bg: "bg-amber-500",
          light: "bg-amber-50",
          text: "text-amber-700",
          border: "border-amber-200",
          icon: Minus,
        };
    }
  };

  const getRecommendationLabel = (recommendation: string) => {
    switch (recommendation) {
      case "SELL_NOW":
      case "SELL_IMMEDIATELY":
        return "Sell Immediately";
      case "SELL_SOON":
        return "Sell Soon";
      case "STORE_AND_SELL_LATER":
        return "Store & Sell Later";
      case "HOLD":
        return "Hold & Monitor";
      case "HOLD_IF_STORAGE_AVAILABLE":
        return "Hold if Storage Available";
      case "WAIT":
        return "Wait for Better Price";
      default:
        return "Neutral";
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
        <h3 className="text-lg font-semibold text-foreground mb-2">
          Price data coming soon
        </h3>
        <p className="text-muted-foreground text-sm max-w-sm mx-auto">
          We're expanding our mandi price database. Predictions for {commodity}{" "}
          will be available shortly.
        </p>
      </div>
    );
  }

  const style = getRecommendationStyle(prediction.recommendation);
  const TrendIcon = style.icon;
  const isPriceUp = prediction.predicted_price > prediction.current_price;
  const storage = prediction.storage_analysis;

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
            <p className="text-xs text-muted-foreground">
              Based on mandi market trends
            </p>
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

      {/* Tab Navigation */}
      <div className="flex gap-2">
        {[
          { id: "forecast", label: "Forecast", icon: TrendingUp },
          { id: "seasonal", label: "Seasonal Trends", icon: Calendar },
          { id: "mandis", label: "Mandi Prices", icon: Store },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as typeof activeTab)}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",
              activeTab === tab.id
                ? "bg-blue-100 text-blue-700"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200",
            )}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "forecast" && (
        <>
          {/* Price Cards */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-2xl p-5 border">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="h-4 w-4 text-slate-500" />
                <span className="text-xs font-medium text-slate-500 uppercase">
                  Current Price
                </span>
              </div>
              <p className="text-3xl font-bold text-slate-900">
                ₹{formatIndianNumber(prediction.current_price)}
              </p>
              <p className="text-xs text-slate-500 mt-1">per quintal</p>
            </div>

            <div
              className={cn(
                "rounded-2xl p-5 border",
                isPriceUp
                  ? "bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200"
                  : "bg-gradient-to-br from-rose-50 to-rose-100 border-rose-200",
              )}
            >
              <div className="flex items-center gap-2 mb-2">
                <Calendar
                  className={cn(
                    "h-4 w-4",
                    isPriceUp ? "text-emerald-600" : "text-rose-600",
                  )}
                />
                <span
                  className={cn(
                    "text-xs font-medium uppercase",
                    isPriceUp ? "text-emerald-600" : "text-rose-600",
                  )}
                >
                  Predicted ({daysAhead}d)
                </span>
              </div>
              <p
                className={cn(
                  "text-3xl font-bold",
                  isPriceUp ? "text-emerald-700" : "text-rose-700",
                )}
              >
                ₹{formatIndianNumber(prediction.predicted_price)}
              </p>
              <div className="flex items-center gap-1 mt-1">
                {isPriceUp ? (
                  <TrendingUp className="h-3 w-3 text-emerald-600" />
                ) : (
                  <TrendingDown className="h-3 w-3 text-rose-600" />
                )}
                <span
                  className={cn(
                    "text-xs font-medium",
                    isPriceUp ? "text-emerald-600" : "text-rose-600",
                  )}
                >
                  {prediction.price_change_pct > 0 ? "+" : ""}
                  {prediction.price_change_pct}%
                </span>
              </div>
            </div>
          </div>

          {/* Recommendation Card */}
          <div
            className={cn(
              "rounded-2xl p-5 border-2",
              style.light,
              style.border,
            )}
          >
            <div className="flex items-start gap-4">
              <div className={cn("p-3 rounded-xl", style.bg)}>
                <TrendIcon className="h-6 w-6 text-white" />
              </div>
              <div className="flex-1">
                <h4 className={cn("font-bold text-lg", style.text)}>
                  {getRecommendationLabel(prediction.recommendation)}
                </h4>
                <p className="text-sm text-slate-600 mt-1">
                  {prediction.recommendation_reason}
                </p>

                <div className="flex items-center gap-4 mt-4">
                  <div className="flex items-center gap-1.5">
                    <Activity className="h-4 w-4 text-slate-400" />
                    <span className="text-xs text-slate-500">
                      Confidence:{" "}
                      <span className="font-medium text-slate-700">
                        {prediction.confidence_score}
                      </span>
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Calendar className="h-4 w-4 text-slate-400" />
                    <span className="text-xs text-slate-500">
                      For:{" "}
                      <span className="font-medium text-slate-700">
                        {new Date(
                          prediction.prediction_date,
                        ).toLocaleDateString()}
                      </span>
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Storage Analysis */}
          {storage && (
            <div className="bg-gradient-to-br from-violet-50 to-purple-50 rounded-2xl p-5 border border-violet-200">
              <div className="flex items-center gap-2 mb-4">
                <Warehouse className="h-5 w-5 text-violet-600" />
                <h4 className="font-semibold text-violet-900">
                  Storage Analysis
                </h4>
              </div>

              <div className="grid grid-cols-3 gap-4 mb-4">
                <div className="bg-white rounded-xl p-3 text-center">
                  <p className="text-xs text-slate-500 mb-1">Storage Cost</p>
                  <p className="font-bold text-slate-700">
                    ₹{storage.storage_cost}/q
                  </p>
                  <p className="text-[10px] text-slate-400">
                    for {daysAhead} days
                  </p>
                </div>
                <div className="bg-white rounded-xl p-3 text-center">
                  <p className="text-xs text-slate-500 mb-1">Potential Gain</p>
                  <p
                    className={cn(
                      "font-bold",
                      storage.potential_gain > 0
                        ? "text-emerald-600"
                        : "text-rose-600",
                    )}
                  >
                    ₹{storage.potential_gain}/q
                  </p>
                </div>
                <div className="bg-white rounded-xl p-3 text-center">
                  <p className="text-xs text-slate-500 mb-1">Net Gain</p>
                  <p
                    className={cn(
                      "font-bold",
                      storage.net_gain > 0
                        ? "text-emerald-600"
                        : "text-rose-600",
                    )}
                  >
                    ₹{storage.net_gain}/q
                  </p>
                </div>
              </div>

              {storage.break_even_days > 0 && storage.break_even_days < 999 && (
                <div className="bg-violet-100 rounded-lg p-3">
                  <p className="text-sm text-violet-800">
                    <span className="font-semibold">Break-even:</span> Store for{" "}
                    {storage.break_even_days} days to cover storage costs
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Stats Grid */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-white rounded-xl p-4 border text-center">
              <p className="text-xs text-slate-500 uppercase mb-1">Trend</p>
              <div className="flex items-center justify-center gap-1">
                {prediction.price_trend === "UP" ? (
                  <TrendingUp className="h-4 w-4 text-emerald-500" />
                ) : prediction.price_trend === "DOWN" ? (
                  <TrendingDown className="h-4 w-4 text-rose-500" />
                ) : (
                  <Minus className="h-4 w-4 text-amber-500" />
                )}
                <span className="font-bold text-sm">
                  {prediction.price_trend}
                </span>
              </div>
            </div>
            <div className="bg-white rounded-xl p-4 border text-center">
              <p className="text-xs text-slate-500 uppercase mb-1">
                Volatility
              </p>
              <span
                className={cn(
                  "font-bold text-sm",
                  prediction.volatility_level === "HIGH"
                    ? "text-rose-600"
                    : prediction.volatility_level === "MEDIUM"
                      ? "text-amber-600"
                      : "text-emerald-600",
                )}
              >
                {prediction.volatility_level}
              </span>
            </div>
            <div className="bg-white rounded-xl p-4 border text-center">
              <p className="text-xs text-slate-500 uppercase mb-1">Range</p>
              <span className="font-bold text-sm text-slate-700">
                ₹{formatIndianNumber(prediction.confidence_interval.lower)} - ₹
                {formatIndianNumber(prediction.confidence_interval.upper)}
              </span>
            </div>
          </div>

          {/* Price History */}
          {history.length > 0 && (
            <div className="bg-white rounded-2xl border p-5">
              <h4 className="font-semibold text-foreground mb-4">
                Recent Price History
              </h4>
              <div className="space-y-2">
                {history.slice(-5).map((point, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between py-2 border-b last:border-0"
                  >
                    <span className="text-sm text-slate-500">
                      {new Date(point.date).toLocaleDateString()}
                    </span>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-slate-400">
                        ₹{formatIndianNumber(point.min_price)} - ₹
                        {formatIndianNumber(point.max_price)}
                      </span>
                      <span className="font-bold text-slate-700">
                        ₹{formatIndianNumber(point.modal_price)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {activeTab === "seasonal" && seasonalTrend && (
        <div className="space-y-6">
          <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl p-5 border border-amber-200">
            <div className="flex items-center gap-2 mb-4">
              <Calendar className="h-5 w-5 text-amber-600" />
              <h4 className="font-semibold text-amber-900">
                Best Time to Sell
              </h4>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="bg-white rounded-xl p-4 text-center border-2 border-emerald-200">
                <p className="text-xs text-slate-500 mb-1">Best Month</p>
                <p className="text-2xl font-bold text-emerald-600">
                  {seasonalTrend.best_month.month}
                </p>
                <p className="text-sm text-slate-600">
                  ₹{formatIndianNumber(seasonalTrend.best_month.avg_price)}/q
                </p>
              </div>
              <div className="bg-white rounded-xl p-4 text-center">
                <p className="text-xs text-slate-500 mb-1">Worst Month</p>
                <p className="text-xl font-bold text-rose-600">
                  {seasonalTrend.worst_month.month}
                </p>
                <p className="text-sm text-slate-600">
                  ₹{formatIndianNumber(seasonalTrend.worst_month.avg_price)}/q
                </p>
              </div>
            </div>

            <div className="bg-amber-100 rounded-lg p-3">
              <p className="text-sm text-amber-800">
                <span className="font-semibold">Price Difference:</span>{" "}
                {seasonalTrend.price_difference_pct}% higher in{" "}
                {seasonalTrend.best_month.month} vs{" "}
                {seasonalTrend.worst_month.month}
              </p>
            </div>
          </div>

          <div className="bg-white rounded-2xl border p-5">
            <h4 className="font-semibold text-foreground mb-4">
              Seasonal Strategy
            </h4>
            <div className="space-y-3 text-sm text-slate-600">
              <p>
                • Store your harvest if you can sell in{" "}
                {seasonalTrend.best_month.month}
              </p>
              <p>
                • Avoid selling in {seasonalTrend.worst_month.month} when prices
                are lowest
              </p>
              <p>• Plan planting dates to harvest before peak price months</p>
            </div>
          </div>
        </div>
      )}

      {activeTab === "mandis" && (
        <div className="space-y-6">
          {mandiPrices.length > 0 ? (
            <>
              <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl p-5 border border-emerald-200">
                <div className="flex items-center gap-2 mb-4">
                  <MapPin className="h-5 w-5 text-emerald-600" />
                  <h4 className="font-semibold text-emerald-900">
                    Best Mandi to Sell
                  </h4>
                </div>

                <div className="bg-white rounded-xl p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-lg font-bold text-emerald-700">
                        {mandiPrices[0].market}
                      </p>
                      <p className="text-sm text-slate-500">
                        Updated:{" "}
                        {new Date(mandiPrices[0].date).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-emerald-600">
                        ₹{formatIndianNumber(mandiPrices[0].latest_price)}
                      </p>
                      <p className="text-xs text-slate-500">per quintal</p>
                    </div>
                  </div>
                </div>

                {mandiPrices.length > 1 && (
                  <div className="mt-4 bg-emerald-100 rounded-lg p-3">
                    <p className="text-sm text-emerald-800">
                      <span className="font-semibold">Tip:</span> You can get ₹
                      {formatIndianNumber(
                        mandiPrices[0].latest_price -
                          mandiPrices[mandiPrices.length - 1].latest_price,
                      )}
                      /q more by selling at {mandiPrices[0].market} instead of{" "}
                      {mandiPrices[mandiPrices.length - 1].market}
                    </p>
                  </div>
                )}
              </div>

              <div className="bg-white rounded-2xl border p-5">
                <h4 className="font-semibold text-foreground mb-4">
                  All Mandi Prices
                </h4>
                <div className="space-y-2">
                  {mandiPrices.map((mandi, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between py-3 border-b last:border-0"
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className={cn(
                            "w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold",
                            idx === 0
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-slate-100 text-slate-600",
                          )}
                        >
                          {idx + 1}
                        </span>
                        <span className="font-medium text-slate-700">
                          {mandi.market}
                        </span>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-slate-900">
                          ₹{formatIndianNumber(mandi.latest_price)}
                        </p>
                        <p className="text-xs text-slate-400">
                          7-day avg: ₹{formatIndianNumber(mandi.avg_price_7d)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-12">
              <Store className="h-12 w-12 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500">No mandi price data available</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
