'use client';

import { useMemo } from 'react';
import type { Meal } from '@/types';
import { useSettings } from '@/contexts/SettingsContext';

interface NutritionSummaryProps {
  meals: Meal[];
}

export default function NutritionSummary({ meals }: NutritionSummaryProps) {
  const { settings } = useSettings();

  const totals = useMemo(() => {
    let calories = 0, protein = 0, carbs = 0, fat = 0;
    meals.forEach((meal) => {
      meal.foods.forEach((food) => {
        calories += food.calories;
        protein += food.protein;
        carbs += food.carbs;
        fat += food.fat;
      });
    });
    return { calories, protein, carbs, fat };
  }, [meals]);

  const macros = [
    { label: 'Calories', value: totals.calories, target: settings.calorieTarget, unit: 'kcal', color: '#3b82f6' },
    { label: 'Protein', value: totals.protein, target: settings.proteinTarget, unit: 'g', color: '#ef4444' },
    { label: 'Carbs', value: totals.carbs, target: settings.carbTarget, unit: 'g', color: '#f59e0b' },
    { label: 'Fat', value: totals.fat, target: settings.fatTarget, unit: 'g', color: '#10b981' },
  ];

  return (
    <div className="card-depth rounded-2xl p-4" style={{ backgroundColor: 'var(--bg-secondary)' }}>
      <h2 className="text-sm font-bold uppercase tracking-wider mb-4" style={{ color: 'var(--text-secondary)' }}>
        Daily Nutrition
      </h2>

      <div className="grid grid-cols-2 gap-3">
        {macros.map((macro) => {
          const pct = Math.min((macro.value / macro.target) * 100, 100);
          const overTarget = macro.value > macro.target;

          return (
            <div key={macro.label} className="flex flex-col gap-2">
              <div className="flex justify-between items-baseline">
                <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--text-tertiary)' }}>
                  {macro.label}
                </span>
                <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                  {Math.round(macro.value)}/{macro.target}{macro.unit}
                </span>
              </div>

              {/* Progress bar */}
              <div className="h-2.5 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${pct}%`,
                    backgroundColor: overTarget ? 'var(--warning)' : macro.color,
                  }}
                />
              </div>

              <span
                className="text-lg font-bold"
                style={{ color: overTarget ? 'var(--warning)' : macro.color }}
              >
                {Math.round(macro.value)}
                <span className="text-xs font-normal ml-0.5" style={{ color: 'var(--text-tertiary)' }}>
                  {macro.unit}
                </span>
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
