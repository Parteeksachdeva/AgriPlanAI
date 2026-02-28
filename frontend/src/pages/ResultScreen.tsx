import { useLocation, useNavigate } from 'react-router-dom'
import type { PredictionResult, PredictionFormData } from '@/types'
import { ResultChatbot } from '@/components/ResultChatbot'

interface LocationState {
  result: PredictionResult
  formData: PredictionFormData
}

export function ResultScreen() {
  const { state } = useLocation() as { state: LocationState | null }
  const navigate = useNavigate()

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

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <div className="rounded-2xl border bg-card p-8 shadow-sm">
        <h2 className="mb-2 text-2xl font-semibold tracking-tight text-foreground">
          Prediction result
        </h2>
        <p className="mb-8 text-muted-foreground">
          AI model output based on your inputs.
        </p>

        <div className="space-y-6">
          {(result.predictedYield != null || result.expectedProfit != null) && (
            <div className="grid gap-4 sm:grid-cols-2">
              {result.predictedYield != null && (
                <div className="rounded-xl bg-primary/5 p-5">
                  <p className="text-sm font-medium text-muted-foreground">
                    Predicted yield
                  </p>
                  <p className="mt-1 text-3xl font-bold text-foreground">
                    {result.predictedYield.toLocaleString(undefined, { maximumFractionDigits: 2 })} tonnes/ha
                  </p>
                </div>
              )}
              {result.expectedProfit != null && (
                <div className="rounded-xl bg-green-500/10 p-5">
                  <p className="text-sm font-medium text-muted-foreground">
                    Expected Profit
                  </p>
                  <p className="mt-1 text-3xl font-bold text-green-700 dark:text-green-400">
                    ₹{result.expectedProfit.toLocaleString(undefined, { maximumFractionDigits: 0 })}/ha
                  </p>
                </div>
              )}
            </div>
          )}

          {result.top3Crops && result.top3Crops.length > 0 && (
            <div className="rounded-lg border p-4">
              <p className="mb-3 text-sm font-medium text-foreground">
                Top Alternative Crops by Profit
              </p>
              <ul className="space-y-2">
                {result.top3Crops.map((item, index) => (
                  <li key={item.crop} className="flex items-center justify-between rounded bg-muted/30 px-3 py-2 text-sm">
                    <span className="font-medium text-foreground">{index + 1}. {item.crop}</span>
                    <span className="text-green-600 dark:text-green-400">₹{item.expected_profit.toLocaleString(undefined, { maximumFractionDigits: 0 })}/ha</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {result.confidence != null && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Confidence:</span>
              <span className="font-medium">{Math.round(result.confidence * 100)}%</span>
            </div>
          )}

          {result.recommendation && (
            <div className="rounded-lg border bg-muted/30 p-4">
              <p className="text-sm font-medium text-foreground">Recommendation</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {result.recommendation}
              </p>
            </div>
          )}

          {result.message && (
            <p className="text-sm text-muted-foreground">{result.message}</p>
          )}

          <div className="rounded-lg border p-4">
            <p className="mb-3 text-sm font-medium text-foreground">
              Summary of your inputs
            </p>
            <ul className="grid gap-1 text-sm text-muted-foreground sm:grid-cols-2">
              <li>Rainfall: {formData.rainfall} mm</li>
              <li>Avg temp: {formData.averageTemperature} °C</li>
              <li>Soil: {formData.soilType}</li>
              <li>Irrigation: {formData.irrigation}</li>
              <li>Season: {formData.season}</li>
              <li>Crop: {formData.cropType}</li>
              <li>Historical yield: {formData.historicalYield} kg/ha</li>
              {'areaHectares' in formData && formData.areaHectares != null && <li>Area: {formData.areaHectares} ha</li>}
              {'state' in formData && formData.state && <li>State: {formData.state}</li>}
              {'district' in formData && formData.district && <li>District: {formData.district}</li>}
              {'soilPh' in formData && formData.soilPh != null && <li>Soil pH: {formData.soilPh}</li>}
              {'previousCrop' in formData && formData.previousCrop && <li>Previous crop: {formData.previousCrop}</li>}
              {'humidityPercent' in formData && formData.humidityPercent != null && <li>Humidity: {formData.humidityPercent}%</li>}
            </ul>
          </div>
        </div>

        <div className="mt-8 flex gap-3">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            New prediction
          </button>
        </div>
      </div>

      <ResultChatbot result={result} formData={formData} />
    </div>
  )
}
