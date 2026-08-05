import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  supabase,
  isSupabaseConfigured,
  getSession,
  signInWithGoogle as supabaseSignIn,
  signOut as supabaseSignOut,
} from '../utils/supabase';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    let mounted = true;

    (async () => {
      if (!supabase || !isSupabaseConfigured()) {
        setCarregando(false);
        return;
      }
      try {
        const session = await getSession();
        if (mounted) setUser(session?.user || null);
      } finally {
        if (mounted) setCarregando(false);
      }

      const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
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

  const value = {
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
