export type RiskLevel = 'low' | 'medium' | 'high';

export interface CropRiskMetadata {
  volatility: 0 | 1 | 2; // 0: Low, 1: Medium, 2: High
  predictability: 0 | 1 | 2; // 0: High, 1: Medium, 2: Low
  water_sensitive: boolean;
}

export const CROP_RISK_META: Record<string, CropRiskMetadata> = {
  rice: { volatility: 0, predictability: 0, water_sensitive: true },
  wheat: { volatility: 0, predictability: 0, water_sensitive: false },
  maize: { volatility: 0, predictability: 1, water_sensitive: false },
  chickpea: { volatility: 1, predictability: 1, water_sensitive: false },
  kidneybeans: { volatility: 1, predictability: 1, water_sensitive: false },
  pigeonpeas: { volatility: 1, predictability: 1, water_sensitive: false },
  mothbeans: { volatility: 0, predictability: 0, water_sensitive: false },
  mungbean: { volatility: 1, predictability: 1, water_sensitive: false },
  blackgram: { volatility: 1, predictability: 1, water_sensitive: false },
  lentil: { volatility: 1, predictability: 1, water_sensitive: false },
  pomegranate: { volatility: 2, predictability: 1, water_sensitive: false },
  banana: { volatility: 1, predictability: 1, water_sensitive: true },
  mango: { volatility: 2, predictability: 2, water_sensitive: false },
  grapes: { volatility: 2, predictability: 2, water_sensitive: true },
  watermelon: { volatility: 1, predictability: 1, water_sensitive: true },
  muskmelon: { volatility: 1, predictability: 1, water_sensitive: true },
  apple: { volatility: 2, predictability: 2, water_sensitive: false },
  orange: { volatility: 1, predictability: 1, water_sensitive: false },
  papaya: { volatility: 1, predictability: 1, water_sensitive: false },
  coconut: { volatility: 1, predictability: 0, water_sensitive: true },
  cotton: { volatility: 1, predictability: 1, water_sensitive: false },
  jute: { volatility: 1, predictability: 0, water_sensitive: true },
  coffee: { volatility: 2, predictability: 2, water_sensitive: true },
  tea: { volatility: 2, predictability: 2, water_sensitive: true },
};

export const DEFAULT_RISK_META: CropRiskMetadata = {
  volatility: 1,
  predictability: 1,
  water_sensitive: false,
};

export const CROP_MIN_RAINFALL: Record<string, number> = {
  rice: 1000,
  maize: 500,
  chickpea: 400,
  kidneybeans: 600,
  pigeonpeas: 600,
  mothbeans: 200,
  mungbean: 400,
  blackgram: 400,
  lentil: 400,
  pomegranate: 500,
  banana: 1200,
  mango: 750,
  grapes: 500,
  watermelon: 400,
  muskmelon: 400,
  apple: 1000,
  orange: 1000,
  papaya: 1000,
  coconut: 1500,
  cotton: 500,
  jute: 1500,
  coffee: 1500,
  tea: 1500,
  wheat: 400,
};
