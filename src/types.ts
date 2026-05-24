export interface WaterLog {
  id: string;
  amount: number; // in milliliters (ml)
  timestamp: string; // ISO string
  containerType: 'cup' | 'glass' | 'bottle' | 'flask' | 'custom';
}

export type ClimateType = 'cold' | 'temperate' | 'hot';

export interface HydrationGoalParams {
  weightKg: number;
  activityMinutes: number;
  climate: ClimateType;
  coffeeCups: number;
  isWorkoutDay: boolean;
}

export interface UserSettings {
  dailyTargetMl: number;
  reminderIntervalMinutes: number;
  remindersEnabled: boolean;
  reminderSoundEnabled: boolean;
  reminderStartTime: string; // "HH:MM" 24h format
  reminderEndTime: string; // "HH:MM" 24h format
  unit: 'ml' | 'oz';
  weightKg: number;
  activityMinutes: number;
  climate: ClimateType;
  coffeeCups: number;
  isWorkoutDay: boolean;
}

export interface HistoryRecord {
  date: string; // YYYY-MM-DD
  target: number; // target for that day in ml
  logs: WaterLog[];
}

export interface InAppNotification {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  type: 'reminder' | 'milestone' | 'achievement';
  read: boolean;
}
