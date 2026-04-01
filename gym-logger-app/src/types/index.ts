// ─── Workout Types ───────────────────────────────────────────

export interface WorkoutEntry {
  id: string;
  movementName: string;
  reps: number;
  weight: number;
  unit: 'kg' | 'lbs';
  notes?: string;
  createdAt: number;
}

export interface Workout {
  id: string;
  date: string; // YYYY-MM-DD
  entries: WorkoutEntry[];
  createdAt: number;
  completed: boolean;
}

// ─── Movement Types ──────────────────────────────────────────

export type MovementCategory =
  | 'Legs'
  | 'Back'
  | 'Chest'
  | 'Shoulders'
  | 'Arms'
  | 'Core'
  | 'Cardio'
  | 'Other';

export interface Movement {
  id: string;
  name: string;
  category: MovementCategory;
  isCustom: boolean;
}

// ─── Template Types ──────────────────────────────────────────

export interface TemplateEntry {
  movementName: string;
  reps: number;
  weight: number;
  unit: 'kg' | 'lbs';
}

export interface Template {
  id: string;
  name: string;
  entries: TemplateEntry[];
  createdAt: number;
  order: number;
}

// ─── Diet Types ──────────────────────────────────────────────

export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

export interface Food {
  id: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  quantity: number;
  servingUnit: string; // 'g', 'ml', 'serving', 'piece'
}

export interface Meal {
  id: string;
  date: string; // YYYY-MM-DD
  mealType: MealType;
  foods: Food[];
  createdAt: number;
}

// ─── Settings Types ──────────────────────────────────────────

export interface UserSettings {
  unit: 'kg' | 'lbs';
  theme: 'system' | 'light' | 'dark';
  calorieTarget: number;
  proteinTarget: number;
  carbTarget: number;
  fatTarget: number;
}

export const DEFAULT_SETTINGS: UserSettings = {
  unit: 'kg',
  theme: 'system',
  calorieTarget: 2000,
  proteinTarget: 150,
  carbTarget: 250,
  fatTarget: 65,
};
