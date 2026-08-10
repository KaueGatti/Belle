import React, { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { AppState } from 'react-native';
import { useData } from './DataContext';
import { useAuth } from './AuthContext';
import { supabase, isSupabaseConfigured } from '../utils/supabase';
import {
  ENTITIES,
  loadSyncMeta,
  saveSyncMeta,
  fetchRemote,
  mergeLocalRemote,
  pushChanges,
} from '../utils/sync';
import type { DadosApp, Tombstone } from '../types/entities';

interface SyncContextValue {
  syncing: boolean;
  ultimaSync: number | null;
  ultimoErro: string | null;
  syncNow: () => Promise<boolean>;
  configurado: boolean;
}

const SyncContext = createContext<SyncContextValue | null>(null);

export function SyncProvider({ children }: { children: ReactNode }) {
  const {
    clientes,
    agendamentos,
    contas,
    centrosCusto,
    servicos,
    pacotes,
    pacotesVendidos,
    produtos,
    restoreSnapshot,
  } = useData();
  const { user } = useAuth();

  const [syncing, setSyncing] = useState(false);
  const [ultimaSync, setUltimaSync] = useState<number | null>(null);
  const [ultimoErro, setUltimoErro] = useState<string | null>(null);

  const syncingRef = useRef(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prevIdsRef = useRef<Record<string, Set<string>> | null>(null);
  const readyRef = useRef(false);

  const configured = Boolean(supabase && isSupabaseConfigured());

  const localDados: DadosApp = {
    clientes,
    agendamentos,
    contas,
    centrosCusto,
    servicos,
    pacotes,
    pacotesVendidos,
    produtos,
  };

  async function syncNow(): Promise<boolean> {
    if (!configured || !user) return false;
    if (syncingRef.current) return false;
    syncingRef.current = true;
    setSyncing(true);
    try {
      const meta = await loadSyncMeta();
      const remoteRows = await fetchRemote(user.id);
      const merged = mergeLocalRemote(localDados, remoteRows, meta.tombstones || []);
      const { tombstones } = await pushChanges(user.id, merged, remoteRows, meta.tombstones || []);
      const changed = ENTITIES.some(
        (ent) => JSON.stringify(merged[ent]) !== JSON.stringify(localDados[ent] || [])
      );
      if (changed) restoreSnapshot(merged);
      await saveSyncMeta({ lastSyncAt: Date.now(), tombstones });
      setUltimaSync(Date.now());
      setUltimoErro(null);
      return true;
    } catch (e) {
      setUltimoErro(String(e instanceof Error ? e.message : e));
      return false;
    } finally {
      syncingRef.current = false;
      setSyncing(false);
    }
  }

  // Sincroniza ao logar e ao voltar para o primeiro plano
  useEffect(() => {
    if (!user) {
      readyRef.current = false;
      return;
    }
    const init: Record<string, Set<string>> = {};
    for (const ent of ENTITIES) init[ent] = new Set((localDados[ent] || []).map((r) => r.id));
    prevIdsRef.current = init;
    readyRef.current = true;
    syncNow();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active' && user) syncNow();
    });
    return () => sub.remove();
  }, [user]);

  // Detecta exclusões (tombstones) e agenda push a cada mudança local
  useEffect(() => {
    if (!user) return;

    const current: Record<string, Set<string>> = {};
    for (const ent of ENTITIES) current[ent] = new Set((localDados[ent] || []).map((r) => r.id));

    if (readyRef.current && prevIdsRef.current) {
      const tombstones: Tombstone[] = [];
      for (const ent of ENTITIES) {
        for (const id of prevIdsRef.current[ent]) {
          if (!current[ent].has(id)) tombstones.push({ id, entidade: ent, deletedAt: Date.now() });
        }
      }
      if (tombstones.length) {
        loadSyncMeta().then((meta) => {
          saveSyncMeta({ ...meta, tombstones: [...(meta.tombstones || []), ...tombstones] });
        });
      }
    }
    prevIdsRef.current = current;
    readyRef.current = true;

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => syncNow(), 2000);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientes, agendamentos, contas, centrosCusto, servicos, pacotes, pacotesVendidos]);

  const value: SyncContextValue = { syncing, ultimaSync, ultimoErro, syncNow, configurado: configured };

  return <SyncContext.Provider value={value}>{children}</SyncContext.Provider>;
}

export function useSync() {
  const ctx = useContext(SyncContext);
  if (!ctx) throw new Error('useSync deve ser usado dentro de um SyncProvider');
  return ctx;
}