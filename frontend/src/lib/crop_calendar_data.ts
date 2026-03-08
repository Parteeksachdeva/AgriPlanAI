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
  pomegranate: {
    'Whole Year': {
      activities: [
        { type: 'land_prep', startMonth: 5, endMonth: 6 },
        { type: 'sowing', startMonth: 6, endMonth: 7 },
        { type: 'irrigation', startMonth: 7, endMonth: 3 },
        { type: 'fertilizer', startMonth: 8, endMonth: 10 },
        { type: 'pesticide', startMonth: 9, endMonth: 11 },
        { type: 'harvest', startMonth: 11, endMonth: 2 },
      ],
    },
  },
  mango: {
    'Whole Year': {
      activities: [
        { type: 'land_prep', startMonth: 5, endMonth: 6 },
        { type: 'sowing', startMonth: 6, endMonth: 7 },
        { type: 'irrigation', startMonth: 1, endMonth: 5 },
        { type: 'fertilizer', startMonth: 6, endMonth: 8 },
        { type: 'pesticide', startMonth: 0, endMonth: 3 },
        { type: 'harvest', startMonth: 3, endMonth: 5 },
      ],
    },
  },
  grapes: {
    'Whole Year': {
      activities: [
        { type: 'land_prep', startMonth: 9, endMonth: 10 },
        { type: 'sowing', startMonth: 10, endMonth: 11 },
        { type: 'irrigation', startMonth: 1, endMonth: 3 },
        { type: 'fertilizer', startMonth: 10, endMonth: 0 },
        { type: 'pesticide', startMonth: 0, endMonth: 2 },
        { type: 'harvest', startMonth: 1, endMonth: 3 },
      ],
    },
  },
  orange: {
    'Whole Year': {
      activities: [
        { type: 'land_prep', startMonth: 5, endMonth: 6 },
        { type: 'sowing', startMonth: 6, endMonth: 7 },
        { type: 'irrigation', startMonth: 1, endMonth: 11 },
        { type: 'fertilizer', startMonth: 6, endMonth: 8 },
        { type: 'pesticide', startMonth: 2, endMonth: 4 },
        { type: 'harvest', startMonth: 10, endMonth: 1 },
      ],
    },
  },
  papaya: {
    'Whole Year': {
      activities: [
        { type: 'land_prep', startMonth: 1, endMonth: 2 },
        { type: 'sowing', startMonth: 2, endMonth: 3 },
        { type: 'irrigation', startMonth: 3, endMonth: 1 },
        { type: 'fertilizer', startMonth: 4, endMonth: 10 },
        { type: 'pesticide', startMonth: 5, endMonth: 11 },
        { type: 'harvest', startMonth: 11, endMonth: 3 },
      ],
    },
  },
  apple: {
    'Whole Year': {
      activities: [
        { type: 'land_prep', startMonth: 11, endMonth: 0 },
        { type: 'sowing', startMonth: 0, endMonth: 1 },
        { type: 'irrigation', startMonth: 3, endMonth: 5 },
        { type: 'fertilizer', startMonth: 0, endMonth: 2 },
        { type: 'pesticide', startMonth: 3, endMonth: 5 },
        { type: 'harvest', startMonth: 7, endMonth: 9 },
      ],
    },
  },
  coconut: {
    'Whole Year': {
      activities: [
        { type: 'land_prep', startMonth: 4, endMonth: 5 },
        { type: 'sowing', startMonth: 5, endMonth: 6 },
        { type: 'irrigation', startMonth: 0, endMonth: 11 },
        { type: 'fertilizer', startMonth: 4, endMonth: 9 },
        { type: 'pesticide', startMonth: 5, endMonth: 10 },
        { type: 'harvest', startMonth: 0, endMonth: 11 },
      ],
    },
  },
  chickpea: {
    Rabi: {
      activities: [
        { type: 'land_prep', startMonth: 8, endMonth: 9 },
        { type: 'sowing', startMonth: 9, endMonth: 10 },
        { type: 'irrigation', startMonth: 11, endMonth: 0 },
        { type: 'fertilizer', startMonth: 9, endMonth: 10 },
        { type: 'pesticide', startMonth: 11, endMonth: 1 },
        { type: 'harvest', startMonth: 1, endMonth: 2 },
      ],
    },
  },
  lentil: {
    Rabi: {
      activities: [
        { type: 'land_prep', startMonth: 9, endMonth: 10 },
        { type: 'sowing', startMonth: 10, endMonth: 11 },
        { type: 'irrigation', startMonth: 0, endMonth: 1 },
        { type: 'fertilizer', startMonth: 10, endMonth: 11 },
        { type: 'pesticide', startMonth: 1, endMonth: 2 },
        { type: 'harvest', startMonth: 2, endMonth: 3 },
      ],
    },
  },
  blackgram: {
    Kharif: {
      activities: [
        { type: 'land_prep', startMonth: 5, endMonth: 6 },
        { type: 'sowing', startMonth: 6, endMonth: 7 },
        { type: 'irrigation', startMonth: 7, endMonth: 8 },
        { type: 'fertilizer', startMonth: 6, endMonth: 7 },
        { type: 'pesticide', startMonth: 7, endMonth: 8 },
        { type: 'harvest', startMonth: 8, endMonth: 9 },
      ],
    },
  },
  mungbean: {
    Kharif: {
      activities: [
        { type: 'land_prep', startMonth: 5, endMonth: 6 },
        { type: 'sowing', startMonth: 6, endMonth: 7 },
        { type: 'irrigation', startMonth: 7, endMonth: 8 },
        { type: 'fertilizer', startMonth: 6, endMonth: 7 },
        { type: 'pesticide', startMonth: 7, endMonth: 8 },
        { type: 'harvest', startMonth: 8, endMonth: 9 },
      ],
    },
  },
  pigeonpeas: {
    Kharif: {
      activities: [
        { type: 'land_prep', startMonth: 4, endMonth: 5 },
        { type: 'sowing', startMonth: 5, endMonth: 6 },
        { type: 'irrigation', startMonth: 6, endMonth: 9 },
        { type: 'fertilizer', startMonth: 5, endMonth: 7 },
        { type: 'pesticide', startMonth: 7, endMonth: 10 },
        { type: 'harvest', startMonth: 10, endMonth: 0 },
      ],
    },
  },
  jute: {
    Kharif: {
      activities: [
        { type: 'land_prep', startMonth: 2, endMonth: 3 },
        { type: 'sowing', startMonth: 3, endMonth: 4 },
        { type: 'irrigation', startMonth: 4, endMonth: 6 },
        { type: 'fertilizer', startMonth: 4, endMonth: 5 },
        { type: 'pesticide', startMonth: 5, endMonth: 7 },
        { type: 'harvest', startMonth: 7, endMonth: 8 },
      ],
    },
  },
  coffee: {
    'Whole Year': {
      activities: [
        { type: 'land_prep', startMonth: 4, endMonth: 5 },
        { type: 'sowing', startMonth: 5, endMonth: 6 },
        { type: 'irrigation', startMonth: 11, endMonth: 4 },
        { type: 'fertilizer', startMonth: 4, endMonth: 9 },
        { type: 'pesticide', startMonth: 5, endMonth: 10 },
        { type: 'harvest', startMonth: 10, endMonth: 0 },
      ],
    },
  },
};
