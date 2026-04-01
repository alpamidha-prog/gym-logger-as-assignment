'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Plus, Pencil, Trash2, Search, Check, X } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { SkeletonList } from '@/components/Skeleton';
import { getMovements, addMovement, updateMovement, deleteMovement } from '@/lib/firestore';
import type { Movement, MovementCategory } from '@/types';

const CATEGORIES: MovementCategory[] = ['Legs', 'Back', 'Chest', 'Shoulders', 'Arms', 'Core', 'Cardio', 'Other'];

export default function MovementsPage() {
  const { user } = useAuth();
  const [movements, setMovements] = useState<Movement[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<MovementCategory | 'All'>('All');
  const [search, setSearch] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState('');
  const [newCategory, setNewCategory] = useState<MovementCategory>('Other');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editCategory, setEditCategory] = useState<MovementCategory>('Other');

  const loadData = useCallback(async () => {
    if (!user) return;
    try {
      const m = await getMovements(user.uid);
      setMovements(m);
    } catch (e) {
      console.error('Failed to load movements:', e);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => { loadData(); }, [loadData]);

  const filtered = useMemo(() => {
    return movements.filter((m) => {
      const matchCategory = filter === 'All' || m.category === filter;
      const matchSearch = !search || m.name.toLowerCase().includes(search.toLowerCase());
      return matchCategory && matchSearch;
    });
  }, [movements, filter, search]);

  const grouped = useMemo(() => {
    const groups: Record<string, Movement[]> = {};
    filtered.forEach((m) => {
      if (!groups[m.category]) groups[m.category] = [];
      groups[m.category].push(m);
    });
    return groups;
  }, [filtered]);

  const handleAdd = async () => {
    if (!user || !newName.trim()) return;
    try {
      const m = await addMovement(user.uid, { name: newName.trim(), category: newCategory, isCustom: true });
      setMovements([...movements, m]);
      setNewName('');
      setShowAdd(false);
    } catch (e) {
      console.error('Failed to add movement:', e);
    }
  };

  const handleDelete = async (id: string) => {
    if (!user) return;
    setMovements((prev) => prev.filter((m) => m.id !== id));
    try { await deleteMovement(user.uid, id); } catch { loadData(); }
  };

  const startEdit = (m: Movement) => {
    setEditingId(m.id);
    setEditName(m.name);
    setEditCategory(m.category);
  };

  const saveEdit = async () => {
    if (!user || !editingId) return;
    setMovements((prev) => prev.map((m) => m.id === editingId ? { ...m, name: editName, category: editCategory } : m));
    setEditingId(null);
    try { await updateMovement(user.uid, editingId, { name: editName, category: editCategory }); } catch { loadData(); }
  };

  if (loading) {
    return <div className="py-6"><div className="skeleton h-8 w-48 rounded-lg mb-6" /><SkeletonList count={4} /></div>;
  }

  return (
    <div className="py-6 flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Movements</h1>
        <button onClick={() => setShowAdd(!showAdd)} className="p-2 rounded-xl transition-all active:scale-90" style={{ backgroundColor: 'var(--accent)', color: 'var(--text-on-accent)' }}>
          <Plus size={18} />
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-tertiary)' }} />
        <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search movements..."
          className="w-full pl-9 pr-4 py-3 rounded-xl text-sm outline-none"
          style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-primary)', border: '1px solid var(--border-color)' }} />
      </div>

      {/* Category filters */}
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1" style={{ scrollbarWidth: 'none' }}>
        <button onClick={() => setFilter('All')}
          className="px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all active:scale-95"
          style={{
            backgroundColor: filter === 'All' ? 'var(--accent)' : 'var(--bg-tertiary)',
            color: filter === 'All' ? 'var(--text-on-accent)' : 'var(--text-secondary)',
          }}>All</button>
        {CATEGORIES.map((cat) => (
          <button key={cat} onClick={() => setFilter(cat)}
            className="px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all active:scale-95"
            style={{
              backgroundColor: filter === cat ? 'var(--accent)' : 'var(--bg-tertiary)',
              color: filter === cat ? 'var(--text-on-accent)' : 'var(--text-secondary)',
            }}>{cat}</button>
        ))}
      </div>

      {/* Add form */}
      {showAdd && (
        <div className="card-depth rounded-2xl p-4 flex flex-col gap-3 animate-fade-in" style={{ backgroundColor: 'var(--bg-secondary)' }}>
          <input type="text" value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Movement name"
            className="px-4 py-3 rounded-xl text-sm outline-none"
            style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-primary)', border: '1px solid var(--border-color)' }} />
          <select value={newCategory} onChange={(e) => setNewCategory(e.target.value as MovementCategory)}
            className="px-4 py-3 rounded-xl text-sm outline-none"
            style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-primary)', border: '1px solid var(--border-color)' }}>
            {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <button onClick={handleAdd} disabled={!newName.trim()}
            className="py-2.5 rounded-xl text-sm font-bold disabled:opacity-40 transition-all active:scale-95"
            style={{ backgroundColor: 'var(--accent)', color: 'var(--text-on-accent)' }}>
            Add Movement
          </button>
        </div>
      )}

      {/* Movement list grouped by category */}
      {Object.keys(grouped).length === 0 ? (
        <div className="text-center py-12"><p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>No movements found.</p></div>
      ) : (
        Object.entries(grouped).map(([category, moves]) => (
          <div key={category}>
            <h2 className="text-xs font-bold uppercase tracking-wider mb-2 px-1" style={{ color: 'var(--accent)' }}>{category}</h2>
            <div className="card-depth rounded-2xl overflow-hidden" style={{ backgroundColor: 'var(--bg-secondary)' }}>
              {moves.map((m, i) => (
                <div key={m.id} className="flex items-center justify-between px-4 py-3 group"
                  style={{ borderBottom: i < moves.length - 1 ? '1px solid var(--border-color)' : 'none' }}>
                  {editingId === m.id ? (
                    <div className="flex items-center gap-2 flex-1">
                      <input type="text" value={editName} onChange={(e) => setEditName(e.target.value)}
                        className="flex-1 px-2 py-1 rounded-lg text-sm outline-none"
                        style={{ backgroundColor: 'var(--bg-accent)', color: 'var(--accent)', border: '1px solid var(--accent)' }} />
                      <select value={editCategory} onChange={(e) => setEditCategory(e.target.value as MovementCategory)}
                        className="px-2 py-1 rounded-lg text-xs outline-none"
                        style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-primary)', border: '1px solid var(--border-color)' }}>
                        {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                      </select>
                      <button onClick={saveEdit} className="p-1 rounded active:scale-90" style={{ color: 'var(--success)' }}><Check size={14} /></button>
                      <button onClick={() => setEditingId(null)} className="p-1 rounded active:scale-90" style={{ color: 'var(--text-tertiary)' }}><X size={14} /></button>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{m.name}</span>
                        {m.isCustom && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full font-bold" style={{ backgroundColor: 'var(--bg-accent)', color: 'var(--accent)' }}>Custom</span>
                        )}
                      </div>
                      <div className="flex items-center gap-1 opacity-40 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => startEdit(m)} className="p-1.5 rounded active:scale-90" style={{ color: 'var(--text-tertiary)' }}><Pencil size={12} /></button>
                        <button onClick={() => handleDelete(m.id)} className="p-1.5 rounded active:scale-90" style={{ color: 'var(--danger)' }}><Trash2 size={12} /></button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))
      )}

      <p className="text-xs text-center" style={{ color: 'var(--text-tertiary)' }}>
        {movements.length} movements total
      </p>
    </div>
  );
}
