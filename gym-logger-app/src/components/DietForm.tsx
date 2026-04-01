'use client';

import { useState, useMemo } from 'react';
import { Plus, Trash2, X, UtensilsCrossed, Coffee, Sun, Moon, Cookie } from 'lucide-react';
import type { Meal, Food, MealType } from '@/types';

interface DietFormProps {
  onAddMeal: (mealType: MealType, foods: Food[]) => void;
  recentFoods: string[];
}

const mealTypeConfig: Record<MealType, { label: string; icon: typeof Coffee; color: string }> = {
  breakfast: { label: 'Breakfast', icon: Coffee, color: '#f59e0b' },
  lunch: { label: 'Lunch', icon: Sun, color: '#10b981' },
  dinner: { label: 'Dinner', icon: Moon, color: '#8b5cf6' },
  snack: { label: 'Snack', icon: Cookie, color: '#f97316' },
};

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 9);
}

export default function DietForm({ onAddMeal, recentFoods }: DietFormProps) {
  const [selectedMealType, setSelectedMealType] = useState<MealType>('breakfast');
  const [foodName, setFoodName] = useState('');
  const [calories, setCalories] = useState('');
  const [protein, setProtein] = useState('');
  const [carbs, setCarbs] = useState('');
  const [fat, setFat] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [servingUnit, setServingUnit] = useState('serving');
  const [pendingFoods, setPendingFoods] = useState<Food[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const suggestions = useMemo(() => {
    if (!foodName.trim()) return [];
    const lower = foodName.toLowerCase();
    return recentFoods.filter((f) => f.toLowerCase().includes(lower)).slice(0, 6);
  }, [foodName, recentFoods]);

  const addFoodToList = () => {
    if (!foodName.trim()) return;
    const food: Food = {
      id: generateId(),
      name: foodName.trim(),
      calories: Number(calories) || 0,
      protein: Number(protein) || 0,
      carbs: Number(carbs) || 0,
      fat: Number(fat) || 0,
      quantity: Number(quantity) || 1,
      servingUnit,
    };
    setPendingFoods([...pendingFoods, food]);
    setFoodName('');
    setCalories('');
    setProtein('');
    setCarbs('');
    setFat('');
    setQuantity('1');
  };

  const removePendingFood = (id: string) => {
    setPendingFoods(pendingFoods.filter((f) => f.id !== id));
  };

  const handleSubmit = () => {
    if (pendingFoods.length === 0) return;
    onAddMeal(selectedMealType, pendingFoods);
    setPendingFoods([]);
  };

  const totalCals = pendingFoods.reduce((s, f) => s + f.calories, 0);

  return (
    <div className="card-depth rounded-2xl p-4" style={{ backgroundColor: 'var(--bg-secondary)' }}>
      <h2 className="text-sm font-bold uppercase tracking-wider mb-3" style={{ color: 'var(--text-secondary)' }}>
        Log Meal
      </h2>

      {/* Meal type selector */}
      <div className="grid grid-cols-4 gap-2 mb-4">
        {(Object.keys(mealTypeConfig) as MealType[]).map((type) => {
          const config = mealTypeConfig[type];
          const Icon = config.icon;
          const isActive = type === selectedMealType;
          return (
            <button
              key={type}
              onClick={() => setSelectedMealType(type)}
              className="flex flex-col items-center gap-1 py-2.5 rounded-xl text-xs font-bold transition-all active:scale-95"
              style={{
                backgroundColor: isActive ? 'var(--accent)' : 'var(--bg-tertiary)',
                color: isActive ? 'var(--text-on-accent)' : 'var(--text-secondary)',
                boxShadow: isActive ? 'var(--btn-shadow)' : 'none',
              }}
            >
              <Icon size={16} />
              {config.label}
            </button>
          );
        })}
      </div>

      {/* Food name */}
      <div className="relative mb-3">
        <input
          type="text"
          placeholder="Food name"
          value={foodName}
          onChange={(e) => {
            setFoodName(e.target.value);
            setShowSuggestions(true);
          }}
          onFocus={() => setShowSuggestions(true)}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
          className="w-full px-4 py-3 rounded-xl text-base font-medium outline-none transition-all"
          style={{
            backgroundColor: 'var(--bg-tertiary)',
            color: 'var(--text-primary)',
            border: '1px solid var(--border-color)',
          }}
        />
        {showSuggestions && suggestions.length > 0 && (
          <div
            className="absolute z-20 left-0 right-0 top-full mt-1 rounded-xl overflow-hidden shadow-lg animate-fade-in"
            style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}
          >
            {suggestions.map((s) => (
              <button
                key={s}
                type="button"
                onMouseDown={() => { setFoodName(s); setShowSuggestions(false); }}
                className="w-full px-4 py-2.5 text-left text-sm font-medium transition-all"
                style={{ color: 'var(--text-primary)' }}
              >
                {s}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Nutrition inputs */}
      <div className="grid grid-cols-2 gap-2 mb-3">
        <input
          type="number"
          placeholder="Calories"
          value={calories}
          onChange={(e) => setCalories(e.target.value)}
          min="0"
          className="px-3 py-2.5 rounded-xl text-sm font-medium outline-none transition-all text-center"
          style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-primary)', border: '1px solid var(--border-color)' }}
        />
        <input
          type="number"
          placeholder="Protein (g)"
          value={protein}
          onChange={(e) => setProtein(e.target.value)}
          min="0"
          className="px-3 py-2.5 rounded-xl text-sm font-medium outline-none transition-all text-center"
          style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-primary)', border: '1px solid var(--border-color)' }}
        />
        <input
          type="number"
          placeholder="Carbs (g)"
          value={carbs}
          onChange={(e) => setCarbs(e.target.value)}
          min="0"
          className="px-3 py-2.5 rounded-xl text-sm font-medium outline-none transition-all text-center"
          style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-primary)', border: '1px solid var(--border-color)' }}
        />
        <input
          type="number"
          placeholder="Fat (g)"
          value={fat}
          onChange={(e) => setFat(e.target.value)}
          min="0"
          className="px-3 py-2.5 rounded-xl text-sm font-medium outline-none transition-all text-center"
          style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-primary)', border: '1px solid var(--border-color)' }}
        />
      </div>

      {/* Quantity + unit */}
      <div className="grid grid-cols-3 gap-2 mb-3">
        <input
          type="number"
          placeholder="Qty"
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
          min="0.1"
          step="0.1"
          className="px-3 py-2.5 rounded-xl text-sm font-medium outline-none text-center"
          style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-primary)', border: '1px solid var(--border-color)' }}
        />
        <select
          value={servingUnit}
          onChange={(e) => setServingUnit(e.target.value)}
          className="col-span-2 px-3 py-2.5 rounded-xl text-sm font-medium outline-none"
          style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-primary)', border: '1px solid var(--border-color)' }}
        >
          <option value="serving">Serving</option>
          <option value="g">Grams (g)</option>
          <option value="ml">Milliliters (ml)</option>
          <option value="piece">Piece</option>
        </select>
      </div>

      {/* Add food button */}
      <button
        type="button"
        onClick={addFoodToList}
        disabled={!foodName.trim()}
        className="w-full py-2.5 rounded-xl text-sm font-semibold transition-all active:scale-[0.97] disabled:opacity-40 flex items-center justify-center gap-2 mb-3"
        style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--accent)', border: '1px solid var(--border-color)' }}
      >
        <Plus size={14} />
        Add Food
      </button>

      {/* Pending foods list */}
      {pendingFoods.length > 0 && (
        <div className="mb-3 rounded-xl overflow-hidden" style={{ border: '1px solid var(--border-color)' }}>
          {pendingFoods.map((food) => (
            <div
              key={food.id}
              className="flex items-center justify-between px-3 py-2 text-sm"
              style={{ borderBottom: '1px solid var(--border-color)' }}
            >
              <div>
                <span className="font-medium" style={{ color: 'var(--text-primary)' }}>{food.name}</span>
                <span className="text-xs ml-2" style={{ color: 'var(--text-tertiary)' }}>
                  {food.calories} kcal • {food.protein}P • {food.carbs}C • {food.fat}F
                </span>
              </div>
              <button
                onClick={() => removePendingFood(food.id)}
                className="p-1 rounded active:scale-90"
                style={{ color: 'var(--danger)' }}
              >
                <X size={14} />
              </button>
            </div>
          ))}
          <div className="px-3 py-2 text-xs font-semibold" style={{ color: 'var(--accent)', backgroundColor: 'var(--bg-accent)' }}>
            Total: {totalCals} kcal
          </div>
        </div>
      )}

      {/* Submit meal */}
      <button
        onClick={handleSubmit}
        disabled={pendingFoods.length === 0}
        className="w-full py-3.5 rounded-xl text-base font-bold transition-all active:scale-[0.97] disabled:opacity-40 flex items-center justify-center gap-2"
        style={{
          backgroundColor: 'var(--accent)',
          color: 'var(--text-on-accent)',
          boxShadow: 'var(--btn-shadow)',
        }}
      >
        <UtensilsCrossed size={18} />
        Log {mealTypeConfig[selectedMealType].label}
      </button>
    </div>
  );
}
