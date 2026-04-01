'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { ChevronDown, ChevronUp, Trash2, X } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useSettings } from '@/contexts/SettingsContext';
import WorkoutList from '@/components/WorkoutList';
import { SkeletonList } from '@/components/Skeleton';
import { getWorkouts, updateWorkoutEntries, deleteWorkout } from '@/lib/firestore';
import type { Workout, WorkoutEntry } from '@/types';

function getWeekStart(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00');
  const day = d.getDay();
  d.setDate(d.getDate() - day);
  return d.toISOString().split('T')[0];
}

function formatWeekRange(startStr: string): string {
  const start = new Date(startStr + 'T12:00:00');
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  const fmt = (d: Date) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  return `Week of ${fmt(start)} — ${fmt(end)}`;
}

function getRelativeDate(dateStr: string): string {
  const today = new Date().toISOString().split('T')[0];
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];

  if (dateStr === today) return 'Today';
  if (dateStr === yesterdayStr) return 'Yesterday';

  const d = new Date(dateStr + 'T12:00:00');
  const diff = Math.floor((Date.now() - d.getTime()) / 86400000);
  if (diff < 7) return d.toLocaleDateString('en-US', { weekday: 'long' });
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default function HistoryPage() {
  const { user } = useAuth();
  const { settings } = useSettings();
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [deleteModal, setDeleteModal] = useState<{ type: 'workout' | 'movement'; workoutId: string; movementName?: string } | null>(null);

  const loadData = useCallback(async () => {
    if (!user) return;
    try {
      const w = await getWorkouts(user.uid);
      setWorkouts(w);
    } catch (e) {
      console.error('Failed to load history:', e);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => { loadData(); }, [loadData]);

  const grouped = useMemo(() => {
    const groups: Record<string, Workout[]> = {};
    workouts.forEach((w) => {
      const weekStart = getWeekStart(w.date);
      if (!groups[weekStart]) groups[weekStart] = [];
      groups[weekStart].push(w);
    });
    return Object.entries(groups).sort(([a], [b]) => b.localeCompare(a));
  }, [workouts]);

  const handleUpdateEntry = async (workoutId: string, entryId: string, data: Partial<WorkoutEntry>) => {
    if (!user) return;
    const w = workouts.find((w) => w.id === workoutId);
    if (!w) return;
    const newEntries = w.entries.map((e) => e.id === entryId ? { ...e, ...data } : e);
    setWorkouts((prev) => prev.map((pw) => pw.id === workoutId ? { ...pw, entries: newEntries } : pw));
    try { await updateWorkoutEntries(user.uid, workoutId, newEntries); } catch { loadData(); }
  };

  const handleDeleteEntry = async (workoutId: string, entryId: string) => {
    if (!user) return;
    const w = workouts.find((w) => w.id === workoutId);
    if (!w) return;
    const newEntries = w.entries.filter((e) => e.id !== entryId);
    if (newEntries.length === 0) {
      setWorkouts((prev) => prev.filter((pw) => pw.id !== workoutId));
      try { await deleteWorkout(user.uid, workoutId); } catch { loadData(); }
    } else {
      setWorkouts((prev) => prev.map((pw) => pw.id === workoutId ? { ...pw, entries: newEntries } : pw));
      try { await updateWorkoutEntries(user.uid, workoutId, newEntries); } catch { loadData(); }
    }
  };

  const handleDeleteMovement = (workoutId: string, movementName: string) => {
    setDeleteModal({ type: 'movement', workoutId, movementName });
  };

  const handleDeleteWorkout = (workoutId: string) => {
    setDeleteModal({ type: 'workout', workoutId });
  };

  const confirmDelete = async () => {
    if (!user || !deleteModal) return;
    if (deleteModal.type === 'workout') {
      setWorkouts((prev) => prev.filter((w) => w.id !== deleteModal.workoutId));
      try { await deleteWorkout(user.uid, deleteModal.workoutId); } catch { loadData(); }
    } else if (deleteModal.type === 'movement' && deleteModal.movementName) {
      const w = workouts.find((w) => w.id === deleteModal.workoutId);
      if (!w) return;
      const newEntries = w.entries.filter((e) => e.movementName !== deleteModal.movementName);
      if (newEntries.length === 0) {
        setWorkouts((prev) => prev.filter((pw) => pw.id !== deleteModal.workoutId));
        try { await deleteWorkout(user.uid, deleteModal.workoutId); } catch { loadData(); }
      } else {
        setWorkouts((prev) => prev.map((pw) => pw.id === deleteModal.workoutId ? { ...pw, entries: newEntries } : pw));
        try { await updateWorkoutEntries(user.uid, deleteModal.workoutId, newEntries); } catch { loadData(); }
      }
    }
    setDeleteModal(null);
  };

  const handleDuplicate = async (workoutId: string, entry: WorkoutEntry) => {
    if (!user) return;
    const w = workouts.find((w) => w.id === workoutId);
    if (!w) return;
    const newEntry: WorkoutEntry = { ...entry, id: Date.now().toString(36) + Math.random().toString(36).slice(2), createdAt: Date.now() };
    const newEntries = [...w.entries, newEntry];
    setWorkouts((prev) => prev.map((pw) => pw.id === workoutId ? { ...pw, entries: newEntries } : pw));
    try { await updateWorkoutEntries(user.uid, workoutId, newEntries); } catch { loadData(); }
  };

  if (loading) {
    return <div className="py-6"><div className="skeleton h-8 w-48 rounded-lg mb-6" /><SkeletonList count={4} /></div>;
  }

  return (
    <div className="py-6 flex flex-col gap-5">
      <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Workout History</h1>

      {workouts.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>No workout history yet. Log your first workout! 📊</p>
        </div>
      ) : (
        grouped.map(([weekStart, weekWorkouts]) => (
          <div key={weekStart}>
            <h2 className="text-xs font-bold uppercase tracking-wider mb-3 px-1" style={{ color: 'var(--accent)' }}>
              {formatWeekRange(weekStart)}
            </h2>

            <div className="flex flex-col gap-3">
              {weekWorkouts.map((workout) => {
                const isExpanded = expandedId === workout.id;
                const movements = [...new Set(workout.entries.map((e) => e.movementName))];
                const totalVolume = workout.entries.reduce((s, e) => s + e.weight * e.reps, 0);

                return (
                  <div key={workout.id} className="card-depth rounded-2xl overflow-hidden animate-fade-in" style={{ backgroundColor: 'var(--bg-secondary)' }}>
                    <button onClick={() => setExpandedId(isExpanded ? null : workout.id)}
                      className="w-full px-4 py-3 flex items-center gap-3 text-left">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{getRelativeDate(workout.date)}</span>
                          <span className="text-xs px-2 py-0.5 rounded-full font-semibold" style={{ backgroundColor: 'var(--bg-accent)', color: 'var(--accent)' }}>
                            {workout.entries.length} sets
                          </span>
                        </div>
                        <p className="text-xs truncate mt-0.5" style={{ color: 'var(--text-tertiary)' }}>
                          {movements.join(' · ')} · {Math.round(totalVolume)} {settings.unit}
                        </p>
                      </div>
                      <div className="flex items-center gap-1">
                        <button onClick={(e) => { e.stopPropagation(); handleDeleteWorkout(workout.id); }} className="p-1.5 rounded-lg active:scale-90" style={{ color: 'var(--danger)' }}>
                          <Trash2 size={14} />
                        </button>
                        {isExpanded ? <ChevronUp size={16} style={{ color: 'var(--text-tertiary)' }} /> : <ChevronDown size={16} style={{ color: 'var(--text-tertiary)' }} />}
                      </div>
                    </button>

                    {isExpanded && (
                      <div className="px-4 pb-4 animate-fade-in">
                        <WorkoutList
                          entries={workout.entries}
                          onUpdateEntry={(id, data) => handleUpdateEntry(workout.id, id, data)}
                          onDeleteEntry={(id) => handleDeleteEntry(workout.id, id)}
                          onDeleteMovement={(name) => handleDeleteMovement(workout.id, name)}
                          onDuplicateEntry={(entry) => handleDuplicate(workout.id, entry)}
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))
      )}

      {/* Delete confirmation modal */}
      {deleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}
          onClick={() => setDeleteModal(null)} onKeyDown={(e) => e.key === 'Escape' && setDeleteModal(null)}>
          <div className="card-depth rounded-2xl p-6 w-full max-w-sm animate-modal-in" style={{ backgroundColor: 'var(--bg-secondary)' }}
            onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
              Delete {deleteModal.type === 'workout' ? 'Workout' : `"${deleteModal.movementName}" sets`}?
            </h3>
            <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>
              This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteModal(null)} className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all active:scale-95"
                style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-secondary)' }}>Cancel</button>
              <button onClick={confirmDelete} className="flex-1 py-2.5 rounded-xl text-sm font-bold transition-all active:scale-95"
                style={{ backgroundColor: 'var(--danger)', color: '#fff' }}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
