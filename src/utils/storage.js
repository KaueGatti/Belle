import AsyncStorage from '@react-native-async-storage/async-storage';

export const STORAGE_KEYS = {
  CLIENTES: '@manicure_app:clientes',
  AGENDAMENTOS: '@manicure_app:agendamentos',
  CONTAS: '@manicure_app:contas',
  CENTROS_CUSTO: '@manicure_app:centros_custo',
  SERVICOS: '@manicure_app:servicos',
  PACOTES: '@manicure_app:pacotes',
  PACOTES_VENDIDOS: '@manicure_app:pacotes_vendidos',
  SEEDED: '@manicure_app:seeded_v1',
  NOTIFICACOES_ENABLED: '@manicure_app:notificacoes_enabled',
  SYNC_META: '@manicure_app:sync_meta',
};

export async function loadItem(key, fallback) {
  try {
    const raw = await AsyncStorage.getItem(key);
    if (raw === null || raw === undefined) return fallback;
    return JSON.parse(raw);
  } catch (e) {
    console.warn('Erro ao carregar', key, e);
    return fallback;
  }
}

export async function saveItem(key, value) {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.warn('Erro ao salvar', key, e);
  }
}
