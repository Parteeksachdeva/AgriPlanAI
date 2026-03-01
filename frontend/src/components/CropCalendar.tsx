import { CROP_CALENDARS } from '../lib/crop_calendar_data';
import type { ActivityType } from '../lib/crop_calendar_data';
import { cn } from '../lib/utils';
import { CalendarDays, Info, Sprout } from 'lucide-react';

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
  const timeline = CROP_CALENDARS[cropKey]?.[season] || CROP_CALENDARS[cropKey]?.['Whole Year'];
  const currentMonth = new Date().getMonth();

  if (!timeline) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <CalendarDays className="h-8 w-8 text-slate-400" />
        </div>
        <h3 className="text-lg font-semibold text-foreground mb-2">Calendar Coming Soon</h3>
        <p className="text-muted-foreground text-sm">
          Detailed calendar for {cropName} will be available shortly.
        </p>
      </div>
    );
  }

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
