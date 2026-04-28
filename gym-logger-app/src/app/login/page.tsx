'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

export default function LoginPage() {
  const { user, signInWithGoogle, signInWithGoogleRedirect, error, clearError } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (user) {
      router.replace('/');
    }
  }, [user, router]);

  const handlePopupLogin = async () => {
    setIsLoading(true);
    await signInWithGoogle();
    setIsLoading(false);
  };

  const handleRedirectLogin = async () => {
    setIsLoading(true);
    await signInWithGoogleRedirect();
  };

  return (
    <div className="flex items-center justify-center min-h-screen -mt-12">
      <div
        className="card-depth w-full max-w-sm rounded-3xl p-8 flex flex-col items-center gap-6 animate-modal-in"
        style={{ backgroundColor: 'var(--bg-secondary)' }}
      >
        {/* Logo */}
        <div className="flex flex-col items-center gap-3">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl animate-glow-pulse"
            style={{
              backgroundColor: 'var(--accent)',
              color: 'var(--text-on-accent)',
              boxShadow: 'var(--btn-shadow)',
            }}
          >
            🏋️
          </div>
          <div className="text-center">
            <h1 className="text-4xl font-bold" style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-dancing-script)' }}>
              Gym Logger AS
            </h1>
            <p className="text-base font-medium mt-1" style={{ color: 'var(--text-primary)', opacity: 0.85 }}>
              Track workouts & nutrition
            </p>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div
            className="w-full px-4 py-3 rounded-xl text-sm animate-fade-in"
            style={{
              backgroundColor: 'rgba(239,68,68,0.1)',
              color: 'var(--danger)',
              border: '1px solid var(--danger)',
            }}
          >
            <div className="flex justify-between items-start">
              <p>{error}</p>
              <button onClick={clearError} className="text-xs font-bold ml-2">✕</button>
            </div>
          </div>
        )}

        {/* Google sign-in button */}
        <button
          onClick={handlePopupLogin}
          disabled={isLoading}
          className="w-full py-3.5 rounded-xl font-bold text-base flex items-center justify-center gap-3 transition-all active:scale-[0.97] disabled:opacity-60"
          style={{
            backgroundColor: 'var(--bg-tertiary)',
            color: 'var(--text-primary)',
            border: '1px solid var(--border-color)',
          }}
        >
          {isLoading ? (
            <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
          ) : (
            <svg width="20" height="20" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
          )}
          Sign in with Google
        </button>

        {/* Redirect fallback */}
        <button
          onClick={handleRedirectLogin}
          disabled={isLoading}
          className="w-full py-2.5 rounded-xl text-sm font-medium transition-all active:scale-[0.97]"
          style={{ color: 'var(--text-tertiary)' }}
        >
          Having trouble? Use redirect sign-in
        </button>

        <p className="text-xs text-center" style={{ color: 'var(--text-tertiary)' }}>
          Your data is stored securely and only visible to you.
        </p>
      </div>
    </div>
  );
}
