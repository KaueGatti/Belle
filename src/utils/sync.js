import { supabase } from './supabase';
import { STORAGE_KEYS, loadItem, saveItem } from './storage';

export const ENTITIES = [
  'clientes',
  'agendamentos',
  'contas',
  'centrosCusto',
  'servicos',
  'pacotes',
  'pacotesVendidos',
];

const TABLE = 'registros';

function keyFor(entidade, id) {
  return `${entidade}:${id}`;
}

export async function loadSyncMeta() {
  return loadItem(STORAGE_KEYS.SYNC_META, { lastSyncAt: null, tombstones: [] });
}

export async function saveSyncMeta(meta) {
  await saveItem(STORAGE_KEYS.SYNC_META, meta);
}

// Busca todos os registros do usuário no Supabase
export async function fetchRemote(uid) {
  const { data, error } = await supabase.from(TABLE).select('*').eq('user_id', uid);
  if (error) throw error;
  return data || [];
}

// Mescla os dados remotos nos locais (last-write-wins por registro, via updatedAt).
// Nunca remove registros locais: registros ausentes no local são adicionados,
// e registros com updated_at mais novo substituem os locais.
export function mergeLocalRemote(localDados, remoteRows, tombstones) {
  const merged = { ...localDados };
  const tombById = {};
  for (const t of tombstones || []) tombById[keyFor(t.entidade, t.id)] = t;

  const remoteById = {};
  for (const r of remoteRows) remoteById[keyFor(r.entidade, r.id)] = r;

  for (const ent of ENTITIES) {
    const locals = localDados[ent] || [];
    const out = locals.slice();
    const idxById = new Map(out.map((x, i) => [x.id, i]));

    for (const r of remoteRows) {
      if (r.entidade !== ent) continue;
      const idx = idxById.get(r.id);
      if (idx === undefined) {
        const tomb = tombById[keyFor(ent, r.id)];
        if (tomb && Number(tomb.deletedAt) >= Number(r.updated_at || 0)) continue;
        out.push(r.dados);
      } else {
        const localUpd = Number(out[idx].updatedAt || 0);
        const remoteUpd = Number(r.updated_at || 0);
        if (remoteUpd > localUpd) out[idx] = r.dados;
      }
    }
    merged[ent] = out;
  }
  return merged;
}

// Calcula o que precisa ser enviado para o Supabase
export function computePushPlan(localDados, remoteRows, tombstones) {
  const upserts = [];
  const deletes = [];
  const remoteById = {};
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
export async function pushChanges(uid, localDados, remoteRows, tombstones) {
  const { upserts, deletes } = computePushPlan(localDados, remoteRows, tombstones || []);

  if (upserts.length) {
    const rows = upserts.map((u) => ({ ...u, user_id: uid }));
    const { error } = await supabase.from(TABLE).upsert(rows);
    if (error) throw error;
  }

  const applied = [];
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
