import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import { useState } from 'react'
import type { PredictionFormData, PredictionResult } from '@/types'
import { submitPrediction } from '@/api'

const STATE_OPTIONS = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
  'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya',
  'Mizoram', 'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim',
  'Tamil Nadu', 'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand',
  'West Bengal',
]

const SEASON_OPTIONS = ['Whole Year', 'Kharif', 'Rabi', 'Autumn', 'Summer', 'Winter']

const CROP_OPTIONS = [
  'Arecanut', 'Castor seed', 'ChickPea', 'Coconut', 'Cotton',
  'Dry chillies', 'Jute', 'Linseed', 'Maize', 'Mesta', 'Niger seed',
  'Onion', 'Potato', 'PigeonPeas', 'Rapeseed &Mustard', 'Rice',
  'Sesamum', 'Small millets', 'Sugarcane', 'Sweet potato', 'Tapioca',
  'Tobacco', 'Turmeric', 'Wheat',
]

const inputClass =
  'flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2'
const labelClass = 'text-sm font-medium leading-none text-foreground'

export function FormScreen() {
  const navigate = useNavigate()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showOptional, setShowOptional] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const { register, handleSubmit } = useForm<PredictionFormData>({
    defaultValues: {
      state: 'Punjab',
      season: 'Kharif',
      annual_rainfall: 649,
      fertilizer: 50000,
      pesticide: 163,
      area: 500,
      crop: 'Wheat',
    },
  })

  async function onSubmit(data: PredictionFormData) {
    setIsSubmitting(true)
    setError(null)
    try {
      const result: PredictionResult = await submitPrediction(data)
      navigate('/result', { state: { result, formData: data } })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Prediction failed. Is the backend running?')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <div className="rounded-2xl border bg-card p-8 shadow-sm">
        <h2 className="mb-2 text-2xl font-semibold tracking-tight text-foreground">
          Yield prediction
        </h2>
        <p className="mb-8 text-muted-foreground">
          Enter farm and location details. Our AI model will predict yield and suggest the most profitable crops.
        </p>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">

          {/* State + Season */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label htmlFor="state" className={labelClass}>State</label>
              <select id="state" className={inputClass} {...register('state')}>
                {STATE_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label htmlFor="season" className={labelClass}>Season</label>
              <select id="season" className={inputClass} {...register('season')}>
                {SEASON_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Rainfall + Area */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label htmlFor="annual_rainfall" className={labelClass}>
                Annual rainfall (mm)
              </label>
              <input
                id="annual_rainfall"
                type="number"
                step="any"
                className={inputClass}
                placeholder="e.g. 800"
                {...register('annual_rainfall', { valueAsNumber: true })}
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="area" className={labelClass}>
                Area (hectares)
              </label>
              <input
                id="area"
                type="number"
                step="any"
                className={inputClass}
                placeholder="e.g. 500"
                {...register('area', { valueAsNumber: true })}
              />
            </div>
          </div>

          {/* Fertilizer + Pesticide */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label htmlFor="fertilizer" className={labelClass}>
                Fertilizer used (kg)
              </label>
              <input
                id="fertilizer"
                type="number"
                step="any"
                className={inputClass}
                placeholder="e.g. 50000"
                {...register('fertilizer', { valueAsNumber: true })}
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="pesticide" className={labelClass}>
                Pesticide used (kg)
              </label>
              <input
                id="pesticide"
                type="number"
                step="any"
                className={inputClass}
                placeholder="e.g. 163"
                {...register('pesticide', { valueAsNumber: true })}
              />
            </div>
          </div>

          {/* Crop */}
          <div className="space-y-2">
            <label htmlFor="crop" className={labelClass}>Crop</label>
            <select id="crop" className={inputClass} {...register('crop')}>
              {CROP_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </div>

          {/* Optional soil / weather */}
          <div>
            <button
              type="button"
              onClick={() => setShowOptional((v) => !v)}
              className="text-sm font-medium text-primary underline-offset-2 hover:underline"
            >
              {showOptional ? '− Hide' : '+ Add'} soil &amp; weather details (optional)
            </button>

            {showOptional && (
              <div className="mt-4 grid gap-4 sm:grid-cols-3">
                <div className="space-y-2">
                  <label htmlFor="temperature" className={labelClass}>Temperature (°C)</label>
                  <input
                    id="temperature"
                    type="number"
                    step="any"
                    className={inputClass}
                    placeholder="e.g. 28"
                    {...register('temperature', { valueAsNumber: true })}
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="humidity" className={labelClass}>Humidity (%)</label>
                  <input
                    id="humidity"
                    type="number"
                    step="any"
                    className={inputClass}
                    placeholder="e.g. 65"
                    {...register('humidity', { valueAsNumber: true })}
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="ph" className={labelClass}>Soil pH</label>
                  <input
                    id="ph"
                    type="number"
                    step="any"
                    className={inputClass}
                    placeholder="e.g. 6.5"
                    {...register('ph', { valueAsNumber: true })}
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="n_soil" className={labelClass}>Nitrogen (N)</label>
                  <input
                    id="n_soil"
                    type="number"
                    step="any"
                    className={inputClass}
                    placeholder="e.g. 80"
                    {...register('n_soil', { valueAsNumber: true })}
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="p_soil" className={labelClass}>Phosphorus (P)</label>
                  <input
                    id="p_soil"
                    type="number"
                    step="any"
                    className={inputClass}
                    placeholder="e.g. 47"
                    {...register('p_soil', { valueAsNumber: true })}
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="k_soil" className={labelClass}>Potassium (K)</label>
                  <input
                    id="k_soil"
                    type="number"
                    step="any"
                    className={inputClass}
                    placeholder="e.g. 40"
                    {...register('k_soil', { valueAsNumber: true })}
                  />
                </div>
              </div>
            )}
          </div>

          {error && (
            <p className="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-2 text-sm text-destructive">
              {error}
            </p>
          )}

          <div className="pt-4">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-lg bg-primary px-4 py-3 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:opacity-50 sm:w-auto sm:min-w-[180px]"
            >
              {isSubmitting ? 'Predicting…' : 'Get prediction'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
