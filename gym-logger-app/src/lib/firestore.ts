import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  where,
  writeBatch,
} from 'firebase/firestore';
import { db } from './firebase';
import type {
  Workout,
  WorkoutEntry,
  Movement,
  Template,
  TemplateEntry,
  UserSettings,
  Meal,
  Food,
  DEFAULT_SETTINGS,
} from '@/types';
import { DEFAULT_SETTINGS as DEFAULTS } from '@/types';

// ─── Helpers ─────────────────────────────────────────────────

function userCol(userId: string, col: string) {
  return collection(db, 'users', userId, col);
}

function userDoc(userId: string, col: string, docId: string) {
  return doc(db, 'users', userId, col, docId);
}

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 9);
}

function todayStr(): string {
  return new Date().toISOString().split('T')[0];
}

// ─── Workouts ────────────────────────────────────────────────

export async function getWorkouts(userId: string): Promise<Workout[]> {
  const q = query(userCol(userId, 'workouts'), orderBy('createdAt', 'desc'));
  const snap = await getDocs(q);
  return snap.docs
    .map((d) => ({ id: d.id, ...d.data() } as Workout))
    .filter((w) => w.entries && w.entries.length > 0);
}

export async function getTodayWorkout(userId: string): Promise<Workout | null> {
  const today = todayStr();
  const q = query(userCol(userId, 'workouts'), where('date', '==', today));
  const snap = await getDocs(q);
  if (snap.empty) return null;
  const d = snap.docs[0];
  return { id: d.id, ...d.data() } as Workout;
}

export async function addEntriesToWorkout(
  userId: string,
  entries: WorkoutEntry[]
): Promise<Workout> {
  const today = todayStr();
  let workout = await getTodayWorkout(userId);

  if (workout) {
    const newEntries = [...workout.entries, ...entries];
    await updateDoc(userDoc(userId, 'workouts', workout.id), {
      entries: newEntries,
    });
    return { ...workout, entries: newEntries };
  } else {
    const id = generateId();
    const newWorkout: Omit<Workout, 'id'> = {
      date: today,
      entries,
      createdAt: Date.now(),
      completed: false,
    };
    await setDoc(userDoc(userId, 'workouts', id), newWorkout);
    return { id, ...newWorkout };
  }
}

export async function addEntryToWorkout(
  userId: string,
  entry: WorkoutEntry
): Promise<Workout> {
  return addEntriesToWorkout(userId, [entry]);
}

export async function updateWorkoutEntries(
  userId: string,
  workoutId: string,
  entries: WorkoutEntry[]
): Promise<void> {
  if (entries.length === 0) {
    await deleteDoc(userDoc(userId, 'workouts', workoutId));
  } else {
    await updateDoc(userDoc(userId, 'workouts', workoutId), { entries });
  }
}

export async function finishWorkout(
  userId: string,
  workoutId: string
): Promise<void> {
  await updateDoc(userDoc(userId, 'workouts', workoutId), { completed: true });
}

export async function deleteWorkout(
  userId: string,
  workoutId: string
): Promise<void> {
  await deleteDoc(userDoc(userId, 'workouts', workoutId));
}

// ─── Movements ───────────────────────────────────────────────

export async function getMovements(userId: string): Promise<Movement[]> {
  const q = query(userCol(userId, 'movements'), orderBy('name'));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Movement));
}

export async function addMovement(
  userId: string,
  movement: Omit<Movement, 'id'>
): Promise<Movement> {
  const id = generateId();
  await setDoc(userDoc(userId, 'movements', id), movement);
  return { id, ...movement };
}

export async function updateMovement(
  userId: string,
  id: string,
  data: Partial<Movement>
): Promise<void> {
  await updateDoc(userDoc(userId, 'movements', id), data);
}

export async function deleteMovement(
  userId: string,
  id: string
): Promise<void> {
  await deleteDoc(userDoc(userId, 'movements', id));
}

export async function seedDefaultMovements(userId: string): Promise<void> {
  const existing = await getMovements(userId);
  if (existing.length > 0) return; // Already seeded

  const batch = writeBatch(db);
  const movements = getDefaultMovements();
  movements.forEach((m) => {
    const id = generateId() + Math.random().toString(36).slice(2, 5);
    batch.set(userDoc(userId, 'movements', id), m);
  });
  await batch.commit();
}

// ─── Templates ───────────────────────────────────────────────

export async function getTemplates(userId: string): Promise<Template[]> {
  const q = query(userCol(userId, 'templates'), orderBy('order'));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Template));
}

export async function addTemplate(
  userId: string,
  template: Omit<Template, 'id'>
): Promise<Template> {
  const id = generateId();
  await setDoc(userDoc(userId, 'templates', id), template);
  return { id, ...template };
}

export async function updateTemplate(
  userId: string,
  id: string,
  data: Partial<Template>
): Promise<void> {
  await updateDoc(userDoc(userId, 'templates', id), data);
}

export async function deleteTemplate(
  userId: string,
  id: string
): Promise<void> {
  await deleteDoc(userDoc(userId, 'templates', id));
}

export async function seedDefaultTemplates(userId: string): Promise<void> {
  const existing = await getTemplates(userId);
  if (existing.length > 0) return;

  const batch = writeBatch(db);
  const templates = getDefaultTemplates();
  templates.forEach((t, i) => {
    const id = generateId() + Math.random().toString(36).slice(2, 5);
    batch.set(userDoc(userId, 'templates', id), { ...t, order: i, createdAt: Date.now() });
  });
  await batch.commit();
}

// ─── Settings ────────────────────────────────────────────────

export async function getUserSettings(userId: string): Promise<UserSettings> {
  const ref = doc(db, 'users', userId, 'settings', 'current');
  const snap = await getDoc(ref);
  if (snap.exists()) return snap.data() as UserSettings;
  await setDoc(ref, DEFAULTS);
  return { ...DEFAULTS };
}

export async function updateUserSettings(
  userId: string,
  data: Partial<UserSettings>
): Promise<void> {
  const ref = doc(db, 'users', userId, 'settings', 'current');
  await setDoc(ref, data, { merge: true });
}

// ─── Meals (Diet Tracking) ──────────────────────────────────

export async function getMeals(userId: string, date?: string): Promise<Meal[]> {
  const targetDate = date || todayStr();
  const q = query(
    userCol(userId, 'meals'),
    where('date', '==', targetDate),
    orderBy('createdAt')
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Meal));
}

export async function addMeal(
  userId: string,
  meal: Omit<Meal, 'id'>
): Promise<Meal> {
  const id = generateId();
  await setDoc(userDoc(userId, 'meals', id), meal);
  return { id, ...meal };
}

export async function updateMeal(
  userId: string,
  mealId: string,
  data: Partial<Meal>
): Promise<void> {
  await updateDoc(userDoc(userId, 'meals', mealId), data);
}

export async function deleteMeal(
  userId: string,
  mealId: string
): Promise<void> {
  await deleteDoc(userDoc(userId, 'meals', mealId));
}

export async function addFoodToMeal(
  userId: string,
  mealId: string,
  food: Food
): Promise<void> {
  const ref = userDoc(userId, 'meals', mealId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return;
  const meal = snap.data() as Omit<Meal, 'id'>;
  await updateDoc(ref, { foods: [...meal.foods, food] });
}

export async function removeFoodFromMeal(
  userId: string,
  mealId: string,
  foodId: string
): Promise<void> {
  const ref = userDoc(userId, 'meals', mealId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return;
  const meal = snap.data() as Omit<Meal, 'id'>;
  const newFoods = meal.foods.filter((f) => f.id !== foodId);
  if (newFoods.length === 0) {
    await deleteDoc(ref);
  } else {
    await updateDoc(ref, { foods: newFoods });
  }
}

// ─── CSV Export ──────────────────────────────────────────────

export async function exportAllData(userId: string): Promise<string> {
  const workouts = await getWorkouts(userId);
  const lines = ['Date,Movement,Weight,Unit,Reps,Notes'];
  workouts.forEach((w) => {
    w.entries.forEach((e) => {
      const notes = e.notes ? `"${e.notes.replace(/"/g, '""')}"` : '';
      lines.push(`${w.date},${e.movementName},${e.weight},${e.unit},${e.reps},${notes}`);
    });
  });
  return lines.join('\n');
}

// ─── Default Data ────────────────────────────────────────────

function getDefaultMovements(): Omit<Movement, 'id'>[] {
  const m = (name: string, category: Movement['category']): Omit<Movement, 'id'> => ({
    name,
    category,
    isCustom: false,
  });
  return [
    // Legs
    m('Squat', 'Legs'), m('Front Squat', 'Legs'), m('Hack Squat', 'Legs'),
    m('Leg Press', 'Legs'), m('Romanian Deadlift', 'Legs'), m('Walking Lunge', 'Legs'),
    m('Bulgarian Split Squat', 'Legs'), m('Leg Extension', 'Legs'), m('Leg Curl', 'Legs'),
    m('Hip Thrust', 'Legs'), m('Calf Raise', 'Legs'), m('Goblet Squat', 'Legs'),
    // Back
    m('Deadlift', 'Back'), m('Barbell Row', 'Back'), m('Dumbbell Row', 'Back'),
    m('Seated Cable Row', 'Back'), m('T-Bar Row', 'Back'), m('Pull-Up', 'Back'),
    m('Chin-Up', 'Back'), m('Lat Pulldown', 'Back'), m('Face Pull', 'Back'), m('Shrug', 'Back'),
    // Chest
    m('Bench Press', 'Chest'), m('Incline Bench Press', 'Chest'), m('Dumbbell Bench Press', 'Chest'),
    m('Incline Dumbbell Press', 'Chest'), m('Cable Fly', 'Chest'), m('Dumbbell Fly', 'Chest'),
    m('Chest Dip', 'Chest'), m('Push-Up', 'Chest'), m('Machine Chest Press', 'Chest'),
    // Shoulders
    m('Overhead Press', 'Shoulders'), m('Dumbbell Shoulder Press', 'Shoulders'),
    m('Arnold Press', 'Shoulders'), m('Lateral Raise', 'Shoulders'),
    m('Front Raise', 'Shoulders'), m('Reverse Fly', 'Shoulders'), m('Upright Row', 'Shoulders'),
    // Arms
    m('Barbell Curl', 'Arms'), m('Dumbbell Curl', 'Arms'), m('Hammer Curl', 'Arms'),
    m('Preacher Curl', 'Arms'), m('Cable Curl', 'Arms'), m('Tricep Pushdown', 'Arms'),
    m('Overhead Tricep Extension', 'Arms'), m('Skull Crusher', 'Arms'),
    m('Close-Grip Bench Press', 'Arms'), m('Tricep Dip', 'Arms'),
    // Core
    m('Plank', 'Core'), m('Hanging Leg Raise', 'Core'), m('Cable Crunch', 'Core'),
    m('Ab Wheel Rollout', 'Core'), m('Dead Bug', 'Core'), m('Russian Twist', 'Core'),
    m('Decline Sit-Up', 'Core'),
    // Cardio
    m('Running', 'Cardio'), m('Rowing Machine', 'Cardio'), m('Stationary Bike', 'Cardio'),
    m('Jump Rope', 'Cardio'), m('Stair Climber', 'Cardio'),
  ];
}

function getDefaultTemplates(): Omit<Template, 'id' | 'order' | 'createdAt'>[] {
  return [
    {
      name: 'Push Day',
      entries: [
        { movementName: 'Bench Press', reps: 8, weight: 60, unit: 'kg' },
        { movementName: 'Overhead Press', reps: 8, weight: 40, unit: 'kg' },
        { movementName: 'Incline Dumbbell Press', reps: 10, weight: 22, unit: 'kg' },
        { movementName: 'Lateral Raise', reps: 12, weight: 10, unit: 'kg' },
        { movementName: 'Tricep Pushdown', reps: 12, weight: 25, unit: 'kg' },
        { movementName: 'Cable Fly', reps: 12, weight: 15, unit: 'kg' },
      ],
    },
    {
      name: 'Pull Day',
      entries: [
        { movementName: 'Deadlift', reps: 5, weight: 100, unit: 'kg' },
        { movementName: 'Barbell Row', reps: 8, weight: 60, unit: 'kg' },
        { movementName: 'Pull-Up', reps: 8, weight: 0, unit: 'kg' },
        { movementName: 'Face Pull', reps: 15, weight: 15, unit: 'kg' },
        { movementName: 'Barbell Curl', reps: 10, weight: 25, unit: 'kg' },
        { movementName: 'Hammer Curl', reps: 10, weight: 14, unit: 'kg' },
      ],
    },
    {
      name: 'Leg Day',
      entries: [
        { movementName: 'Squat', reps: 5, weight: 80, unit: 'kg' },
        { movementName: 'Romanian Deadlift', reps: 8, weight: 70, unit: 'kg' },
        { movementName: 'Leg Press', reps: 10, weight: 120, unit: 'kg' },
        { movementName: 'Leg Extension', reps: 12, weight: 40, unit: 'kg' },
        { movementName: 'Leg Curl', reps: 12, weight: 35, unit: 'kg' },
        { movementName: 'Calf Raise', reps: 15, weight: 60, unit: 'kg' },
      ],
    },
  ];
}
