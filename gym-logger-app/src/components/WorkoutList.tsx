'use client';

import { useState, useMemo } from 'react';
import { Trash2, Copy, Pencil, Check, X } from 'lucide-react';
import type { WorkoutEntry } from '@/types';

interface WorkoutListProps {
  entries: WorkoutEntry[];
  onUpdateEntry: (id: string, data: Partial<WorkoutEntry>) => void;
  onDeleteEntry: (id: string) => void;
  onDeleteMovement: (movementName: string) => void;
  onDuplicateEntry: (entry: WorkoutEntry) => void;
  showDeleteMovement?: boolean;
}

export default function WorkoutList({
  entries,
  onUpdateEntry,
  onDeleteEntry,
  onDeleteMovement,
  onDuplicateEntry,
  showDeleteMovement = true,
}: WorkoutListProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editField, setEditField] = useState<'reps' | 'weight' | null>(null);
  const [editValue, setEditValue] = useState('');

  const grouped = useMemo(() => {
    const groups: Record<string, WorkoutEntry[]> = {};
    entries.forEach((e) => {
      if (!groups[e.movementName]) groups[e.movementName] = [];
      groups[e.movementName].push(e);
    });
    return groups;
  }, [entries]);

  const startEdit = (entry: WorkoutEntry, field: 'reps' | 'weight') => {
    setEditingId(entry.id);
    setEditField(field);
    setEditValue(String(entry[field]));
  };

  const saveEdit = (entry: WorkoutEntry) => {
    if (editField && editValue) {
      onUpdateEntry(entry.id, { [editField]: Number(editValue) });
    }
    setEditingId(null);
    setEditField(null);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditField(null);
  };

  if (entries.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
          No sets logged yet. Start your workout above! 💪
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {Object.entries(grouped).map(([movementName, sets]) => (
        <div
          key={movementName}
          className="card-depth rounded-2xl overflow-hidden"
          style={{ backgroundColor: 'var(--bg-secondary)' }}
        >
          {/* Movement header */}
          <div
            className="flex items-center justify-between px-4 py-3"
            style={{ borderBottom: '1px solid var(--border-color)' }}
          >
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
                {movementName}
              </h3>
              <span
                className="text-xs px-2 py-0.5 rounded-full font-semibold"
                style={{ backgroundColor: 'var(--bg-accent)', color: 'var(--accent)' }}
              >
                {sets.length} {sets.length === 1 ? 'set' : 'sets'}
              </span>
            </div>
            {showDeleteMovement && (
              <button
                onClick={() => onDeleteMovement(movementName)}
                className="p-1.5 rounded-lg transition-all active:scale-90"
                style={{ color: 'var(--danger)' }}
                title="Delete all sets"
              >
                <Trash2 size={14} />
              </button>
            )}
          </div>

          {/* Sets */}
          <div className="divide-y" style={{ borderColor: 'var(--border-color)' }}>
            {sets.map((entry, idx) => (
              <div
                key={entry.id}
                className="flex items-center gap-3 px-4 py-2.5 group"
              >
                {/* Set number */}
                <span
                  className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                  style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-secondary)' }}
                >
                  {idx + 1}
                </span>

                {/* Reps */}
                {editingId === entry.id && editField === 'reps' ? (
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') saveEdit(entry);
                        if (e.key === 'Escape') cancelEdit();
                      }}
                      onBlur={() => saveEdit(entry)}
                      autoFocus
                      className="w-14 px-2 py-1 rounded-lg text-sm text-center outline-none"
                      style={{
                        backgroundColor: 'var(--bg-accent)',
                        color: 'var(--accent)',
                        border: '1px solid var(--accent)',
                      }}
                    />
                  </div>
                ) : (
                  <button
                    onClick={() => startEdit(entry, 'reps')}
                    className="text-sm font-semibold transition-all hover:opacity-70"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    {entry.reps}
                  </button>
                )}

                <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>×</span>

                {/* Weight */}
                {editingId === entry.id && editField === 'weight' ? (
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') saveEdit(entry);
                        if (e.key === 'Escape') cancelEdit();
                      }}
                      onBlur={() => saveEdit(entry)}
                      autoFocus
                      className="w-16 px-2 py-1 rounded-lg text-sm text-center outline-none"
                      style={{
                        backgroundColor: 'var(--bg-accent)',
                        color: 'var(--accent)',
                        border: '1px solid var(--accent)',
                      }}
                    />
                  </div>
                ) : (
                  <button
                    onClick={() => startEdit(entry, 'weight')}
                    className="text-sm font-semibold transition-all hover:opacity-70"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    {entry.weight}
                    <span className="text-xs ml-0.5" style={{ color: 'var(--text-tertiary)' }}>
                      {entry.unit}
                    </span>
                  </button>
                )}

                {/* Notes */}
                {entry.notes && (
                  <span className="text-xs truncate max-w-[80px]" style={{ color: 'var(--text-tertiary)' }}>
                    — {entry.notes}
                  </span>
                )}

                {/* Actions */}
                <div className="ml-auto flex items-center gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => onDuplicateEntry(entry)}
                    className="p-1.5 rounded-lg transition-all active:scale-90"
                    style={{ color: 'var(--text-tertiary)' }}
                    title="Duplicate set"
                  >
                    <Copy size={12} />
                  </button>
                  <button
                    onClick={() => onDeleteEntry(entry.id)}
                    className="p-1.5 rounded-lg transition-all active:scale-90"
                    style={{ color: 'var(--danger)' }}
                    title="Delete set"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
