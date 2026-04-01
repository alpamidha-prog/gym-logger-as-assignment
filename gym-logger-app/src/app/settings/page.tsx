'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useSettings } from '@/contexts/SettingsContext';
import { useTheme } from '@/contexts/ThemeContext';
import { LogOut, Download, Monitor, Sun as SunIcon, Moon as MoonIcon } from 'lucide-react';
import { exportAllData } from '@/lib/firestore';

export default function SettingsPage() {
  const { user, logout } = useAuth();
  const { settings, updateSettings } = useSettings();
  const { theme, setTheme } = useTheme();

  const handleExport = async () => {
    if (!user) return;
    try {
      const csv = await exportAllData(user.uid);
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `gym-log-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error('Export failed:', e);
    }
  };

  const themeOptions = [
    { value: 'system' as const, label: 'System', icon: Monitor },
    { value: 'light' as const, label: 'Light', icon: SunIcon },
    { value: 'dark' as const, label: 'Dark', icon: MoonIcon },
  ];

  const unitOptions = [
    { value: 'kg' as const, label: 'Kilograms (kg)' },
    { value: 'lbs' as const, label: 'Pounds (lbs)' },
  ];

  return (
    <div className="py-6 flex flex-col gap-5">
      <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Settings</h1>

      {/* Profile */}
      <div className="card-depth rounded-2xl p-4" style={{ backgroundColor: 'var(--bg-secondary)' }}>
        <h2 className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: 'var(--text-tertiary)' }}>Profile</h2>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{user?.displayName || 'User'}</p>
            <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>{user?.email}</p>
          </div>
          <button onClick={logout}
            className="px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-all active:scale-95"
            style={{ backgroundColor: 'rgba(239,68,68,0.1)', color: 'var(--danger)' }}>
            <LogOut size={14} />
            Log Out
          </button>
        </div>
      </div>

      {/* Appearance */}
      <div className="card-depth rounded-2xl p-4" style={{ backgroundColor: 'var(--bg-secondary)' }}>
        <h2 className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: 'var(--text-tertiary)' }}>Appearance</h2>
        <div className="grid grid-cols-3 gap-2">
          {themeOptions.map((opt) => {
            const Icon = opt.icon;
            const isActive = theme === opt.value;
            return (
              <button key={opt.value} onClick={() => {
                setTheme(opt.value);
                updateSettings({ theme: opt.value });
              }}
                className="flex flex-col items-center gap-1.5 py-3 rounded-xl text-xs font-bold transition-all active:scale-95"
                style={{
                  backgroundColor: isActive ? 'var(--accent)' : 'var(--bg-tertiary)',
                  color: isActive ? 'var(--text-on-accent)' : 'var(--text-secondary)',
                  boxShadow: isActive ? 'var(--btn-shadow)' : 'none',
                }}>
                <Icon size={18} />
                {opt.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Weight unit */}
      <div className="card-depth rounded-2xl p-4" style={{ backgroundColor: 'var(--bg-secondary)' }}>
        <h2 className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: 'var(--text-tertiary)' }}>Weight Unit</h2>
        <div className="grid grid-cols-2 gap-2">
          {unitOptions.map((opt) => {
            const isActive = settings.unit === opt.value;
            return (
              <button key={opt.value} onClick={() => updateSettings({ unit: opt.value })}
                className="py-3 rounded-xl text-sm font-bold transition-all active:scale-95"
                style={{
                  backgroundColor: isActive ? 'var(--accent)' : 'var(--bg-tertiary)',
                  color: isActive ? 'var(--text-on-accent)' : 'var(--text-secondary)',
                  boxShadow: isActive ? 'var(--btn-shadow)' : 'none',
                }}>
                {opt.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Nutrition targets */}
      <div className="card-depth rounded-2xl p-4" style={{ backgroundColor: 'var(--bg-secondary)' }}>
        <h2 className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: 'var(--text-tertiary)' }}>Daily Nutrition Targets</h2>
        <div className="grid grid-cols-2 gap-3">
          {[
            { key: 'calorieTarget' as const, label: 'Calories (kcal)', value: settings.calorieTarget },
            { key: 'proteinTarget' as const, label: 'Protein (g)', value: settings.proteinTarget },
            { key: 'carbTarget' as const, label: 'Carbs (g)', value: settings.carbTarget },
            { key: 'fatTarget' as const, label: 'Fat (g)', value: settings.fatTarget },
          ].map((field) => (
            <div key={field.key} className="flex flex-col gap-1">
              <label className="text-xs font-medium" style={{ color: 'var(--text-tertiary)' }}>{field.label}</label>
              <input type="number" value={field.value}
                onChange={(e) => updateSettings({ [field.key]: Number(e.target.value) })}
                className="px-3 py-2.5 rounded-xl text-sm font-medium text-center outline-none"
                style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-primary)', border: '1px solid var(--border-color)' }} />
            </div>
          ))}
        </div>
      </div>

      {/* Export */}
      <div className="card-depth rounded-2xl p-4" style={{ backgroundColor: 'var(--bg-secondary)' }}>
        <h2 className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: 'var(--text-tertiary)' }}>Data</h2>
        <button onClick={handleExport}
          className="w-full py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all active:scale-[0.97]"
          style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-primary)', border: '1px solid var(--border-color)' }}>
          <Download size={16} />
          Export All Data as CSV
        </button>
      </div>

      {/* Footer */}
      <p className="text-xs text-center py-4" style={{ color: 'var(--text-tertiary)' }}>
        Gym Logger AS • Built with Next.js & Firebase
      </p>
    </div>
  );
}
