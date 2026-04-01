'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Trash2, Coffee, Sun, Moon, Cookie } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import DietForm from '@/components/DietForm';
import NutritionSummary from '@/components/NutritionSummary';
import { SkeletonList } from '@/components/Skeleton';
import { getMeals, addMeal, deleteMeal, removeFoodFromMeal } from '@/lib/firestore';
import type { Meal, Food, MealType } from '@/types';

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 9);
}

const mealIcons: Record<MealType, typeof Coffee> = {
  breakfast: Coffee,
  lunch: Sun,
  dinner: Moon,
  snack: Cookie,
};

const mealLabels: Record<MealType, string> = {
  breakfast: 'Breakfast',
  lunch: 'Lunch',
  dinner: 'Dinner',
  snack: 'Snack',
};

const mealColors: Record<MealType, string> = {
  breakfast: '#f59e0b',
  lunch: '#10b981',
  dinner: '#8b5cf6',
  snack: '#f97316',
};

export default function DietPage() {
  const { user } = useAuth();
  const [meals, setMeals] = useState<Meal[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [recentFoods, setRecentFoods] = useState<string[]>([]);

  const loadData = useCallback(async () => {
    if (!user) return;
    try {
      const data = await getMeals(user.uid, selectedDate);
      setMeals(data);

      // Build recent foods from loaded meals
      const foods = new Set<string>();
      data.forEach((m) => m.foods.forEach((f) => foods.add(f.name)));
      setRecentFoods(Array.from(foods));
    } catch (e) {
      console.error('Failed to load meals:', e);
    }
    setLoading(false);
  }, [user, selectedDate]);

  useEffect(() => {
    setLoading(true);
    loadData();
  }, [loadData]);

  const handleAddMeal = async (mealType: MealType, foods: Food[]) => {
    if (!user) return;
    const newMeal: Omit<Meal, 'id'> = {
      date: selectedDate,
      mealType,
      foods,
      createdAt: Date.now(),
    };

    // Optimistic
    const tempMeal: Meal = { id: generateId(), ...newMeal };
    setMeals((prev) => [...prev, tempMeal]);

    try {
      const saved = await addMeal(user.uid, newMeal);
      setMeals((prev) => prev.map((m) => (m.id === tempMeal.id ? saved : m)));
    } catch (e) {
      console.error('Failed to add meal:', e);
      loadData();
    }
  };

  const handleDeleteFood = async (mealId: string, foodId: string) => {
    if (!user) return;

    // Optimistic
    setMeals((prev) =>
      prev
        .map((m) => {
          if (m.id !== mealId) return m;
          return { ...m, foods: m.foods.filter((f) => f.id !== foodId) };
        })
        .filter((m) => m.foods.length > 0)
    );

    try {
      await removeFoodFromMeal(user.uid, mealId, foodId);
    } catch (e) {
      loadData();
    }
  };

  const handleDeleteMeal = async (mealId: string) => {
    if (!user) return;
    setMeals((prev) => prev.filter((m) => m.id !== mealId));
    try {
      await deleteMeal(user.uid, mealId);
    } catch (e) {
      loadData();
    }
  };

  const navigateDate = (offset: number) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + offset);
    setSelectedDate(d.toISOString().split('T')[0]);
  };

  const isToday = selectedDate === new Date().toISOString().split('T')[0];

  const groupedMeals = useMemo(() => {
    const groups: Record<MealType, Meal[]> = {
      breakfast: [],
      lunch: [],
      dinner: [],
      snack: [],
    };
    meals.forEach((m) => {
      groups[m.mealType].push(m);
    });
    return groups;
  }, [meals]);

  if (loading) {
    return (
      <div className="py-6">
        <div className="skeleton h-8 w-48 rounded-lg mb-6" />
        <SkeletonList count={3} />
      </div>
    );
  }

  return (
    <div className="py-6 flex flex-col gap-5">
      {/* Header with date nav */}
      <div>
        <h1 className="text-2xl font-bold mb-3" style={{ color: 'var(--text-primary)' }}>
          Diet Tracker
        </h1>
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigateDate(-1)}
            className="p-2 rounded-xl transition-all active:scale-90"
            style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-secondary)' }}
          >
            <ChevronLeft size={18} />
          </button>
          <div className="text-center">
            <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
              {isToday
                ? 'Today'
                : new Date(selectedDate + 'T12:00:00').toLocaleDateString('en-US', {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                  })}
            </p>
            <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
              {selectedDate}
            </p>
          </div>
          <button
            onClick={() => navigateDate(1)}
            disabled={isToday}
            className="p-2 rounded-xl transition-all active:scale-90 disabled:opacity-30"
            style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-secondary)' }}
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      {/* Nutrition summary */}
      <NutritionSummary meals={meals} />

      {/* Diet form */}
      <DietForm onAddMeal={handleAddMeal} recentFoods={recentFoods} />

      {/* Meal list */}
      {meals.length > 0 && (
        <div className="flex flex-col gap-4">
          <h2 className="text-sm font-bold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
            Logged Meals
          </h2>

          {(Object.keys(groupedMeals) as MealType[]).map((type) => {
            const mealsOfType = groupedMeals[type];
            if (mealsOfType.length === 0) return null;

            const Icon = mealIcons[type];
            const totalCals = mealsOfType.reduce(
              (s, m) => s + m.foods.reduce((fs, f) => fs + f.calories, 0),
              0
            );

            return (
              <div
                key={type}
                className="card-depth rounded-2xl overflow-hidden"
                style={{ backgroundColor: 'var(--bg-secondary)' }}
              >
                {/* Meal type header */}
                <div
                  className="flex items-center justify-between px-4 py-3"
                  style={{ borderBottom: '1px solid var(--border-color)' }}
                >
                  <div className="flex items-center gap-2">
                    <Icon size={16} style={{ color: mealColors[type] }} />
                    <h3 className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
                      {mealLabels[type]}
                    </h3>
                  </div>
                  <span
                    className="text-xs px-2 py-0.5 rounded-full font-semibold"
                    style={{ backgroundColor: 'var(--bg-accent)', color: 'var(--accent)' }}
                  >
                    {totalCals} kcal
                  </span>
                </div>

                {/* Foods */}
                {mealsOfType.map((meal) =>
                  meal.foods.map((food) => (
                    <div
                      key={food.id}
                      className="flex items-center justify-between px-4 py-2.5 group"
                      style={{ borderBottom: '1px solid var(--border-color)' }}
                    >
                      <div>
                        <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                          {food.name}
                        </p>
                        <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                          {food.calories}kcal · {food.protein}P · {food.carbs}C · {food.fat}F
                          {food.quantity > 1 && ` · ${food.quantity} ${food.servingUnit}`}
                        </p>
                      </div>
                      <button
                        onClick={() => handleDeleteFood(meal.id, food.id)}
                        className="p-1.5 rounded-lg opacity-50 group-hover:opacity-100 transition-all active:scale-90"
                        style={{ color: 'var(--danger)' }}
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  ))
                )}
              </div>
            );
          })}
        </div>
      )}

      {meals.length === 0 && (
        <div className="text-center py-8">
          <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
            No meals logged yet. Start tracking your nutrition! 🥗
          </p>
        </div>
      )}
    </div>
  );
}
