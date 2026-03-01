import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import { useState } from 'react'
import type { PredictionFormData, PredictionResult } from '@/types'
import { submitPrediction } from '@/api'
import { cn } from '@/lib/utils'
import { Sprout, MapPin, Thermometer, FlaskConical, ChevronDown, ChevronUp, Sparkles, ArrowRight } from 'lucide-react'

const STATE_OPTIONS = [
  'Tamil Nadu', 'Kerala', 'Gujarat', 'Himachal Pradesh', 'Uttar Pradesh',
  'Haryana', 'Punjab', 'Madhya Pradesh', 'Rajasthan', 'Maharashtra',
  'West Bengal', 'Bihar', 'Odisha', 'Assam', 'Karnataka', 'Andhra Pradesh',
  'Telangana', 'Chhattisgarh', 'Jharkhand', 'Uttarakhand'
]

const SEASON_OPTIONS = ['Whole Year', 'Kharif', 'Rabi', 'Autumn', 'Summer', 'Winter']

interface FormSectionProps {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

function FormSection({ title, icon, children, className }: FormSectionProps) {
  return (
    <div className={cn("bg-white rounded-2xl p-6 border shadow-sm", className)}>
      <div className="flex items-center gap-2 mb-4">
        {icon}
        <h3 className="font-semibold text-slate-800">{title}</h3>
      </div>
      {children}
    </div>
  )
}

interface InputFieldProps {
  label: string;
  children: React.ReactNode;
  hint?: string;
}

function InputField({ label, children, hint }: InputFieldProps) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium text-slate-700">{label}</label>
      {children}
      {hint && <p className="text-xs text-slate-400">{hint}</p>}
    </div>
  )
}

export function FormScreen() {
  const navigate = useNavigate()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const { register, handleSubmit } = useForm<PredictionFormData>({
    defaultValues: {
      state: 'Punjab',
      season: 'Kharif',
      annual_rainfall: 800,
      area: 1,
      n_soil: 80,
      p_soil: 50,
      k_soil: 40,
      temperature: 25,
      humidity: 70,
      ph: 6.5,
      fertilizer: 300,
      pesticide: 2,
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

  const inputClass = "w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
  const selectClass = "w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all appearance-none cursor-pointer"

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50/50 via-white to-green-50/30 py-10 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-100 rounded-full mb-4">
            <Sparkles className="h-4 w-4 text-emerald-600" />
            <span className="text-sm font-medium text-emerald-700">AI-Powered Crop Recommendation</span>
          </div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Find Your Perfect Crop</h1>
          <p className="text-slate-600 max-w-md mx-auto">
            Enter your farm details and let our AI analyze the best crops for your soil and climate conditions.
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Location & Season */}
          <FormSection 
            title="Location & Season" 
            icon={<MapPin className="h-5 w-5 text-emerald-600" />}
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <InputField label="State">
                <div className="relative">
                  <select className={selectClass} {...register('state')}>
                    {STATE_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                </div>
              </InputField>

              <InputField label="Season">
                <div className="relative">
                  <select className={selectClass} {...register('season')}>
                    {SEASON_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                </div>
              </InputField>

              <InputField label="Farm Area" hint="in hectares">
                <input
                  type="number"
                  step="0.1"
                  className={inputClass}
                  placeholder="e.g. 2.5"
                  {...register('area', { valueAsNumber: true })}
                />
              </InputField>

              <InputField label="Annual Rainfall" hint="in mm">
                <input
                  type="number"
                  className={inputClass}
                  placeholder="e.g. 800"
                  {...register('annual_rainfall', { valueAsNumber: true })}
                />
              </InputField>
            </div>
          </FormSection>

          {/* Soil Health */}
          <FormSection 
            title="Soil Health" 
            icon={<FlaskConical className="h-5 w-5 text-amber-600" />}
          >
            <div className="grid gap-4 sm:grid-cols-4">
              <InputField label="Nitrogen (N)">
                <input
                  type="number"
                  className={inputClass}
                  placeholder="0-140"
                  {...register('n_soil', { valueAsNumber: true })}
                />
              </InputField>
              <InputField label="Phosphorus (P)">
                <input
                  type="number"
                  className={inputClass}
                  placeholder="5-145"
                  {...register('p_soil', { valueAsNumber: true })}
                />
              </InputField>
              <InputField label="Potassium (K)">
                <input
                  type="number"
                  className={inputClass}
                  placeholder="5-205"
                  {...register('k_soil', { valueAsNumber: true })}
                />
              </InputField>
              <InputField label="pH Level">
                <input
                  type="number"
                  step="0.1"
                  className={inputClass}
                  placeholder="3.5-9.9"
                  {...register('ph', { valueAsNumber: true })}
                />
              </InputField>
            </div>
          </FormSection>

          {/* Weather */}
          <FormSection 
            title="Weather Conditions" 
            icon={<Thermometer className="h-5 w-5 text-rose-600" />}
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <InputField label="Temperature" hint="in °C">
                <input
                  type="number"
                  className={inputClass}
                  placeholder="e.g. 28"
                  {...register('temperature', { valueAsNumber: true })}
                />
              </InputField>
              <InputField label="Humidity" hint="in %">
                <input
                  type="number"
                  className={inputClass}
                  placeholder="e.g. 65"
                  {...register('humidity', { valueAsNumber: true })}
                />
              </InputField>
            </div>
          </FormSection>

          {/* Advanced Options */}
          <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-slate-50 transition-colors"
            >
              <div className="flex items-center gap-2">
                <Sprout className="h-5 w-5 text-emerald-600" />
                <span className="font-semibold text-slate-800">Advanced Options</span>
                <span className="text-xs text-slate-400">(Fertilizer, Pesticide)</span>
              </div>
              {showAdvanced ? (
                <ChevronUp className="h-5 w-5 text-slate-400" />
              ) : (
                <ChevronDown className="h-5 w-5 text-slate-400" />
              )}
            </button>
            
            {showAdvanced && (
              <div className="px-6 pb-6 pt-2 border-t">
                <div className="grid gap-4 sm:grid-cols-2">
                  <InputField label="Fertilizer Used" hint="in kg">
                    <input
                      type="number"
                      className={inputClass}
                      placeholder="e.g. 300"
                      {...register('fertilizer', { valueAsNumber: true })}
                    />
                  </InputField>
                  <InputField label="Pesticide Used" hint="in kg">
                    <input
                      type="number"
                      className={inputClass}
                      placeholder="e.g. 2"
                      {...register('pesticide', { valueAsNumber: true })}
                    />
                  </InputField>
                </div>
              </div>
            )}
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 flex items-start gap-3">
              <div className="w-5 h-5 rounded-full bg-rose-100 flex items-center justify-center shrink-0 mt-0.5">
                <span className="text-rose-600 text-xs">!</span>
              </div>
              <p className="text-sm text-rose-700">{error}</p>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-gradient-to-r from-emerald-600 to-green-600 text-white font-semibold py-4 rounded-xl shadow-lg hover:shadow-xl hover:from-emerald-700 hover:to-green-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Analyzing your farm...
              </>
            ) : (
              <>
                <Sparkles className="h-5 w-5" />
                Get AI Recommendations
                <ArrowRight className="h-5 w-5" />
              </>
            )}
          </button>
        </form>

        {/* Footer */}
        <p className="text-center text-xs text-slate-400 mt-8">
          Powered by machine learning models trained on Indian agricultural data
        </p>
      </div>
    </div>
  )
}
