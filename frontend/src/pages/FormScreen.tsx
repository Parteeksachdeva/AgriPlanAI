import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import { useState } from 'react'
import type { PredictionFormData, PredictionResult } from '@/types'
import { submitPrediction } from '@/api'
import { cn } from '@/lib/utils'
import { HelpTooltip } from '@/components/HelpTooltip'
import { useLanguage } from '@/i18n'
import { 
  Sprout, 
  MapPin, 
  Thermometer, 
  FlaskConical, 
  ChevronDown, 
  ChevronUp, 
  Sparkles, 
  ArrowRight
} from 'lucide-react'

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
  helpTooltip?: {
    title: string;
    description: string;
    example?: string;
  };
}

function InputField({ label, children, hint, helpTooltip }: InputFieldProps) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center">
        <label className="text-sm font-medium text-slate-700">{label}</label>
        {helpTooltip && (
          <HelpTooltip 
            title={helpTooltip.title}
            description={helpTooltip.description}
            example={helpTooltip.example}
          />
        )}
      </div>
      {children}
      {hint && <p className="text-xs text-slate-400">{hint}</p>}
    </div>
  )
}

export function FormScreen() {
  const navigate = useNavigate()
  const { t } = useLanguage()
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
        {/* Progress Steps */}
        <div className="flex items-center justify-center mb-8">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center">
                <span className="text-sm font-bold text-emerald-700">1</span>
              </div>
              <span className="text-sm font-medium text-emerald-700">Enter Details</span>
            </div>
            <div className="w-12 h-0.5 bg-slate-200" />
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center">
                <span className="text-sm font-bold text-slate-500">2</span>
              </div>
              <span className="text-sm font-medium text-slate-500">AI Analysis</span>
            </div>
            <div className="w-12 h-0.5 bg-slate-200" />
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center">
                <span className="text-sm font-bold text-slate-500">3</span>
              </div>
              <span className="text-sm font-medium text-slate-500">Get Results</span>
            </div>
          </div>
        </div>

        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-100 rounded-full mb-4">
            <Sparkles className="h-4 w-4 text-emerald-600" />
            <span className="text-sm font-medium text-emerald-700">{t('form.title')}</span>
          </div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">{t('form.title')}</h1>
          <p className="text-slate-600 max-w-md mx-auto">
            {t('form.subtitle')}
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Location & Season */}
          <FormSection 
            title={t('form.section.location')} 
            icon={<MapPin className="h-5 w-5 text-emerald-600" />}
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <InputField 
                label="Your State"
                helpTooltip={{
                  title: "Why do we need this?",
                  description: "Different states have different climates and soil types. We use this to recommend crops that grow well in your region.",
                  example: "If you select Punjab, we'll recommend wheat and rice which are traditional crops there."
                }}
              >
                <div className="relative">
                  <select className={selectClass} {...register('state')}>
                    {STATE_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                </div>
              </InputField>

              <InputField 
                label="Farming Season"
                helpTooltip={{
                  title: "Which season are you planning for?",
                  description: "Kharif (Monsoon/June-Oct), Rabi (Winter/Oct-March), or Whole Year. Different crops grow in different seasons.",
                  example: "Rice grows in Kharif, Wheat grows in Rabi."
                }}
              >
                <div className="relative">
                  <select className={selectClass} {...register('season')}>
                    {SEASON_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                </div>
              </InputField>

              <InputField 
                label="Farm Size" 
                hint="in hectares (1 hectare = 2.47 acres)"
                helpTooltip={{
                  title: "How big is your farm?",
                  description: "Enter your total farm area. This helps us calculate your total expected revenue.",
                  example: "If you have 5 acres, enter approximately 2 hectares."
                }}
              >
                <input
                  type="number"
                  step="0.1"
                  className={inputClass}
                  placeholder="e.g. 2.5"
                  {...register('area', { valueAsNumber: true })}
                />
              </InputField>

              <InputField 
                label="Annual Rainfall" 
                hint="in millimeters (mm)"
                helpTooltip={{
                  title: "How much rain does your area get?",
                  description: "Different crops need different amounts of water. This helps us recommend suitable crops.",
                  example: "Punjab gets ~600-800mm, Kerala gets ~3000mm annually."
                }}
              >
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
            title={t('form.section.soil')} 
            icon={<FlaskConical className="h-5 w-5 text-amber-600" />}
          >
            <div className="bg-amber-50 rounded-xl p-4 mb-4 border border-amber-100">
              <p className="text-sm text-amber-800">
                {t('form.section.soil.tip')}
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-4">
              <InputField 
                label={t('form.label.nitrogen')}
                helpTooltip={{
                  title: t('help.n.title'),
                  description: t('help.n.desc'),
                  example: t('help.n.example')
                }}
              >
                <input
                  type="number"
                  className={inputClass}
                  placeholder="0-140"
                  {...register('n_soil', { valueAsNumber: true })}
                />
              </InputField>
              <InputField 
                label={t('form.label.phosphorus')}
                helpTooltip={{
                  title: t('help.p.title'),
                  description: t('help.p.desc'),
                  example: t('help.p.example')
                }}
              >
                <input
                  type="number"
                  className={inputClass}
                  placeholder="5-145"
                  {...register('p_soil', { valueAsNumber: true })}
                />
              </InputField>
              <InputField 
                label={t('form.label.potassium')}
                helpTooltip={{
                  title: t('help.k.title'),
                  description: t('help.k.desc'),
                  example: t('help.k.example')
                }}
              >
                <input
                  type="number"
                  className={inputClass}
                  placeholder="5-205"
                  {...register('k_soil', { valueAsNumber: true })}
                />
              </InputField>
              <InputField 
                label={t('form.label.ph')}
                helpTooltip={{
                  title: t('help.ph.title'),
                  description: t('help.ph.desc'),
                  example: t('help.ph.example')
                }}
              >
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
            title={t('form.section.climate')} 
            icon={<Thermometer className="h-5 w-5 text-rose-600" />}
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <InputField 
                label="Average Temperature" 
                hint="in Celsius (°C)"
                helpTooltip={{
                  title: "What's the temperature in your area?",
                  description: "Average temperature affects which crops will grow well.",
                  example: "Wheat needs 15-25°C, Rice needs 25-35°C."
                }}
              >
                <input
                  type="number"
                  className={inputClass}
                  placeholder="e.g. 28"
                  {...register('temperature', { valueAsNumber: true })}
                />
              </InputField>
              <InputField 
                label="Humidity" 
                hint="in percentage (%)"
                helpTooltip={{
                  title: "How humid is your area?",
                  description: "Humidity affects plant diseases and water needs.",
                  example: "Coastal areas: 70-90%, Dry areas: 30-50%"
                }}
              >
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
                <span className="font-semibold text-slate-800">{showAdvanced ? t('form.advanced.hide') : t('form.advanced.toggle')}</span>
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
                {t('form.submit.loading')}
              </>
            ) : (
              <>
                <Sparkles className="h-5 w-5" />
                {t('form.submit')}
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
