import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import { useState } from 'react'
import type { PredictionFormData, PredictionResult } from '@/types'
import { submitPrediction } from '@/api'

const SOIL_OPTIONS = [
  'Alluvial',
  'Black',
  'Red',
  'Laterite',
  'Sandy',
  'Clay',
  'Loam',
]

const SEASON_OPTIONS = ['Kharif', 'Rabi', 'Zaid', 'Summer', 'Winter', 'Monsoon']

const CROP_OPTIONS = [
  'Wheat',
  'Rice',
  'Maize',
  'Cotton',
  'Sugarcane',
  'Pulses',
  'Oilseeds',
  'Barley',
  'Millets',
]

export function FormScreen() {
  const navigate = useNavigate()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { register, handleSubmit } = useForm<PredictionFormData>({
    defaultValues: {
      rainfall: 800,
      averageTemperature: 28,
      soilType: 'Alluvial',
      irrigation: 'No',
      season: 'Kharif',
      cropType: 'Rice',
      historicalYield: 3500,
    },
  })

  async function onSubmit(data: PredictionFormData) {
    setIsSubmitting(true)
    try {
      const result: PredictionResult = await submitPrediction({
        ...data,
        rainfall: Number(data.rainfall),
        averageTemperature: Number(data.averageTemperature),
        historicalYield: Number(data.historicalYield),
      })
      navigate('/result', { state: { result, formData: data } })
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
          Enter farm and weather details. Our AI model will predict yield and suggest actions.
        </p>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label
                htmlFor="rainfall"
                className="text-sm font-medium leading-none text-foreground"
              >
                Rainfall (mm)
              </label>
              <input
                id="rainfall"
                type="number"
                step="any"
                className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                placeholder="e.g. 800"
                {...register('rainfall', { valueAsNumber: true })}
              />
            </div>

            <div className="space-y-2">
              <label
                htmlFor="averageTemperature"
                className="text-sm font-medium leading-none text-foreground"
              >
                Average temperature (°C)
              </label>
              <input
                id="averageTemperature"
                type="number"
                step="any"
                className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                placeholder="e.g. 28"
                {...register('averageTemperature', { valueAsNumber: true })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label
              htmlFor="soilType"
              className="text-sm font-medium leading-none text-foreground"
            >
              Soil type
            </label>
            <select
              id="soilType"
              className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              {...register('soilType')}
            >
              {SOIL_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium leading-none text-foreground">
              Irrigation
            </label>
            <div className="flex gap-6">
              <label className="flex cursor-pointer items-center gap-2">
                <input
                  type="radio"
                  value="Yes"
                  className="h-4 w-4 border-input text-primary focus:ring-ring"
                  {...register('irrigation')}
                />
                <span className="text-sm">Yes</span>
              </label>
              <label className="flex cursor-pointer items-center gap-2">
                <input
                  type="radio"
                  value="No"
                  className="h-4 w-4 border-input text-primary focus:ring-ring"
                  {...register('irrigation')}
                />
                <span className="text-sm">No</span>
              </label>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label
                htmlFor="season"
                className="text-sm font-medium leading-none text-foreground"
              >
                Season
              </label>
              <select
                id="season"
                className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                {...register('season')}
              >
                {SEASON_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label
                htmlFor="cropType"
                className="text-sm font-medium leading-none text-foreground"
              >
                Crop type
              </label>
              <select
                id="cropType"
                className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                {...register('cropType')}
              >
                {CROP_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <label
              htmlFor="historicalYield"
              className="text-sm font-medium leading-none text-foreground"
            >
              Historical yield (kg/ha)
            </label>
            <input
              id="historicalYield"
              type="number"
              step="any"
              className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 sm:max-w-xs"
              placeholder="e.g. 3500"
              {...register('historicalYield', { valueAsNumber: true })}
            />
          </div>

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
