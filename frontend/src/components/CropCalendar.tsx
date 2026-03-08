import { CROP_CALENDARS } from '../lib/crop_calendar_data';
import type { ActivityType } from '../lib/crop_calendar_data';
import { cn } from '../lib/utils';
import { Info, Sprout } from 'lucide-react';

interface CropCalendarProps {
  cropName: string;
  season: string;
}

const MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

const ACTIVITY_CONFIG: Record<ActivityType, { color: string; bg: string; label: string; icon: string }> = {
  land_prep: { 
    color: 'text-amber-700', 
    bg: 'bg-amber-100', 
    label: 'Land Prep',
    icon: '🚜'
  },
  sowing: { 
    color: 'text-yellow-700', 
    bg: 'bg-yellow-100', 
    label: 'Sowing',
    icon: '🌱'
  },
  irrigation: { 
    color: 'text-blue-700', 
    bg: 'bg-blue-100', 
    label: 'Irrigation',
    icon: '💧'
  },
  fertilizer: { 
    color: 'text-emerald-700', 
    bg: 'bg-emerald-100', 
    label: 'Fertilizer',
    icon: '🧪'
  },
  pesticide: { 
    color: 'text-rose-700', 
    bg: 'bg-rose-100', 
    label: 'Pest Control',
    icon: '🛡️'
  },
  harvest: { 
    color: 'text-orange-700', 
    bg: 'bg-orange-100', 
    label: 'Harvest',
    icon: '🌾'
  },
};

export function CropCalendar({ cropName, season }: CropCalendarProps) {
  const cropKey = cropName.toLowerCase();
  let timeline = CROP_CALENDARS[cropKey]?.[season] || CROP_CALENDARS[cropKey]?.['Whole Year'];

  // Fallback for missing crops based on season
  if (!timeline) {
    if (season === 'Kharif') {
      timeline = {
        activities: [
          { type: 'land_prep', startMonth: 4, endMonth: 5 },
          { type: 'sowing', startMonth: 5, endMonth: 6 },
          { type: 'irrigation', startMonth: 6, endMonth: 8 },
          { type: 'fertilizer', startMonth: 6, endMonth: 7 },
          { type: 'pesticide', startMonth: 7, endMonth: 8 },
          { type: 'harvest', startMonth: 9, endMonth: 10 },
        ]
      };
    } else if (season === 'Rabi') {
      timeline = {
        activities: [
          { type: 'land_prep', startMonth: 9, endMonth: 10 },
          { type: 'sowing', startMonth: 10, endMonth: 11 },
          { type: 'irrigation', startMonth: 0, endMonth: 2 },
          { type: 'fertilizer', startMonth: 11, endMonth: 1 },
          { type: 'pesticide', startMonth: 1, endMonth: 2 },
          { type: 'harvest', startMonth: 2, endMonth: 3 },
        ]
      };
    } else {
      // General Whole Year or Summer fallback
      timeline = {
        activities: [
          { type: 'land_prep', startMonth: 1, endMonth: 2 },
          { type: 'sowing', startMonth: 2, endMonth: 3 },
          { type: 'irrigation', startMonth: 3, endMonth: 5 },
          { type: 'fertilizer', startMonth: 3, endMonth: 4 },
          { type: 'pesticide', startMonth: 4, endMonth: 5 },
          { type: 'harvest', startMonth: 5, endMonth: 6 },
        ]
      };
    }
  }

  const isFallback = !CROP_CALENDARS[cropKey];
  const currentMonth = new Date().getMonth();

  // Get active months for each activity
  const getActivityMonths = (startMonth: number, endMonth: number) => {
    const months: number[] = [];
    if (endMonth >= startMonth) {
      for (let i = startMonth; i <= endMonth; i++) months.push(i);
    } else {
      for (let i = startMonth; i < 12; i++) months.push(i);
      for (let i = 0; i <= endMonth; i++) months.push(i);
    }
    return months;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-100 rounded-lg">
            <Sprout className="h-5 w-5 text-emerald-600" />
          </div>
          <div>
            <h3 className="font-bold text-foreground capitalize">{cropName} Calendar</h3>
            <p className="text-xs text-muted-foreground">{season} season schedule</p>
          </div>
        </div>
        <span className="px-3 py-1 bg-slate-100 rounded-full text-xs font-medium text-slate-600">
          {isFallback ? 'Estimate' : 'Exact Data'}
        </span>
        <span className="px-3 py-1 bg-slate-100 rounded-full text-xs font-medium text-slate-600">
          {MONTHS[currentMonth]} (Current)
        </span>
      </div>

      {/* Calendar Grid */}
      <div className="bg-white rounded-2xl border overflow-hidden">
        {/* Month Headers */}
        <div className="grid grid-cols-12 bg-slate-50 border-b">
          {MONTHS.map((month, idx) => (
            <div 
              key={month}
              className={cn(
                "py-2 text-center text-xs font-medium border-r last:border-r-0",
                idx === currentMonth 
                  ? "bg-emerald-100 text-emerald-700 font-bold" 
                  : "text-slate-500"
              )}
            >
              {month}
            </div>
          ))}
        </div>

        {/* Activity Rows */}
        <div className="divide-y">
          {(['land_prep', 'sowing', 'irrigation', 'fertilizer', 'pesticide', 'harvest'] as ActivityType[]).map((type) => {
            const activity = timeline.activities.find(a => a.type === type);
            if (!activity) return null;

            const config = ACTIVITY_CONFIG[type];
            const activeMonths = getActivityMonths(activity.startMonth, activity.endMonth);

            return (
              <div key={type} className="grid grid-cols-12">
                {/* Activity Label */}
                <div className="col-span-12 sm:col-span-2 p-3 bg-slate-50/50 border-r flex items-center gap-2">
                  <span className="text-lg">{config.icon}</span>
                  <span className="text-xs font-medium text-slate-700">{config.label}</span>
                </div>

                {/* Month Cells */}
                <div className="col-span-12 sm:col-span-10 grid grid-cols-12">
                  {MONTHS.map((_, monthIdx) => {
                    const isActive = activeMonths.includes(monthIdx);
                    const isCurrentMonth = monthIdx === currentMonth;

                    return (
                      <div
                        key={monthIdx}
                        className={cn(
                          "h-10 border-r last:border-r-0 flex items-center justify-center transition-all",
                          isActive && config.bg,
                          isCurrentMonth && !isActive && "bg-slate-100",
                          isActive && isCurrentMonth && "ring-2 ring-inset ring-emerald-400"
                        )}
                      >
                        {isActive && (
                          <div className={cn("w-2 h-2 rounded-full", config.bg.replace('bg-', 'bg-').replace('100', '500'))} />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-2">
        {(Object.entries(ACTIVITY_CONFIG) as [ActivityType, typeof ACTIVITY_CONFIG['land_prep']][]).map(([type, config]) => (
          <div key={type} className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs", config.bg, config.color)}>
            <span>{config.icon}</span>
            <span className="font-medium">{config.label}</span>
          </div>
        ))}
      </div>

      {/* Info Note */}
      <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-xl border border-blue-100">
        <Info className="h-5 w-5 text-blue-500 mt-0.5 shrink-0" />
        <p className="text-sm text-blue-700">
          This calendar shows ideal timelines for optimal yield. Adjust based on local monsoon patterns and specific variety duration. Current month is highlighted.
        </p>
      </div>
    </div>
  );
}
