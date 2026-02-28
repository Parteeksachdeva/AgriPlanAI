export type ActivityType = 'land_prep' | 'sowing' | 'irrigation' | 'fertilizer' | 'pesticide' | 'harvest';

export interface CalendarActivity {
  type: ActivityType;
  startMonth: number; // 0-11
  endMonth: number;   // 0-11
}

export interface CropTimeline {
  activities: CalendarActivity[];
}

export const CROP_CALENDARS: Record<string, Record<string, CropTimeline>> = {
  rice: {
    Kharif: {
      activities: [
        { type: 'land_prep', startMonth: 4, endMonth: 5 }, // May - June
        { type: 'sowing', startMonth: 5, endMonth: 6 },    // June - July
        { type: 'irrigation', startMonth: 6, endMonth: 8 }, // July - Sept
        { type: 'fertilizer', startMonth: 7, endMonth: 8 }, // Aug - Sept
        { type: 'pesticide', startMonth: 7, endMonth: 9 },  // Aug - Oct
        { type: 'harvest', startMonth: 9, endMonth: 10 },   // Oct - Nov
      ],
    },
  },
  wheat: {
    Rabi: {
      activities: [
        { type: 'land_prep', startMonth: 9, endMonth: 10 }, // Oct - Nov
        { type: 'sowing', startMonth: 10, endMonth: 11 },   // Nov - Dec
        { type: 'irrigation', startMonth: 0, endMonth: 2 },  // Jan - March
        { type: 'fertilizer', startMonth: 11, endMonth: 1 }, // Dec - Feb
        { type: 'pesticide', startMonth: 1, endMonth: 2 },   // Feb - March
        { type: 'harvest', startMonth: 2, endMonth: 3 },    // March - April
      ],
    },
  },
  maize: {
    Kharif: {
      activities: [
        { type: 'land_prep', startMonth: 4, endMonth: 5 },
        { type: 'sowing', startMonth: 5, endMonth: 6 },
        { type: 'irrigation', startMonth: 6, endMonth: 7 },
        { type: 'fertilizer', startMonth: 6, endMonth: 8 },
        { type: 'pesticide', startMonth: 7, endMonth: 8 },
        { type: 'harvest', startMonth: 8, endMonth: 9 },
      ],
    },
    Rabi: {
      activities: [
        { type: 'land_prep', startMonth: 9, endMonth: 10 },
        { type: 'sowing', startMonth: 10, endMonth: 11 },
        { type: 'irrigation', startMonth: 11, endMonth: 1 },
        { type: 'fertilizer', startMonth: 0, endMonth: 1 },
        { type: 'pesticide', startMonth: 1, endMonth: 2 },
        { type: 'harvest', startMonth: 2, endMonth: 3 },
      ],
    },
  },
  cotton: {
    Kharif: {
      activities: [
        { type: 'land_prep', startMonth: 3, endMonth: 4 },
        { type: 'sowing', startMonth: 4, endMonth: 5 },
        { type: 'irrigation', startMonth: 5, endMonth: 9 },
        { type: 'fertilizer', startMonth: 6, endMonth: 8 },
        { type: 'pesticide', startMonth: 5, endMonth: 10 },
        { type: 'harvest', startMonth: 9, endMonth: 11 },
      ],
    },
  },
  mustard: {
    Rabi: {
      activities: [
        { type: 'land_prep', startMonth: 8, endMonth: 9 },
        { type: 'sowing', startMonth: 9, endMonth: 10 },
        { type: 'irrigation', startMonth: 10, endMonth: 0 },
        { type: 'fertilizer', startMonth: 10, endMonth: 11 },
        { type: 'pesticide', startMonth: 11, endMonth: 1 },
        { type: 'harvest', startMonth: 1, endMonth: 2 },
      ],
    },
  },
  sugarcane: {
    'Whole Year': {
      activities: [
        { type: 'land_prep', startMonth: 0, endMonth: 1 },
        { type: 'sowing', startMonth: 1, endMonth: 2 },
        { type: 'irrigation', startMonth: 2, endMonth: 11 },
        { type: 'fertilizer', startMonth: 3, endMonth: 8 },
        { type: 'pesticide', startMonth: 4, endMonth: 9 },
        { type: 'harvest', startMonth: 11, endMonth: 1 },
      ],
    },
  },
  banana: {
    'Whole Year': {
      activities: [
        { type: 'land_prep', startMonth: 5, endMonth: 6 },
        { type: 'sowing', startMonth: 6, endMonth: 7 },
        { type: 'irrigation', startMonth: 7, endMonth: 4 },
        { type: 'fertilizer', startMonth: 8, endMonth: 2 },
        { type: 'pesticide', startMonth: 9, endMonth: 3 },
        { type: 'harvest', startMonth: 4, endMonth: 6 },
      ],
    },
  },
};
