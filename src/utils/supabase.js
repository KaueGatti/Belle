import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import * as Linking from 'expo-linking';
import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';

// Preencha com os dados do seu projeto Supabase (Console > Settings > API):
export const SUPABASE_URL = 'https://iybtgijiarfyxmxoqcvp.supabase.co';
export const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml5YnRnaWppYXJmeXhteG9xY3ZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODYwNTM3NDksImV4cCI6MjEwMTYyOTc0OX0.oVLMGh2KoiGfVJLF-nca2kh79lxpUcn_i7L2VXZXr0U';

export const SCHEME = 'manicureapp';

export function isSupabaseConfigured() {
  return Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
}

export const supabase = isSupabaseConfigured()
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        storage: AsyncStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
      },
    })
  : null;

export function getSession() {
  if (!supabase) return Promise.resolve(null);
  return supabase.auth.getSession().then(({ data }) => data?.session || null);
}

// Abre o fluxo OAuth do Google via Supabase e troca o código pela sessão
export async function signInWithGoogle() {
  if (!supabase || !isSupabaseConfigured()) {
    throw new Error('Supabase não configurado. Preencha SUPABASE_URL e SUPABASE_ANON_KEY.');
  }
  const redirectTo = AuthSession.makeRedirectUri();
  const authUrl = `${SUPABASE_URL}/auth/v1/authorize?provider=google&redirect_to=${encodeURIComponent(
    redirectTo
  )}&scopes=email+profile`;

  const result = await WebBrowser.openAuthSessionAsync(authUrl, redirectTo);
  if (result.type !== 'success') {
    throw new Error(result.type === 'dismiss' ? 'Login cancelado' : 'Falha no login');
  }

  const { queryParams } = Linking.parse(result.url);
  if (queryParams?.error) {
    throw new Error(String(queryParams.error_description || queryParams.error));
  }
  if (!queryParams?.code) {
    throw new Error('Resposta do Google inválida');
  }

  const { data, error } = await supabase.auth.exchangeCodeForSession(String(queryParams.code));
  if (error) throw error;
  return data.user;
}

export async function signOut() {
  if (!supabase) return;
  await supabase.auth.signOut();
}
