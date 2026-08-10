import React, { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { User } from '@supabase/supabase-js';
import {
  supabase,
  isSupabaseConfigured,
  getSession,
  signInWithGoogle as supabaseSignIn,
  signOut as supabaseSignOut,
} from '../utils/supabase';

interface AuthContextValue {
  user: User | null;
  carregando: boolean;
  supabaseConfigurado: boolean;
  signInWithGoogle: () => Promise<User | null>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    let mounted = true;
    const client = supabase;
    if (!client || !isSupabaseConfigured()) {
      setCarregando(false);
      return;
    }

    (async () => {
      try {
        const session = await getSession();
        if (mounted) setUser(session?.user || null);
      } finally {
        if (mounted) setCarregando(false);
      }

      const { data: listener } = client.auth.onAuthStateChange((_event, session) => {
        if (mounted) setUser(session?.user || null);
      });

      return () => {
        mounted = false;
        listener?.subscription?.unsubscribe();
      };
    })();
  }, []);

  async function signInWithGoogle() {
    return supabaseSignIn();
  }

  async function signOut() {
    await supabaseSignOut();
  }

  const value: AuthContextValue = {
    user,
    carregando,
    supabaseConfigurado: Boolean(supabase && isSupabaseConfigured()),
    signInWithGoogle,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  return ctx;
}