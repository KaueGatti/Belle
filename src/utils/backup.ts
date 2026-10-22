import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';
import { StorageAccessFramework } from 'expo-file-system/legacy';
import { STORAGE_KEYS, loadItem, saveItem, type StorageKey } from './storage';
import { dateToISO } from './format';
import type {
  Agendamento,
  BackupSnapshot,
  CentroCusto,
  Cliente,
  Compromisso,
  Conta,
  DadosApp,
  Pacote,
  PacoteVendido,
  Produto,
  Servico,
} from '../types/entities';

export const BACKUP_VERSION = 1;

const DATA_KEYS: StorageKey[] = [
  STORAGE_KEYS.CLIENTES,
  STORAGE_KEYS.AGENDAMENTOS,
  STORAGE_KEYS.CONTAS,
  STORAGE_KEYS.CENTROS_CUSTO,
  STORAGE_KEYS.SERVICOS,
  STORAGE_KEYS.PACOTES,
  STORAGE_KEYS.PACOTES_VENDIDOS,
  STORAGE_KEYS.PRODUTOS,
  STORAGE_KEYS.COMPROMISSOS,
];

const SNAPSHOT_KEYS: (keyof DadosApp)[] = [
  'clientes',
  'agendamentos',
  'contas',
  'centrosCusto',
  'servicos',
  'pacotes',
  'pacotesVendidos',
  'produtos',
  'compromissos',
];

// Chaves obrigatórias na validação. 'compromissos' é opcional para aceitar
// backups antigos gerados antes da entidade existir.
const SNAPSHOT_REQUIRED_KEYS: (keyof DadosApp)[] = SNAPSHOT_KEYS.filter((k) => k !== 'compromissos');

// Monta o snapshot completo com todos os dados locais
export async function collectSnapshot(): Promise<BackupSnapshot> {
  const [clientes, agendamentos, contas, centrosCusto, servicos, pacotes, pacotesVendidos, produtos, compromissos] =
    await Promise.all([
      loadItem<Cliente[]>(STORAGE_KEYS.CLIENTES, []),
      loadItem<Agendamento[]>(STORAGE_KEYS.AGENDAMENTOS, []),
      loadItem<Conta[]>(STORAGE_KEYS.CONTAS, []),
      loadItem<CentroCusto[]>(STORAGE_KEYS.CENTROS_CUSTO, []),
      loadItem<Servico[]>(STORAGE_KEYS.SERVICOS, []),
      loadItem<Pacote[]>(STORAGE_KEYS.PACOTES, []),
      loadItem<PacoteVendido[]>(STORAGE_KEYS.PACOTES_VENDIDOS, []),
      loadItem<Produto[]>(STORAGE_KEYS.PRODUTOS, []),
      loadItem<Compromisso[]>(STORAGE_KEYS.COMPROMISSOS, []),
    ]);
  return {
    versao: BACKUP_VERSION,
    exportadoEm: new Date().toISOString(),
    dados: { clientes, agendamentos, contas, centrosCusto, servicos, pacotes, pacotesVendidos, produtos, compromissos },
  };
}

function nomeArquivo() {
  return `manicure-backup-${dateToISO(new Date()).replace(/-/g, '')}.json`;
}

// Gera um arquivo .json e abre a folha de compartilhamento (salvar/e-mail/WhatsApp)
export async function exportarBackup(): Promise<string> {
  const snapshot = await collectSnapshot();
  const file = new FileSystem.File(FileSystem.Paths.document, nomeArquivo());
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
export async function salvarBackupNoDispositivo(): Promise<string | null> {
  const snapshot = await collectSnapshot();
  if (Platform.OS !== 'android') {
    throw new Error('Salvar no aparelho está disponível apenas no Android');
  }
  const perms = await StorageAccessFramework.requestDirectoryPermissionsAsync();
  if (!perms.granted || !perms.directoryUri) return null;
  const uri = await StorageAccessFramework.createFileAsync(perms.directoryUri, nomeArquivo(), 'application/json');
  await StorageAccessFramework.writeAsStringAsync(uri, JSON.stringify(snapshot, null, 2));
  return uri;
}

export function validateSnapshot(snapshot: unknown): snapshot is BackupSnapshot {
  if (!snapshot || typeof snapshot !== 'object') return false;
  const dados = (snapshot as { dados?: unknown }).dados;
  if (!dados) return false;
  return SNAPSHOT_REQUIRED_KEYS.every((k) => Array.isArray((dados as Partial<DadosApp>)[k]));
}

// Grava o backup de volta no AsyncStorage (a UI/contexto recarrega depois)
export async function aplicarBackup(snapshot: BackupSnapshot): Promise<void> {
  if (!validateSnapshot(snapshot)) {
    throw new Error('Arquivo de backup inválido');
  }
  await Promise.all(
    DATA_KEYS.map((k, i) => saveItem(k, snapshot.dados[SNAPSHOT_KEYS[i]] ?? []))
  );
}

// Lê o conteúdo de um .json escolhido e retorna o snapshot parseado
export async function lerArquivoBackup(uri: string): Promise<unknown> {
  const file = new FileSystem.File(uri);
  const texto = await file.text();
  return JSON.parse(texto);
}