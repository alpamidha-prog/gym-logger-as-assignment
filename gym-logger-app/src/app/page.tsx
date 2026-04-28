'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { CheckCircle2, Trophy } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useSettings } from '@/contexts/SettingsContext';
import WorkoutForm from '@/components/WorkoutForm';
import WorkoutList from '@/components/WorkoutList';
import UndoToast, { SuccessToast } from '@/components/UndoToast';
import { SkeletonList } from '@/components/Skeleton';
import {
  getTodayWorkout,
  addEntryToWorkout,
  updateWorkoutEntries,
  finishWorkout,
  getMovements,
} from '@/lib/firestore';
import type { Workout, WorkoutEntry, Movement } from '@/types';

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 9);
}

export default function HomePage() {
  const { user } = useAuth();
  const { settings } = useSettings();
  const [workout, setWorkout] = useState<Workout | null>(null);
  const [movements, setMovements] = useState<Movement[]>([]);
  const [loading, setLoading] = useState(true);
  const [undoState, setUndoState] = useState<{
    message: string;
    entries: WorkoutEntry[];
  } | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [finishStep, setFinishStep] = useState<'idle' | 'confirm'>('idle');

  const loadData = useCallback(async () => {
    if (!user) return;
    try {
      const [w, m] = await Promise.all([
        getTodayWorkout(user.uid),
        getMovements(user.uid),
      ]);
      setWorkout(w);
      setMovements(m);
    } catch (e) {
      console.error('Failed to load data:', e);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const entries = workout?.entries || [];
  const lastEntry = entries.length > 0 ? entries[entries.length - 1] : null;

  const totalVolume = useMemo(() => {
    return entries.reduce((sum, e) => sum + e.weight * e.reps, 0);
  }, [entries]);

  const handleLogSet = async (data: Omit<WorkoutEntry, 'id' | 'createdAt'>) => {
    if (!user) return;
    const newEntry: WorkoutEntry = {
      ...data,
      id: generateId(),
      createdAt: Date.now(),
    };

    // Optimistic update
    if (workout) {
      setWorkout({ ...workout, entries: [...workout.entries, newEntry] });
    } else {
      setWorkout({
        id: 'temp',
        date: new Date().toISOString().split('T')[0],
        entries: [newEntry],
        createdAt: Date.now(),
        completed: false,
      });
    }

    try {
      const updated = await addEntryToWorkout(user.uid, newEntry);
      setWorkout(updated);
    } catch (e) {
      console.error('Failed to log set:', e);
      loadData();
    }
  };

  const handleUpdateEntry = async (id: string, data: Partial<WorkoutEntry>) => {
    if (!user || !workout) return;
    const newEntries = workout.entries.map((e) =>
      e.id === id ? { ...e, ...data } : e
    );
    setWorkout({ ...workout, entries: newEntries });
    try {
      await updateWorkoutEntries(user.uid, workout.id, newEntries);
    } catch (e) {
      console.error('Failed to update entry:', e);
      loadData();
    }
  };

  const handleDeleteEntry = async (id: string) => {
    if (!user || !workout) return;
    const newEntries = workout.entries.filter((e) => e.id !== id);
    setWorkout({ ...workout, entries: newEntries });
    try {
      await updateWorkoutEntries(user.uid, workout.id, newEntries);
      if (newEntries.length === 0) setWorkout(null);
    } catch (e) {
      console.error('Failed to delete entry:', e);
      loadData();
    }
  };

  const handleDeleteMovement = (movementName: string) => {
    if (!user || !workout) return;
    const oldEntries = [...workout.entries];
    const newEntries = workout.entries.filter((e) => e.movementName !== movementName);
    setWorkout({ ...workout, entries: newEntries });

    setUndoState({
      message: `Deleted all ${movementName} sets`,
      entries: oldEntries,
    });

    updateWorkoutEntries(user.uid, workout.id, newEntries).catch(() => loadData());
  };

  const handleUndo = async () => {
    if (!undoState || !user || !workout) return;
    setWorkout({ ...workout, entries: undoState.entries });
    setUndoState(null);
    try {
      await updateWorkoutEntries(user.uid, workout.id, undoState.entries);
    } catch (e) {
      loadData();
    }
  };

  const handleDuplicate = async (entry: WorkoutEntry) => {
    handleLogSet({
      movementName: entry.movementName,
      reps: entry.reps,
      weight: entry.weight,
      unit: entry.unit,
      notes: undefined,
    });
  };

  const handleFinish = async () => {
    if (finishStep === 'idle') {
      setFinishStep('confirm');
      setTimeout(() => setFinishStep('idle'), 3000);
      return;
    }

    if (!user || !workout) return;
    try {
      await finishWorkout(user.uid, workout.id);
      setSuccessMsg(`Workout complete! ${entries.length} sets · ${Math.round(totalVolume)} ${settings.unit} total`);
      setWorkout(null);
      setFinishStep('idle');
    } catch (e) {
      console.error('Failed to finish workout:', e);
    }
  };

  if (loading) {
    return (
      <div className="py-6">
        <div className="skeleton h-8 w-48 rounded-lg mb-6" />
        <SkeletonList count={2} />
      </div>
    );
  }

  return (
    <div className="py-6 flex flex-col gap-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold tracking-wide" style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-dancing-script)' }}>
            Today&apos;s Workout
          </h1>
          <p className="text-lg font-medium mt-1" style={{ color: 'var(--text-primary)', opacity: 0.9 }}>
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </p>
        </div>
        {entries.length > 0 && (
          <div
            className="px-3 py-1.5 rounded-xl text-xs font-bold"
            style={{ backgroundColor: 'var(--bg-accent)', color: 'var(--accent)' }}
          >
            {entries.length} sets · {Math.round(totalVolume)} {settings.unit}
          </div>
        )}
      </div>

      {/* Workout form */}
      <WorkoutForm
        movements={movements}
        lastEntry={lastEntry}
        onLogSet={handleLogSet}
      />

      {/* Workout list */}
      {entries.length > 0 && (
        <>
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
              Logged Sets
            </h2>
          </div>

          <WorkoutList
            entries={entries}
            onUpdateEntry={handleUpdateEntry}
            onDeleteEntry={handleDeleteEntry}
            onDeleteMovement={handleDeleteMovement}
            onDuplicateEntry={handleDuplicate}
          />

          {/* Finish button */}
          <button
            onClick={handleFinish}
            className="w-full py-3.5 rounded-xl text-base font-bold transition-all active:scale-[0.97] flex items-center justify-center gap-2"
            style={{
              backgroundColor: finishStep === 'confirm' ? 'var(--success)' : 'var(--bg-tertiary)',
              color: finishStep === 'confirm' ? '#fff' : 'var(--text-primary)',
              border: '1px solid var(--border-color)',
            }}
          >
            {finishStep === 'confirm' ? (
              <>
                <CheckCircle2 size={18} />
                Tap again to confirm
              </>
            ) : (
              <>
                <Trophy size={18} />
                Finish Workout
              </>
            )}
          </button>
        </>
      )}

      {/* Toasts */}
      {undoState && (
        <UndoToast
          message={undoState.message}
          onUndo={handleUndo}
          onDismiss={() => setUndoState(null)}
        />
      )}
      {successMsg && (
        <SuccessToast
          message={successMsg}
          onDismiss={() => setSuccessMsg(null)}
        />
      )}
    </div>
  );
}
