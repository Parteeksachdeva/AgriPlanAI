import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ExpandableSectionProps {
  title: string
  subtitle?: string
  icon?: React.ReactNode
  children: React.ReactNode
  defaultExpanded?: boolean
  variant?: 'default' | 'highlighted' | 'compact'
}

export function ExpandableSection({ 
  title, 
  subtitle, 
  icon, 
  children, 
  defaultExpanded = false,
  variant = 'default'
}: ExpandableSectionProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded)

  const variants = {
    default: 'bg-white border',
    highlighted: 'bg-gradient-to-r from-emerald-50 to-green-50 border border-emerald-200',
    compact: 'bg-slate-50 border border-slate-200'
  }

  return (
    <div className={cn("rounded-2xl overflow-hidden", variants[variant])}>
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-5 py-4 flex items-center justify-between text-left hover:bg-black/5 transition-colors"
      >
        <div className="flex items-center gap-3">
          {icon && <div className="text-emerald-600">{icon}</div>}
          <div>
            <h4 className={cn(
              "font-semibold",
              variant === 'highlighted' ? 'text-emerald-900' : 'text-slate-800'
            )}>
              {title}
            </h4>
            {subtitle && (
              <p className={cn(
                "text-xs mt-0.5",
                variant === 'highlighted' ? 'text-emerald-600' : 'text-slate-500'
              )}>
                {subtitle}
              </p>
            )}
          </div>
        </div>
        <div className={cn(
          "p-1.5 rounded-full transition-all",
          isExpanded ? 'bg-emerald-100 rotate-180' : 'bg-slate-100'
        )}>
          <ChevronDown className={cn(
            "h-4 w-4 transition-colors",
            isExpanded ? 'text-emerald-600' : 'text-slate-500'
          )} />
        </div>
      </button>
      
      {isExpanded && (
        <div className="px-5 pb-5 border-t">
          <div className="pt-4">
            {children}
          </div>
        </div>
      )}
    </div>
  )
}

// Simple card for showing key info at a glance
interface InfoCardProps {
  label: string
  value: string
  subtext?: string
  status?: 'good' | 'warning' | 'neutral'
}

export function InfoCard({ label, value, subtext, status = 'neutral' }: InfoCardProps) {
  const statusColors = {
    good: 'bg-emerald-50 border-emerald-200 text-emerald-700',
    warning: 'bg-amber-50 border-amber-200 text-amber-700',
    neutral: 'bg-slate-50 border-slate-200 text-slate-700'
  }

  return (
    <div className={cn("rounded-xl p-4 border", statusColors[status])}>
      <p className="text-xs opacity-70 mb-1">{label}</p>
      <p className="text-lg font-bold">{value}</p>
      {subtext && <p className="text-xs opacity-60 mt-1">{subtext}</p>}
    </div>
  )
}

// Quick summary strip that always shows
interface QuickSummaryProps {
  items: Array<{
    label: string
    value: string
    icon?: React.ReactNode
  }>
}

export function QuickSummary({ items }: QuickSummaryProps) {
  return (
    <div className="flex flex-wrap gap-3">
      {items.map((item, idx) => (
        <div key={idx} className="flex items-center gap-2 bg-white rounded-lg px-3 py-2 border shadow-sm">
          {item.icon && <span className="text-emerald-500">{item.icon}</span>}
          <div>
            <p className="text-[10px] text-slate-500 uppercase tracking-wide">{item.label}</p>
            <p className="text-sm font-semibold text-slate-800">{item.value}</p>
          </div>
        </div>
      ))}
    </div>
  )
}
