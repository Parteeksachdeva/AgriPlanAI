import { useState } from 'react'
import { HelpCircle, X } from 'lucide-react'

interface HelpTooltipProps {
  title: string
  description: string
  example?: string
}

export function HelpTooltip({ title, description, example }: HelpTooltipProps) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="relative inline-block">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="ml-1.5 text-slate-400 hover:text-emerald-500 transition-colors"
      >
        <HelpCircle className="h-4 w-4" />
      </button>

      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute z-50 left-0 top-full mt-2 w-72 bg-white rounded-xl shadow-xl border p-4 animate-in fade-in slide-in-from-top-2">
            <div className="flex items-start justify-between mb-2">
              <h4 className="font-semibold text-slate-900 text-sm">{title}</h4>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <p className="text-sm text-slate-600 mb-2">{description}</p>
            {example && (
              <div className="bg-emerald-50 rounded-lg p-2 text-xs text-emerald-700">
                <span className="font-medium">Example:</span> {example}
              </div>
            )}
            <div className="absolute -top-2 left-4 w-4 h-4 bg-white border-t border-l rotate-45" />
          </div>
        </>
      )}
    </div>
  )
}
