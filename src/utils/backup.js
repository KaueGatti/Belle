import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';
import { StorageAccessFramework } from 'expo-file-system/legacy';
import { STORAGE_KEYS, loadItem, saveItem } from './storage';
import { dateToISO } from './format';

export const BACKUP_VERSION = 1;

const DATA_KEYS = [
  STORAGE_KEYS.CLIENTES,
  STORAGE_KEYS.AGENDAMENTOS,
  STORAGE_KEYS.CONTAS,
  STORAGE_KEYS.CENTROS_CUSTO,
  STORAGE_KEYS.SERVICOS,
  STORAGE_KEYS.PACOTES,
  STORAGE_KEYS.PACOTES_VENDIDOS,
];

const SNAPSHOT_KEYS = [
  'clientes',
  'agendamentos',
  'contas',
  'centrosCusto',
  'servicos',
  'pacotes',
  'pacotesVendidos',
];

// Monta o snapshot completo com todos os dados locais
export async function collectSnapshot() {
  const values = await Promise.all(DATA_KEYS.map((k) => loadItem(k, [])));
  const dados = {};
  SNAPSHOT_KEYS.forEach((key, i) => {
    dados[key] = values[i];
  });
  return {
    versao: BACKUP_VERSION,
    exportadoEm: new Date().toISOString(),
    dados,
  };
}

// Gera um arquivo .json e abre a folha de compartilhamento (salvar/e-mail/WhatsApp)
export async function exportarBackup() {
  const snapshot = await collectSnapshot();
  const file = new FileSystem.File(
    FileSystem.Paths.document,
    `manicure-backup-${dateToISO(new Date()).replace(/-/g, '')}.json`
  );
  file.create({ overwrite: true, intermediates: true });
  file.write(JSON.stringify(snapshot, null, 2));
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(file.uri, {
      mimeType: 'application/json',
      dialogTitle: 'Exportar backup',
    });
  }
  return file.uri;
}

// Salva o backup em um local visível escolhido pelo usuário (ex.: Downloads)
// via Storage Access Framework (Android). Retorna null se cancelado.
export async function salvarBackupNoDispositivo() {
  const snapshot = await collectSnapshot();
  if (Platform.OS !== 'android') {
    throw new Error('Salvar no aparelho está disponível apenas no Android');
  }
  const perms = await StorageAccessFramework.requestDirectoryPermissionsAsync();
  if (!perms.granted || !perms.directoryUri) return null;
  const nome = `manicure-backup-${dateToISO(new Date()).replace(/-/g, '')}.json`;
  const uri = await StorageAccessFramework.createFileAsync(perms.directoryUri, nome, 'application/json');
  await StorageAccessFramework.writeAsStringAsync(uri, JSON.stringify(snapshot, null, 2));
  return uri;
}

export function validateSnapshot(snapshot) {
  if (!snapshot || typeof snapshot !== 'object' || !snapshot.dados) return false;
  return SNAPSHOT_KEYS.every((k) => Array.isArray(snapshot.dados[k]));
}

// Grava o backup de volta no AsyncStorage (a UI/contexto recarrega depois)
export async function aplicarBackup(snapshot) {
  if (!validateSnapshot(snapshot)) {
    throw new Error('Arquivo de backup inválido');
  }
  const { dados } = snapshot;
  await Promise.all(
    DATA_KEYS.map((k, i) => saveItem(k, dados[SNAPSHOT_KEYS[i]]))
  );
}

// Lê o conteúdo de um .json escolhido e retorna o snapshot parseado
export async function lerArquivoBackup(uri) {
  const file = new FileSystem.File(uri);
  const texto = await file.text();
  return JSON.parse(texto);
}
