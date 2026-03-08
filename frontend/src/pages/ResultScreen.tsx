import { useLocation, useNavigate } from "react-router-dom";
import type { PredictionResult, PredictionFormData, CropResult } from "@/types";
import { ResultChatbot } from "@/components/ResultChatbot";
import { ProfitCalculator } from "@/components/ProfitCalculator";
import { CropCalendar } from "@/components/CropCalendar";
import { SoilRecommendations } from "@/components/SoilRecommendations";
import { PricePrediction } from "@/components/PricePrediction";
import { CropComparison } from "@/components/CropComparison";
import { AIExplanation } from "@/components/AIExplanation";
import { CropRotationPlanner } from "@/components/CropRotationPlanner";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/i18n";
import {
  CROP_RISK_META,
  DEFAULT_RISK_META,
  CROP_MIN_RAINFALL,
  type RiskLevel,
} from "@/lib/crop_risk_data";

interface LocationState {
  result: PredictionResult;
  formData: PredictionFormData;
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
  Home,
  Brain,
  Beaker,
  BarChart3,
  RotateCcw,
} from "lucide-react";
import {
  ExpandableSection,
  QuickSummary,
} from "@/components/ExpandableSection";

export function ResultScreen() {
  const { state } = useLocation() as { state: LocationState | null };
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [selectedCropForCalculator, setSelectedCropForCalculator] =
    useState<CropResult | null>(null);
  const [activeTab, setActiveTab] = useState<
    "overview" | "earnings" | "market" | "planning"
  >("overview");

  if (!state?.result) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50/50 to-emerald-50/30 flex items-center justify-center px-4">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto">
            <AlertTriangle className="h-8 w-8 text-amber-600" />
          </div>
          <p className="text-muted-foreground">{t("common.error")}</p>
          <button
            type="button"
            onClick={() => navigate("/")}
            className="rounded-full bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-all shadow-lg hover:shadow-xl"
          >
            {t("result.newAnalysis")}
          </button>
        </div>
      </div>
    );
  }

  const { result, formData } = state;
  const { recommendations } = result;
  const top = recommendations[0];

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

    if (suitability === "rare") {
      score += 2;
      reasons.push("Rarely grown in your state");
    } else if (suitability === "common") {
      score += 1;
      reasons.push("Common but not a staple");
    }

    score += meta.volatility;
    if (meta.volatility === 2) reasons.push("High price volatility");
    else if (meta.volatility === 1) reasons.push("Moderate price shifts");

    score += meta.predictability;
    if (meta.predictability === 2) reasons.push("Yield sensitive to climate");
    else if (meta.predictability === 1)
      reasons.push("Moderate yield unpredictability");

    if (meta.water_sensitive && formData.annual_rainfall < minRainfall) {
      score += 1;
      reasons.push("High water needs vs rainfall");
    }

    let level: RiskLevel = "low";
    if (score >= 4) level = "high";
    else if (score >= 2) level = "medium";

    return { level, reasons };
  };

  const getRiskColor = (level: RiskLevel) => {
    switch (level) {
      case "low":
        return "bg-emerald-100 text-emerald-700 border-emerald-200";
      case "medium":
        return "bg-amber-100 text-amber-700 border-amber-200";
      case "high":
        return "bg-rose-100 text-rose-700 border-rose-200";
    }
  };

  const getSuitabilityIcon = (suitability: string) => {
    switch (suitability) {
      case "traditional":
        return <CheckCircle className="h-4 w-4 text-emerald-500" />;
      case "common":
        return <Leaf className="h-4 w-4 text-blue-500" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-amber-500" />;
    }
  };

  const getSuitabilityColor = (suitability: string) => {
    switch (suitability) {
      case "traditional":
        return "bg-emerald-50 text-emerald-700 border-emerald-100";
      case "common":
        return "bg-blue-50 text-blue-700 border-blue-100";
      default:
        return "bg-amber-50 text-amber-700 border-amber-100";
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
                <span className="text-sm font-medium text-emerald-700">
                  {t("form.title")}
                </span>
              </div>
              <div className="w-12 h-0.5 bg-emerald-300" />
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center">
                  <CheckCircle className="h-4 w-4 text-white" />
                </div>
                <span className="text-sm font-medium text-emerald-700">
                  {t("form.submit.loading")}
                </span>
              </div>
              <div className="w-12 h-0.5 bg-emerald-300" />
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center ring-4 ring-emerald-100">
                  <span className="text-sm font-bold text-white">3</span>
                </div>
                <span className="text-sm font-bold text-emerald-800">
                  {t("result.title")}
                </span>
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
              onClick={() => navigate("/form")}
              className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              {t("common.back")}
            </button>
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-amber-500" />
              <span className="font-semibold text-foreground">
                {t("result.title")}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => navigate("/")}
                className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                <Home className="h-4 w-4" />
                {t("common.close")}
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
                    {t("result.bestCrop")}
                  </span>
                  <span
                    className={cn(
                      "px-3 py-1 rounded-full text-xs font-medium backdrop-blur-sm flex items-center gap-1.5 border border-white/20",
                      getSuitabilityColor(top.suitability)
                        .replace("bg-", "bg-white/")
                        .replace("text-", "text-")
                        .replace("border-", ""),
                    )}
                  >
                    {getSuitabilityIcon(top.suitability)}
                    {top.suitability === "traditional"
                      ? "Highly Recommended for " + formData.state
                      : top.suitability === "common"
                        ? "Good Match for " + formData.state
                        : "Alternative Option"}
                  </span>
                </div>

                <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
                  <div>
                    <h1 className="text-4xl md:text-5xl font-bold capitalize mb-2">
                      {top.crop}
                    </h1>
                    <p className="text-green-100 text-lg">
                      {formData.state} • {formData.season}
                    </p>
                  </div>

                  <div className="flex gap-4">
                    <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 min-w-[140px]">
                      <p className="text-green-200 text-sm mb-1">
                        {t("result.yield")}
                      </p>
                      <p className="text-2xl font-bold">
                        {top.predicted_yield.toFixed(1)}{" "}
                        <span className="text-lg font-normal">t/ha</span>
                      </p>
                    </div>
                    <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 min-w-[140px]">
                      <p className="text-green-200 text-sm mb-1">
                        {t("result.revenue")}
                      </p>
                      <p className="text-2xl font-bold">
                        ₹{(top.expected_revenue / 1000).toFixed(0)}K
                      </p>
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
                {t("result.recommended")}
              </h2>

              <div className="space-y-3">
                {recommendations.map((item, i) => {
                  const { level } = getRiskInfo(item.crop, item.suitability);
                  const isSelected =
                    item.crop === selectedCropForCalculator?.crop;

                  return (
                    <button
                      key={item.crop}
                      onClick={() => setSelectedCropForCalculator(item)}
                      className={cn(
                        "w-full text-left p-4 rounded-xl transition-all duration-200 border",
                        isSelected
                          ? "bg-emerald-50 border-emerald-300 shadow-md ring-2 ring-emerald-100"
                          : "bg-white border-gray-100 hover:border-emerald-200 hover:shadow-sm",
                      )}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-bold text-muted-foreground">
                              #{i + 1}
                            </span>
                            <span className="font-semibold capitalize text-foreground">
                              {item.crop}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span
                              className={cn(
                                "px-2 py-0.5 rounded-full text-[10px] font-medium border",
                                getRiskColor(level),
                              )}
                            >
                              {level === "low"
                                ? t("result.suitability.traditional")
                                : level === "medium"
                                  ? t("result.suitability.common")
                                  : t("result.suitability.rare")}
                            </span>
                            <span
                              className={cn(
                                "px-2 py-0.5 rounded-full text-[10px] font-medium border",
                                getSuitabilityColor(item.suitability),
                              )}
                            >
                              {item.suitability}
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-emerald-600">
                            ₹{(item.expected_revenue / 1000).toFixed(0)}K
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {item.predicted_yield.toFixed(1)} t/ha
                          </p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Farm Summary Card */}
            <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-6 text-white">
              <h3 className="text-sm font-medium text-slate-300 mb-4 uppercase tracking-wider">
                {t("form.section.farm")}
              </h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-400">
                    {t("form.label.state")}
                  </span>
                  <span className="font-medium">{formData.state}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">
                    {t("form.label.season")}
                  </span>
                  <span className="font-medium">{formData.season}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">{t("form.label.area")}</span>
                  <span className="font-medium">{formData.area} ha</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">
                    {t("form.label.rainfall")}
                  </span>
                  <span className="font-medium">
                    {formData.annual_rainfall} mm
                  </span>
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
                        id: "overview",
                        label: t("result.tab.overview"),
                        icon: Sprout,
                        desc: t("result.tab.overview.desc"),
                      },
                      {
                        id: "earnings",
                        label: t("result.tab.earnings"),
                        icon: Wallet,
                        desc: t("result.tab.earnings.desc"),
                      },
                      {
                        id: "market",
                        label: t("result.tab.market"),
                        icon: TrendingUp,
                        desc: t("result.tab.market.desc"),
                      },
                      {
                        id: "planning",
                        label: t("result.tab.planning"),
                        icon: Calendar,
                        desc: t("result.tab.planning.desc"),
                      },
                    ].map((tab) => (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as typeof activeTab)}
                        className={cn(
                          "flex-1 flex flex-col items-center gap-1 px-4 py-4 text-sm font-medium transition-all border-b-2",
                          activeTab === tab.id
                            ? "border-emerald-500 text-emerald-700 bg-white"
                            : "border-transparent text-muted-foreground hover:text-foreground hover:bg-white/50",
                        )}
                      >
                        <tab.icon className="h-5 w-5 mb-1" />
                        <span>{tab.label}</span>
                        <span className="text-[10px] font-normal opacity-70 hidden sm:block">
                          {tab.desc}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Tab Content */}
                <div className="p-6">
                  {activeTab === "overview" ? (
                    <div className="space-y-4">
                      {/* Quick Summary */}
                      <QuickSummary
                        items={[
                          {
                            label: t("result.quick.aiConfidence"),
                            value: `${selectedCropForCalculator.suitability === "traditional" ? "95%" : selectedCropForCalculator.suitability === "common" ? "80%" : "65%"}`,
                            icon: <Brain className="h-4 w-4" />,
                          },
                          {
                            label: t("result.yield"),
                            value: `${selectedCropForCalculator.predicted_yield.toFixed(1)} t/ha`,
                            icon: <Sprout className="h-4 w-4" />,
                          },
                          {
                            label: t("result.quick.soilMatch"),
                            value:
                              selectedCropForCalculator.suitability ===
                              "traditional"
                                ? t("result.quick.soilMatch.excellent")
                                : selectedCropForCalculator.suitability ===
                                    "common"
                                  ? t("result.quick.soilMatch.good")
                                  : t("result.quick.soilMatch.fair"),
                            icon: <Beaker className="h-4 w-4" />,
                          },
                        ]}
                      />

                      {/* AI Explanation - Expandable */}
                      <ExpandableSection
                        title={t("result.bestCrop")}
                        subtitle={t("result.sec.ai.subtitle")}
                        icon={<Brain className="h-5 w-5" />}
                        defaultExpanded={true}
                        variant="highlighted"
                      >
                        <AIExplanation
                          crop={selectedCropForCalculator}
                          displayRank={recommendations.findIndex(r => r.crop === selectedCropForCalculator.crop) + 1}
                          formData={{
                            state: formData.state,
                            season: formData.season,
                            annual_rainfall: formData.annual_rainfall,
                            ph: formData.ph || undefined,
                            n_soil: formData.n_soil || undefined,
                            p_soil: formData.p_soil || undefined,
                            k_soil: formData.k_soil || undefined,
                            temperature: formData.temperature || undefined,
                            humidity: formData.humidity || undefined
                          }}
                        />
                      </ExpandableSection>

                      {/* Soil Recommendations - Expandable */}
                      <ExpandableSection
                        title={t("form.section.soil")}
                        subtitle={t("result.sec.soil.subtitle")}
                        icon={<Beaker className="h-5 w-5" />}
                      >
                        <SoilRecommendations
                          currentSoil={{
                            n: formData.n_soil || 50,
                            p: formData.p_soil || 50,
                            k: formData.k_soil || 50,
                            ph: formData.ph || 6.5,
                          }}
                          targetCrop={selectedCropForCalculator.crop}
                        />
                      </ExpandableSection>
                    </div>
                  ) : activeTab === "earnings" ? (
                    <div className="space-y-4">
                      {/* Quick Summary */}
                      <QuickSummary
                        items={[
                          {
                            label: t("result.revenue"),
                            value: `₹${(selectedCropForCalculator.expected_revenue / 1000).toFixed(0)}K`,
                            icon: <Wallet className="h-4 w-4" />,
                          },
                          {
                            label: t("result.price"),
                            value: `₹${selectedCropForCalculator.avg_price.toFixed(0)}${t("result.perQuintal")}`,
                            icon: <TrendingUp className="h-4 w-4" />,
                          },
                          {
                            label: t("result.yield"),
                            value: `${selectedCropForCalculator.predicted_yield.toFixed(1)} t/ha`,
                            icon: <Sprout className="h-4 w-4" />,
                          },
                        ]}
                      />

                      {/* Profit Calculator - Expandable */}
                      <ExpandableSection
                        title={t("result.revenue")}
                        subtitle={t("result.sec.earnings.subtitle")}
                        icon={<Wallet className="h-5 w-5" />}
                        defaultExpanded={true}
                        variant="highlighted"
                      >
                        <ProfitCalculator
                          key={selectedCropForCalculator.crop}
                          initialCropName={selectedCropForCalculator.crop}
                          initialYield={
                            selectedCropForCalculator.predicted_yield
                          }
                          initialArea={formData.area}
                          initialMandiPrice={
                            selectedCropForCalculator.avg_price
                          }
                          currentSoil={{
                            n: formData.n_soil || 50,
                            p: formData.p_soil || 50,
                            k: formData.k_soil || 50,
                            ph: formData.ph || 6.5,
                          }}
                          annualRainfall={formData.annual_rainfall || 800}
                        />
                      </ExpandableSection>

                      {/* Crop Comparison - Expandable */}
                      <ExpandableSection
                        title={t("result.recommended")}
                        subtitle={t("result.sec.compare.subtitle")}
                        icon={<BarChart3 className="h-5 w-5" />}
                      >
                        <CropComparison
                          crops={recommendations}
                          formData={{
                            state: formData.state,
                            season: formData.season,
                            annual_rainfall: formData.annual_rainfall,
                            area: formData.area,
                          }}
                        />
                      </ExpandableSection>
                    </div>
                  ) : activeTab === "market" ? (
                    <div className="space-y-4">
                      {/* Quick Summary */}
                      <QuickSummary
                        items={[
                          {
                            label: t("price.current"),
                            value: `₹${selectedCropForCalculator.avg_price.toFixed(0)}${t("result.perQuintal")}`,
                            icon: <TrendingUp className="h-4 w-4" />,
                          },
                          {
                            label: t("result.quick.bestMarket"),
                            value: formData.state,
                            icon: <Leaf className="h-4 w-4" />,
                          },
                        ]}
                      />
                      <PricePrediction
                        commodity={selectedCropForCalculator.crop}
                        state={formData.state}
                      />
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {/* Quick Summary */}
                      <QuickSummary
                        items={[
                          {
                            label: t("form.label.season"),
                            value: formData.season,
                            icon: <Calendar className="h-4 w-4" />,
                          },
                          {
                            label: t("result.quick.growthPeriod"),
                            value: t("result.quick.growthPeriod.value"),
                            icon: <Sprout className="h-4 w-4" />,
                          },
                        ]}
                      />

                      {/* Crop Calendar - Expandable */}
                      <ExpandableSection
                        title={t("welcome.feature3.title")}
                        subtitle={t("result.sec.calendar.subtitle")}
                        icon={<Calendar className="h-5 w-5" />}
                        defaultExpanded={true}
                        variant="highlighted"
                      >
                        <CropCalendar
                          cropName={selectedCropForCalculator.crop}
                          season={formData.season}
                        />
                      </ExpandableSection>

                      {/* Rotation Planner - Expandable */}
                      <ExpandableSection
                        title={t("result.rotation.title")}
                        subtitle={t("result.sec.rotation.subtitle")}
                        icon={<RotateCcw className="h-5 w-5" />}
                      >
                        <CropRotationPlanner
                          currentCrop={selectedCropForCalculator.crop}
                          season={formData.season}
                        />
                      </ExpandableSection>
                    </div>
                  )}
                </div>

                {/* "What's Next?" Guided Flow for Farmers */}
                <div className="mt-8 p-6 bg-slate-50 rounded-2xl border border-dashed border-slate-300">
                  <h4 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-amber-500" />
                    {t('result.whatsNext.title')}
                  </h4>
                  <div className="grid gap-4 sm:grid-cols-2">
                    {[
                      { 
                        title: t('result.whatsNext.profits.title'), 
                        desc: t('result.whatsNext.profits.desc'),
                        action: () => setActiveTab('earnings'),
                        icon: Wallet,
                        step: "1"
                      },
                      { 
                        title: t('result.whatsNext.season.title'), 
                        desc: t('result.whatsNext.season.desc'),
                        action: () => setActiveTab('planning'),
                        icon: Calendar,
                        step: "2"
                      }
                    ].map((item, idx) => (
                      <button 
                        key={idx}
                        onClick={item.action}
                        className="flex items-start gap-4 p-4 bg-white rounded-xl border hover:border-emerald-500 hover:shadow-md transition-all text-left group"
                      >
                        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center shrink-0 font-bold text-slate-500 group-hover:bg-emerald-100 group-hover:text-emerald-600 transition-colors">
                          {item.step}
                        </div>
                        <div>
                          <p className="font-bold text-slate-800 group-hover:text-emerald-700 transition-colors">{item.title}</p>
                          <p className="text-xs text-slate-500 mt-1">{item.desc}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Floating Chatbot */}
        <ResultChatbot 
          result={result} 
          formData={formData} 
          onNavigate={(tab) => setActiveTab(tab)}
        />
      </div>
    </div>
  );
}
