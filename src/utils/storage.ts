import AsyncStorage from '@react-native-async-storage/async-storage';

export const STORAGE_KEYS = {
  CLIENTES: '@manicure_app:clientes',
  AGENDAMENTOS: '@manicure_app:agendamentos',
  CONTAS: '@manicure_app:contas',
  CENTROS_CUSTO: '@manicure_app:centros_custo',
  SERVICOS: '@manicure_app:servicos',
  PACOTES: '@manicure_app:pacotes',
  PACOTES_VENDIDOS: '@manicure_app:pacotes_vendidos',
  PRODUTOS: '@manicure_app:produtos',
  SEEDED: '@manicure_app:seeded_v1',
  NOTIFICACOES_ENABLED: '@manicure_app:notificacoes_enabled',
  SYNC_META: '@manicure_app:sync_meta',
} as const;

export type StorageKey = (typeof STORAGE_KEYS)[keyof typeof STORAGE_KEYS];

export async function loadItem<T>(key: string, fallback: T): Promise<T> {
  try {
    const raw = await AsyncStorage.getItem(key);
    if (raw === null || raw === undefined) return fallback;
    return JSON.parse(raw) as T;
  } catch (e) {
    console.warn('Erro ao carregar', key, e);
    return fallback;
  }
}

export async function saveItem(key: string, value: unknown): Promise<void> {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.warn('Erro ao salvar', key, e);
  }
}