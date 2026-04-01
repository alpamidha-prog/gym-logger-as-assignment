'use client';

import { useState, useEffect, useCallback } from 'react';
import { Play, Pencil, Trash2, ArrowUp, ArrowDown, Save, Check, Loader2, Plus } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useSettings } from '@/contexts/SettingsContext';
import { SkeletonList } from '@/components/Skeleton';
import { SuccessToast } from '@/components/UndoToast';
import {
  getTemplates,
  addTemplate,
  updateTemplate,
  deleteTemplate,
  getMovements,
  getTodayWorkout,
  addEntriesToWorkout,
} from '@/lib/firestore';
import type { Template, TemplateEntry, Movement, WorkoutEntry } from '@/types';
import { useRouter } from 'next/navigation';

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 9);
}

export default function TemplatesPage() {
  const { user } = useAuth();
  const { settings } = useSettings();
  const router = useRouter();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [movements, setMovements] = useState<Movement[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editEntries, setEditEntries] = useState<TemplateEntry[]>([]);
  const [loadingTemplateId, setLoadingTemplateId] = useState<string | null>(null);
  const [loadedTemplateId, setLoadedTemplateId] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const loadData = useCallback(async () => {
    if (!user) return;
    try {
      const [t, m] = await Promise.all([getTemplates(user.uid), getMovements(user.uid)]);
      setTemplates(t);
      setMovements(m);
    } catch (e) {
      console.error('Failed to load templates:', e);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleLoad = async (template: Template) => {
    if (!user) return;
    setLoadingTemplateId(template.id);
    try {
      const entries: WorkoutEntry[] = template.entries.map((e) => ({
        id: generateId(),
        movementName: e.movementName,
        reps: e.reps,
        weight: e.weight,
        unit: e.unit,
        createdAt: Date.now(),
      }));
      await addEntriesToWorkout(user.uid, entries);
      setLoadingTemplateId(null);
      setLoadedTemplateId(template.id);
      setTimeout(() => {
        setLoadedTemplateId(null);
        router.push('/');
      }, 1200);
    } catch (e) {
      console.error('Failed to load template:', e);
      setLoadingTemplateId(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!user) return;
    setTemplates((prev) => prev.filter((t) => t.id !== id));
    try {
      await deleteTemplate(user.uid, id);
    } catch { loadData(); }
  };

  const handleReorder = async (id: string, direction: 'up' | 'down') => {
    if (!user) return;
    const idx = templates.findIndex((t) => t.id === id);
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= templates.length) return;

    const newTemplates = [...templates];
    [newTemplates[idx], newTemplates[swapIdx]] = [newTemplates[swapIdx], newTemplates[idx]];
    setTemplates(newTemplates);

    try {
      await updateTemplate(user.uid, newTemplates[idx].id, { order: idx });
      await updateTemplate(user.uid, newTemplates[swapIdx].id, { order: swapIdx });
    } catch { loadData(); }
  };

  const startEdit = (template: Template) => {
    setEditingId(template.id);
    setEditName(template.name);
    setEditEntries([...template.entries]);
  };

  const saveEdit = async () => {
    if (!user || !editingId) return;
    setTemplates((prev) =>
      prev.map((t) => t.id === editingId ? { ...t, name: editName, entries: editEntries } : t)
    );
    setEditingId(null);
    try {
      await updateTemplate(user.uid, editingId, { name: editName, entries: editEntries });
    } catch { loadData(); }
  };

  const addMovementToEdit = (movementName: string) => {
    setEditEntries([...editEntries, { movementName, reps: 8, weight: 0, unit: settings.unit }]);
    setSearchQuery('');
  };

  const handleCreate = async () => {
    if (!user || !newName.trim()) return;
    try {
      const newTemplate = await addTemplate(user.uid, {
        name: newName.trim(),
        entries: [],
        createdAt: Date.now(),
        order: templates.length,
      });
      setTemplates([...templates, newTemplate]);
      setNewName('');
      setShowCreate(false);
      startEdit(newTemplate);
    } catch (e) {
      console.error('Failed to create template:', e);
    }
  };

  const handleSaveCurrentWorkout = async () => {
    if (!user) return;
    const workout = await getTodayWorkout(user.uid);
    if (!workout || workout.entries.length === 0) return;

    const templateEntries: TemplateEntry[] = workout.entries.map((e) => ({
      movementName: e.movementName,
      reps: e.reps,
      weight: e.weight,
      unit: e.unit,
    }));

    const unique: TemplateEntry[] = [];
    const seen = new Set<string>();
    templateEntries.forEach((e) => {
      if (!seen.has(e.movementName)) {
        seen.add(e.movementName);
        unique.push(e);
      }
    });

    const newTemplate = await addTemplate(user.uid, {
      name: `Workout ${new Date().toLocaleDateString()}`,
      entries: unique,
      createdAt: Date.now(),
      order: templates.length,
    });
    setTemplates([...templates, newTemplate]);
    setSuccessMsg('Workout saved as template!');
  };

  if (loading) {
    return <div className="py-6"><div className="skeleton h-8 w-48 rounded-lg mb-6" /><SkeletonList count={3} /></div>;
  }

  // Template editor view
  if (editingId) {
    const filteredMovements = searchQuery
      ? movements.filter((m) => m.name.toLowerCase().includes(searchQuery.toLowerCase())).slice(0, 8)
      : [];

    return (
      <div className="py-6 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <button onClick={() => setEditingId(null)} className="text-sm font-semibold" style={{ color: 'var(--danger)' }}>Cancel</button>
          <h2 className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>Edit Template</h2>
          <button onClick={saveEdit} className="text-sm font-semibold flex items-center gap-1" style={{ color: 'var(--accent)' }}>
            <Save size={14} /> Save
          </button>
        </div>

        <input
          type="text"
          value={editName}
          onChange={(e) => setEditName(e.target.value)}
          placeholder="Template name"
          className="px-4 py-3 rounded-xl text-lg font-bold outline-none"
          style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-primary)', border: '1px solid var(--border-color)' }}
        />

        {/* Search to add movements */}
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search movements to add..."
            className="w-full px-4 py-3 rounded-xl text-sm outline-none"
            style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-primary)', border: '1px solid var(--border-color)' }}
          />
          {filteredMovements.length > 0 && (
            <div className="absolute z-10 left-0 right-0 top-full mt-1 rounded-xl overflow-hidden shadow-lg" style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
              {filteredMovements.map((m) => (
                <button key={m.id} onClick={() => addMovementToEdit(m.name)} className="w-full px-4 py-2.5 text-left text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                  {m.name} <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>({m.category})</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Edit entries */}
        <div className="flex flex-col gap-2">
          {editEntries.map((entry, i) => (
            <div key={i} className="card-depth rounded-xl p-3 flex items-center gap-2" style={{ backgroundColor: 'var(--bg-secondary)' }}>
              <span className="text-sm font-semibold flex-1 truncate" style={{ color: 'var(--text-primary)' }}>{entry.movementName}</span>
              <input type="number" value={entry.reps} onChange={(e) => { const ne = [...editEntries]; ne[i] = { ...ne[i], reps: Number(e.target.value) }; setEditEntries(ne); }}
                className="w-14 px-2 py-1.5 rounded-lg text-sm text-center outline-none" style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-primary)', border: '1px solid var(--border-color)' }} />
              <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>×</span>
              <input type="number" value={entry.weight} onChange={(e) => { const ne = [...editEntries]; ne[i] = { ...ne[i], weight: Number(e.target.value) }; setEditEntries(ne); }}
                className="w-16 px-2 py-1.5 rounded-lg text-sm text-center outline-none" style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-primary)', border: '1px solid var(--border-color)' }} />
              <button onClick={() => setEditEntries(editEntries.filter((_, j) => j !== i))} className="p-1 rounded active:scale-90" style={{ color: 'var(--danger)' }}>
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="py-6 flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Templates</h1>
        <button onClick={() => setShowCreate(!showCreate)} className="p-2 rounded-xl transition-all active:scale-90" style={{ backgroundColor: 'var(--accent)', color: 'var(--text-on-accent)' }}>
          <Plus size={18} />
        </button>
      </div>

      {showCreate && (
        <div className="card-depth rounded-2xl p-4 flex gap-2 animate-fade-in" style={{ backgroundColor: 'var(--bg-secondary)' }}>
          <input type="text" value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Template name"
            className="flex-1 px-3 py-2.5 rounded-xl text-sm outline-none" style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-primary)', border: '1px solid var(--border-color)' }} />
          <button onClick={handleCreate} disabled={!newName.trim()} className="px-4 py-2.5 rounded-xl text-sm font-bold disabled:opacity-40 transition-all active:scale-95"
            style={{ backgroundColor: 'var(--accent)', color: 'var(--text-on-accent)' }}>Create</button>
        </div>
      )}

      <button onClick={handleSaveCurrentWorkout} className="w-full py-3 rounded-xl text-sm font-semibold transition-all active:scale-[0.97] flex items-center justify-center gap-2"
        style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-secondary)', border: '1px solid var(--border-color)' }}>
        <Save size={14} /> Save current workout as template
      </button>

      {templates.length === 0 ? (
        <div className="text-center py-12"><p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>No templates yet. Create one or save a workout! 📋</p></div>
      ) : (
        <div className="flex flex-col gap-3">
          {templates.map((template, idx) => (
            <div key={template.id} className="card-depth rounded-2xl overflow-hidden animate-fade-in" style={{ backgroundColor: 'var(--bg-secondary)' }}>
              <div className="px-4 py-3">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>{template.name}</h3>
                  <div className="flex items-center gap-1">
                    <button onClick={() => handleReorder(template.id, 'up')} disabled={idx === 0} className="p-1 rounded disabled:opacity-20 active:scale-90" style={{ color: 'var(--text-tertiary)' }}><ArrowUp size={14} /></button>
                    <button onClick={() => handleReorder(template.id, 'down')} disabled={idx === templates.length - 1} className="p-1 rounded disabled:opacity-20 active:scale-90" style={{ color: 'var(--text-tertiary)' }}><ArrowDown size={14} /></button>
                  </div>
                </div>
                <p className="text-xs truncate" style={{ color: 'var(--text-tertiary)' }}>
                  {template.entries.map((e) => e.movementName).join(' · ') || 'Empty template'}
                </p>
              </div>
              <div className="flex border-t" style={{ borderColor: 'var(--border-color)' }}>
                <button onClick={() => handleLoad(template)} disabled={!!loadingTemplateId}
                  className="flex-1 py-2.5 text-sm font-semibold flex items-center justify-center gap-1.5 transition-all active:scale-95"
                  style={{ color: loadedTemplateId === template.id ? 'var(--success)' : 'var(--accent)' }}>
                  {loadingTemplateId === template.id ? <Loader2 size={14} className="animate-spin" /> :
                   loadedTemplateId === template.id ? <><Check size={14} /> Loaded!</> :
                   <><Play size={14} /> Load</>}
                </button>
                <button onClick={() => startEdit(template)} className="flex-1 py-2.5 text-sm font-semibold flex items-center justify-center gap-1.5 transition-all active:scale-95 border-l border-r" style={{ color: 'var(--text-secondary)', borderColor: 'var(--border-color)' }}>
                  <Pencil size={14} /> Edit
                </button>
                <button onClick={() => handleDelete(template.id)} className="flex-1 py-2.5 text-sm font-semibold flex items-center justify-center gap-1.5 transition-all active:scale-95" style={{ color: 'var(--danger)' }}>
                  <Trash2 size={14} /> Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {successMsg && <SuccessToast message={successMsg} onDismiss={() => setSuccessMsg(null)} />}
    </div>
  );
}
