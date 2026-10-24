import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, type Session, type SupabaseClient, type User } from '@supabase/supabase-js';
import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';

// Preencha com os dados do seu projeto Supabase (Console > Settings > API):
export const SUPABASE_URL = 'https://iybtgijiarfyxmxoqcvp.supabase.co';
export const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml5YnRnaWppYXJmeXhteG9xY3ZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODYwNTM3NDksImV4cCI6MjEwMTYyOTc0OX0.oVLMGh2KoiGfVJLF-nca2kh79lxpUcn_i7L2VXZXr0U';

export const SCHEME = 'manicureapp';

export function isSupabaseConfigured(): boolean {
  return Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
}

export const supabase: SupabaseClient | null = isSupabaseConfigured()
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        storage: AsyncStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
      },
    })
  : null;

export async function getSession(): Promise<Session | null> {
  if (!supabase) return null;
  const { data } = await supabase.auth.getSession();
  return data?.session || null;
}

// Parse manual de query (?a=b&c=d) ou fragmento (#a=b) de uma URL custom scheme
function parseParams(raw: string): Record<string, string> {
  const params: Record<string, string> = {};
  if (!raw) return params;
  const clean = raw.charAt(0) === '?' || raw.charAt(0) === '#' ? raw.slice(1) : raw;
  for (const part of clean.split('&')) {
    if (!part) continue;
    const eq = part.indexOf('=');
    const key = eq === -1 ? part : part.slice(0, eq);
    const value = eq === -1 ? '' : part.slice(eq + 1);
    try {
      params[decodeURIComponent(key)] = decodeURIComponent(value.replace(/\+/g, ' '));
    } catch {
      params[key] = value;
    }
  }
  return params;
}

function splitCallbackUrl(url: string): {
  query: Record<string, string>;
  fragment: Record<string, string>;
} {
  let base = url;
  let fragmentStr = '';
  const hashIndex = url.indexOf('#');
  if (hashIndex !== -1) {
    fragmentStr = url.slice(hashIndex);
    base = url.slice(0, hashIndex);
  }
  const queryIndex = base.indexOf('?');
  return {
    query: parseParams(queryIndex === -1 ? '' : base.slice(queryIndex)),
    fragment: parseParams(fragmentStr),
  };
}

// Abre o fluxo OAuth do Google via Supabase (PKCE) e troca o código pela sessão
export async function signInWithGoogle(): Promise<User | null> {
  if (!supabase || !isSupabaseConfigured()) {
    throw new Error('Supabase não configurado. Preencha SUPABASE_URL e SUPABASE_ANON_KEY.');
  }

  const redirectTo = AuthSession.makeRedirectUri();
  console.log('[GoogleLogin] redirectTo:', redirectTo);

  // signInWithOAuth com skipBrowserRedirect gera o code_verifier (PKCE),
  // salva no AsyncStorage e devolve a URL de autorização com code_challenge
  const { data: oauthData, error: oauthError } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo,
      scopes: 'email profile',
      skipBrowserRedirect: true,
    },
  });
  if (oauthError || !oauthData?.url) {
    console.error('[GoogleLogin] Falha ao montar URL de autorização:', oauthError);
    throw new Error(`Erro ao iniciar login Google: ${oauthError?.message || 'URL indisponível'}`);
  }
  console.log('[GoogleLogin] URL de autorização:', oauthData.url);

  const result = await WebBrowser.openAuthSessionAsync(oauthData.url, redirectTo);
  console.log('[GoogleLogin] Resultado do navegador:', JSON.stringify(result));

  if (result.type !== 'success') {
    const url = (result as { url?: string }).url;
    throw new Error(
      `Login não concluído (type: ${result.type}). URL de retorno: ${url || 'nenhuma'}`
    );
  }

  const callbackUrl = result.url;
  const { query, fragment } = splitCallbackUrl(callbackUrl);
  console.log('[GoogleLogin] URL de retorno:', callbackUrl);
  console.log('[GoogleLogin] Query params:', JSON.stringify(query));
  console.log('[GoogleLogin] Fragment:', JSON.stringify(fragment));

  const desc =
    query.error_description || query.error || fragment.error_description || fragment.error;
  if (desc) {
    throw new Error(`Google retornou erro: ${desc}`);
  }

  // Fluxo PKCE: o Supabase devolve ?code=... (verificador salvo no AsyncStorage)
  if (query.code) {
    const { data: sessionData, error: exchangeError } = await supabase.auth.exchangeCodeForSession(
      String(query.code)
    );
    if (exchangeError) {
      console.error('[GoogleLogin] Erro no exchangeCodeForSession:', JSON.stringify(exchangeError));
      throw new Error(`Falha ao trocar o código pela sessão: ${exchangeError.message}`);
    }
    console.log('[GoogleLogin] Login PKCE concluído:', sessionData.user?.id);
    return sessionData.user;
  }

  // Fallback: fluxo implícito devolve os tokens no fragmento (#access_token=...)
  if (fragment.access_token && fragment.refresh_token) {
    const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
      access_token: fragment.access_token,
      refresh_token: fragment.refresh_token,
    });
    if (sessionError) {
      console.error('[GoogleLogin] Erro no setSession:', JSON.stringify(sessionError));
      throw new Error(`Falha ao criar a sessão: ${sessionError.message}`);
    }
    console.log('[GoogleLogin] Login (implicit) concluído:', sessionData.user?.id);
    return sessionData.user;
  }

  throw new Error(
    `Resposta do Google inválida: retorno sem code nem tokens. URL completa: ${callbackUrl}`
  );
}

export async function signOut(): Promise<void> {
  if (!supabase) return;
  await supabase.auth.signOut();
}