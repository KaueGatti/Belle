import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
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

const SyncContext = createContext(null);

export function SyncProvider({ children }) {
  const {
    clientes,
    agendamentos,
    contas,
    centrosCusto,
    servicos,
    pacotes,
    pacotesVendidos,
    restoreSnapshot,
  } = useData();
  const { user } = useAuth();

  const [syncing, setSyncing] = useState(false);
  const [ultimaSync, setUltimaSync] = useState(null);
  const [ultimoErro, setUltimoErro] = useState(null);

  const syncingRef = useRef(false);
  const debounceRef = useRef(null);
  const prevIdsRef = useRef(null);
  const readyRef = useRef(false);

  const configured = Boolean(supabase && isSupabaseConfigured());

  const localDados = {
    clientes,
    agendamentos,
    contas,
    centrosCusto,
    servicos,
    pacotes,
    pacotesVendidos,
  };

  async function syncNow() {
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
      setUltimoErro(String(e?.message || e));
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
    const init = {};
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

    const current = {};
    for (const ent of ENTITIES) current[ent] = new Set((localDados[ent] || []).map((r) => r.id));

    if (readyRef.current && prevIdsRef.current) {
      const tombstones = [];
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

  const value = { syncing, ultimaSync, ultimoErro, syncNow, configurado: configured };

  return <SyncContext.Provider value={value}>{children}</SyncContext.Provider>;
}

export function useSync() {
  const ctx = useContext(SyncContext);
  if (!ctx) throw new Error('useSync deve ser usado dentro de um SyncProvider');
  return ctx;
}
