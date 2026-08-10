import { supabase } from './supabase';
import { STORAGE_KEYS, loadItem, saveItem } from './storage';
import type { DadosApp, RegistroRemoto, SyncMeta, Tombstone } from '../types/entities';

export const ENTITIES: (keyof DadosApp)[] = [
  'clientes',
  'agendamentos',
  'contas',
  'centrosCusto',
  'servicos',
  'pacotes',
  'pacotesVendidos',
  'produtos',
];

const TABLE = 'registros';

function keyFor(entidade: string, id: string): string {
  return `${entidade}:${id}`;
}

export async function loadSyncMeta(): Promise<SyncMeta> {
  return loadItem<SyncMeta>(STORAGE_KEYS.SYNC_META, { lastSyncAt: null, tombstones: [] });
}

export async function saveSyncMeta(meta: SyncMeta): Promise<void> {
  await saveItem(STORAGE_KEYS.SYNC_META, meta);
}

// Busca todos os registros do usuário no Supabase
export async function fetchRemote(uid: string): Promise<RegistroRemoto[]> {
  if (!supabase) throw new Error('Supabase não configurado');
  const { data, error } = await supabase.from(TABLE).select('*').eq('user_id', uid);
  if (error) throw error;
  return (data as RegistroRemoto[]) || [];
}

// Mescla os dados remotos nos locais (last-write-wins por registro, via updatedAt).
// Nunca remove registros locais: registros ausentes no local são adicionados,
// e registros com updated_at mais novo substituem os locais.
export function mergeLocalRemote(
  localDados: DadosApp,
  remoteRows: RegistroRemoto[],
  tombstones: Tombstone[]
): DadosApp {
  const merged: DadosApp = { ...localDados };
  const tombById: Record<string, Tombstone> = {};
  for (const t of tombstones || []) tombById[keyFor(t.entidade, t.id)] = t;

  const remoteById: Record<string, RegistroRemoto> = {};
  for (const r of remoteRows) remoteById[keyFor(r.entidade, r.id)] = r;

  for (const ent of ENTITIES) {
    const locais = localDados[ent];
    const out = locais.slice() as unknown[];
    const idxById = new Map(out.map((x, i) => [(x as { id: string }).id, i] as const));

    for (const r of remoteRows) {
      if (r.entidade !== ent) continue;
      const idx = idxById.get(r.id);
      if (idx === undefined) {
        const tomb = tombById[keyFor(ent, r.id)];
        if (tomb && Number(tomb.deletedAt) >= Number(r.updated_at || 0)) continue;
        out.push(r.dados);
      } else {
        const localUpd = Number((out[idx] as { updatedAt?: number }).updatedAt || 0);
        const remoteUpd = Number(r.updated_at || 0);
        if (remoteUpd > localUpd) out[idx] = r.dados;
      }
    }
    (merged as unknown as Record<string, unknown[]>)[ent] = out;
  }
  return merged;
}

export interface PushPlan {
  upserts: { id: string; entidade: string; dados: unknown; updated_at: number }[];
  deletes: { id: string; entidade: string }[];
}

// Calcula o que precisa ser enviado para o Supabase
export function computePushPlan(
  localDados: DadosApp,
  remoteRows: RegistroRemoto[],
  tombstones: Tombstone[]
): PushPlan {
  const upserts: PushPlan['upserts'] = [];
  const deletes: PushPlan['deletes'] = [];
  const remoteById: Record<string, RegistroRemoto> = {};
  for (const r of remoteRows) remoteById[keyFor(r.entidade, r.id)] = r;

  for (const ent of ENTITIES) {
    for (const rec of localDados[ent] || []) {
      const r = remoteById[keyFor(ent, rec.id)];
      const localUpd = Number(rec.updatedAt || 0);
      if (!r || Number(r.updated_at || 0) < localUpd) {
        upserts.push({ id: rec.id, entidade: ent, dados: rec, updated_at: localUpd || Date.now() });
      }
    }
  }

  for (const tomb of tombstones || []) {
    const r = remoteById[keyFor(tomb.entidade, tomb.id)];
    if (r && Number(r.updated_at || 0) <= Number(tomb.deletedAt)) {
      deletes.push({ id: tomb.id, entidade: tomb.entidade });
    }
  }
  return { upserts, deletes };
}

// Envia as mudanças locais para o Supabase. Retorna os tombstones que ainda valem.
export async function pushChanges(
  uid: string,
  localDados: DadosApp,
  remoteRows: RegistroRemoto[],
  tombstones: Tombstone[]
): Promise<{ tombstones: Tombstone[] }> {
  const { upserts, deletes } = computePushPlan(localDados, remoteRows, tombstones || []);
  if (!supabase) throw new Error('Supabase não configurado');

  if (upserts.length) {
    const rows = upserts.map((u) => ({ ...u, user_id: uid }));
    const { error } = await supabase.from(TABLE).upsert(rows);
    if (error) throw error;
  }

  const applied: string[] = [];
  for (const d of deletes) {
    const { error } = await supabase
      .from(TABLE)
      .delete()
      .eq('user_id', uid)
      .eq('id', d.id)
      .eq('entidade', d.entidade);
    if (error) throw error;
    applied.push(keyFor(d.entidade, d.id));
  }

  const remaining = (tombstones || []).filter((t) => !applied.includes(keyFor(t.entidade, t.id)));
  return { tombstones: remaining };
}