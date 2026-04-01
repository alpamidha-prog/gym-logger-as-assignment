'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import {
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  onAuthStateChanged,
  signOut,
  User,
} from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { seedDefaultMovements, seedDefaultTemplates } from '@/lib/firestore';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithGoogleRedirect: () => Promise<void>;
  logout: () => Promise<void>;
  error: string | null;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signInWithGoogle: async () => {},
  signInWithGoogleRedirect: async () => {},
  logout: async () => {},
  error: null,
  clearError: () => {},
});

export function AuthContextProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      if (user) {
        try {
          await seedDefaultMovements(user.uid);
          await seedDefaultTemplates(user.uid);
        } catch (e) {
          console.error('Failed to seed defaults:', e);
        }
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    try {
      setError(null);
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (e: unknown) {
      const err = e as { code?: string; message?: string };
      if (err.code === 'auth/popup-blocked') {
        try {
          const provider = new GoogleAuthProvider();
          await signInWithRedirect(auth, provider);
        } catch (redirectErr) {
          setError('Sign-in failed. Please try again.');
        }
      } else {
        setError(err.message || 'Sign-in failed. Please try again.');
      }
    }
  };

  const signInWithGoogleRedirect = async () => {
    try {
      setError(null);
      const provider = new GoogleAuthProvider();
      await signInWithRedirect(auth, provider);
    } catch {
      setError('Sign-in failed. Please try again.');
    }
  };

  const logout = async () => {
    await signOut(auth);
  };

  const clearError = () => setError(null);

  return (
    <AuthContext.Provider
      value={{ user, loading, signInWithGoogle, signInWithGoogleRedirect, logout, error, clearError }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
