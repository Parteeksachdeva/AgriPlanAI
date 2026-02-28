import { CROP_CALENDARS } from '../lib/crop_calendar_data';
import type { ActivityType } from '../lib/crop_calendar_data';
import { cn } from '../lib/utils';
import { Info } from 'lucide-react';

interface CropCalendarProps {
  cropName: string;
  season: string;
}

const MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

const ACTIVITY_COLORS: Record<ActivityType, string> = {
  land_prep: 'bg-[#8B4513]',  // Brown
  sowing: 'bg-[#FFD700]',     // Yellow
  irrigation: 'bg-[#1E90FF]',  // Blue
  fertilizer: 'bg-[#32CD32]',  // Green
  pesticide: 'bg-[#FF4500]',   // Red
  harvest: 'bg-[#FFA500]',      // Orange
};

const ACTIVITY_LABELS: Record<ActivityType, string> = {
  land_prep: 'Land Preparation',
  sowing: 'Sowing/Planting',
  irrigation: 'Irrigation',
  fertilizer: 'Fertilizer',
  pesticide: 'Pest Watch',
  harvest: 'Harvesting',
};

export function CropCalendar({ cropName, season }: CropCalendarProps) {
  const cropKey = cropName.toLowerCase();
  const timeline = CROP_CALENDARS[cropKey]?.[season] || CROP_CALENDARS[cropKey]?.['Whole Year'];

  const currentMonth = new Date().getMonth();

  if (!timeline) {
    return (
      <div className="rounded-xl border border-dashed p-6 text-center">
        <p className="text-sm text-muted-foreground italic">No detailed calendar data available for {cropName} ({season}).</p>
      </div>
    );
  }

  const getDayPosition = (monthIdx: number) => {
    return (monthIdx / 12) * 100;
  };

  const getActivityWidth = (start: number, end: number) => {
    if (end >= start) {
      return ((end - start + 1) / 12) * 100;
    } else {
      // Wraps around the year
      return ((12 - start + end + 1) / 12) * 100;
    }
  };

  return (
    <div className="rounded-2xl border bg-background p-6 shadow-sm overflow-hidden">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
          Crop Activity Calendar: <span className="capitalize">{cropName}</span>
        </h3>
        <span className="text-xs font-semibold px-2 py-1 bg-primary/10 text-primary rounded-md uppercase tracking-wider">
          {season} Cycle
        </span>
      </div>

      <div className="relative pt-8 pb-4">
        {/* Month Labels */}
        <div className="flex w-full mb-4 border-b border-muted">
          {MONTHS.map((month, idx) => (
            <div 
              key={month} 
              className={cn(
                "flex-1 text-[10px] font-bold text-center pb-2 uppercase tracking-tighter transition-colors",
                idx === currentMonth ? "text-primary border-b-2 border-primary" : "text-muted-foreground"
              )}
            >
              {month}
            </div>
          ))}
        </div>

        {/* Calendar Grid & Activity Bands */}
        <div className="relative h-48 bg-muted/10 rounded-lg overflow-hidden border border-muted/50">
          {/* Vertical Grid Lines */}
          <div className="absolute inset-0 flex">
            {MONTHS.map((_, idx) => (
              <div key={idx} className="flex-1 border-r border-muted/20 last:border-0" />
            ))}
          </div>

          {/* Current Month Highlight */}
          <div 
            className="absolute top-0 bottom-0 bg-primary/5 border-x border-primary/20 z-0 pointer-events-none"
            style={{ 
              left: `${(currentMonth / 12) * 100}%`,
              width: `${(1 / 12) * 100}%`
            }}
          />

          {/* Activity Bands */}
          <div className="absolute inset-x-0 top-0 bottom-0 py-2 space-y-1 z-10">
            {(['land_prep', 'sowing', 'irrigation', 'fertilizer', 'pesticide', 'harvest'] as ActivityType[]).map((type) => {
              const activity = timeline.activities.find(a => a.type === type);
              if (!activity) return null;

              const left = getDayPosition(activity.startMonth);
              const width = getActivityWidth(activity.startMonth, activity.endMonth);

              // Handle wrap around for the visual band
              if (activity.endMonth < activity.startMonth) {
                const firstPartWidth = ((12 - activity.startMonth) / 12) * 100;
                const secondPartWidth = ((activity.endMonth + 1) / 12) * 100;

                return (
                  <div key={type} className="relative h-6 group">
                    <div 
                      className={cn("absolute h-4 top-1 rounded-r-md opacity-80 group-hover:opacity-100 transition-opacity", ACTIVITY_COLORS[type])}
                      style={{ left: `${left}%`, width: `${firstPartWidth}%` }}
                    />
                    <div 
                      className={cn("absolute h-4 top-1 rounded-l-md opacity-80 group-hover:opacity-100 transition-opacity", ACTIVITY_COLORS[type])}
                      style={{ left: '0%', width: `${secondPartWidth}%` }}
                    />
                    <div className="absolute inset-y-0 flex items-center px-2 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity z-20">
                      <span className="text-[9px] font-bold text-white drop-shadow-sm whitespace-nowrap">
                        {ACTIVITY_LABELS[type]}
                      </span>
                    </div>
                  </div>
                );
              }

              return (
                <div key={type} className="relative h-6 group">
                  <div 
                    className={cn("absolute h-4 top-1 rounded-md opacity-80 group-hover:opacity-100 transition-opacity", ACTIVITY_COLORS[type])}
                    style={{ left: `${left}%`, width: `${width}%` }}
                  />
                  <div className="absolute inset-y-0 flex items-center px-2 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity z-20" style={{ left: `${left}%` }}>
                    <span className="text-[9px] font-bold text-white drop-shadow-sm whitespace-nowrap">
                      {ACTIVITY_LABELS[type]}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="mt-6 flex flex-wrap gap-x-4 gap-y-2">
        {(Object.entries(ACTIVITY_LABELS) as [ActivityType, string][]).map(([type, label]) => (
          <div key={type} className="flex items-center gap-1.5">
            <div className={cn("w-2.5 h-2.5 rounded-sm", ACTIVITY_COLORS[type])} />
            <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-tight">{label}</span>
          </div>
        ))}
      </div>

      <div className="mt-6 p-3 bg-blue-50/50 border border-blue-100 rounded-lg flex gap-3 items-start">
        <Info className="h-4 w-4 text-blue-500 mt-0.5" />
        <p className="text-[11px] text-blue-700 leading-relaxed italic">
          This calendar shows ideal timelines for a bumper harvest. Adjust based on local monsoon onset and specific variety duration. Current month is highlighted.
        </p>
      </div>
    </div>
  );
}
