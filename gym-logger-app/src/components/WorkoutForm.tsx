'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import { Plus, Repeat, ChevronDown, FileText } from 'lucide-react';
import type { WorkoutEntry, Movement } from '@/types';
import { useSettings } from '@/contexts/SettingsContext';

interface WorkoutFormProps {
  movements: Movement[];
  lastEntry: WorkoutEntry | null;
  onLogSet: (entry: Omit<WorkoutEntry, 'id' | 'createdAt'>) => void;
}

export default function WorkoutForm({ movements, lastEntry, onLogSet }: WorkoutFormProps) {
  const { settings } = useSettings();
  const [movementName, setMovementName] = useState('');
  const [reps, setReps] = useState<string>('');
  const [weight, setWeight] = useState<string>('');
  const [notes, setNotes] = useState('');
  const [showNotes, setShowNotes] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const suggestions = useMemo(() => {
    if (!movementName.trim()) return [];
    const lower = movementName.toLowerCase();
    return movements
      .filter((m) => m.name.toLowerCase().includes(lower))
      .slice(0, 8);
  }, [movementName, movements]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!movementName.trim() || !reps || !weight) return;

    onLogSet({
      movementName: movementName.trim(),
      reps: Number(reps),
      weight: Number(weight),
      unit: settings.unit,
      notes: notes.trim() || undefined,
    });

    setMovementName('');
    setReps('');
    setWeight('');
    setNotes('');
    setShowNotes(false);
    inputRef.current?.focus();
  };

  const handleRepeatLast = () => {
    if (!lastEntry) return;
    onLogSet({
      movementName: lastEntry.movementName,
      reps: lastEntry.reps,
      weight: lastEntry.weight,
      unit: lastEntry.unit,
      notes: undefined,
    });
  };

  const selectSuggestion = (name: string) => {
    setMovementName(name);
    setShowSuggestions(false);
  };

  return (
    <form onSubmit={handleSubmit} className="card-depth rounded-2xl p-4" style={{ backgroundColor: 'var(--bg-secondary)' }}>
      <h2 className="text-sm font-bold uppercase tracking-wider mb-3" style={{ color: 'var(--text-secondary)' }}>
        Log Set
      </h2>

      {/* Movement name with autocomplete */}
      <div className="relative mb-3">
        <input
          ref={inputRef}
          type="text"
          placeholder="Movement name"
          value={movementName}
          onChange={(e) => {
            setMovementName(e.target.value);
            setShowSuggestions(true);
          }}
          onFocus={() => setShowSuggestions(true)}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
          className="w-full px-4 py-3.5 rounded-xl text-lg font-medium outline-none transition-all"
          style={{
            backgroundColor: 'var(--bg-tertiary)',
            color: 'var(--text-primary)',
            border: '1px solid var(--border-color)',
          }}
        />
        {showSuggestions && suggestions.length > 0 && (
          <div
            className="absolute z-20 left-0 right-0 top-full mt-1 rounded-xl overflow-hidden shadow-lg animate-fade-in"
            style={{
              backgroundColor: 'var(--bg-secondary)',
              border: '1px solid var(--border-color)',
            }}
          >
            {suggestions.map((m) => (
              <button
                key={m.id}
                type="button"
                onMouseDown={() => selectSuggestion(m.name)}
                className="w-full px-4 py-3 text-left text-sm font-medium flex justify-between items-center transition-all"
                style={{ color: 'var(--text-primary)' }}
              >
                <span>{m.name}</span>
                <span
                  className="text-xs px-2 py-0.5 rounded-full"
                  style={{
                    backgroundColor: 'var(--bg-accent)',
                    color: 'var(--accent)',
                  }}
                >
                  {m.category}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Reps + Weight row */}
      <div className="grid grid-cols-2 gap-3 mb-3">
        <input
          type="number"
          placeholder="Reps"
          value={reps}
          onChange={(e) => setReps(e.target.value)}
          min="0"
          className="px-4 py-3.5 rounded-xl text-lg font-medium outline-none transition-all text-center"
          style={{
            backgroundColor: 'var(--bg-tertiary)',
            color: 'var(--text-primary)',
            border: '1px solid var(--border-color)',
          }}
        />
        <input
          type="number"
          placeholder={`Weight (${settings.unit})`}
          value={weight}
          onChange={(e) => setWeight(e.target.value)}
          min="0"
          step="0.5"
          className="px-4 py-3.5 rounded-xl text-lg font-medium outline-none transition-all text-center"
          style={{
            backgroundColor: 'var(--bg-tertiary)',
            color: 'var(--text-primary)',
            border: '1px solid var(--border-color)',
          }}
        />
      </div>

      {/* Notes toggle */}
      <button
        type="button"
        onClick={() => setShowNotes(!showNotes)}
        className="flex items-center gap-1.5 text-xs font-medium mb-3 transition-all active:scale-95"
        style={{ color: 'var(--text-tertiary)' }}
      >
        <FileText size={12} />
        {showNotes ? 'Hide notes' : 'Add notes'}
        <ChevronDown size={12} className={`transition-transform ${showNotes ? 'rotate-180' : ''}`} />
      </button>

      {showNotes && (
        <textarea
          placeholder="Notes (optional)"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
          className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all mb-3 resize-none"
          style={{
            backgroundColor: 'var(--bg-tertiary)',
            color: 'var(--text-primary)',
            border: '1px solid var(--border-color)',
          }}
        />
      )}

      {/* Submit button */}
      <button
        type="submit"
        disabled={!movementName.trim() || !reps || !weight}
        className="w-full py-3.5 rounded-xl text-base font-bold transition-all active:scale-[0.97] disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        style={{
          backgroundColor: 'var(--accent)',
          color: 'var(--text-on-accent)',
          boxShadow: 'var(--btn-shadow)',
        }}
      >
        <Plus size={18} strokeWidth={3} />
        Log Set
      </button>

      {/* Repeat last */}
      {lastEntry && (
        <button
          type="button"
          onClick={handleRepeatLast}
          className="w-full mt-2 py-3 rounded-xl text-sm font-semibold transition-all active:scale-[0.97] flex items-center justify-center gap-2"
          style={{
            backgroundColor: 'var(--bg-tertiary)',
            color: 'var(--text-secondary)',
            border: '1px solid var(--border-color)',
          }}
        >
          <Repeat size={14} />
          Repeat: {lastEntry.movementName} ({lastEntry.reps}×{lastEntry.weight}{lastEntry.unit})
        </button>
      )}
    </form>
  );
}
