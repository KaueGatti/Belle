import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, Switch, StyleSheet, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import Screen from '../components/Screen';
import Card from '../components/Card';
import Button from '../components/Button';
import { useToast } from '../components/Toast';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { useSync } from '../context/SyncContext';
import { colors, spacing, radius } from '../theme/colors';
import { exportarBackup, salvarBackupNoDispositivo, aplicarBackup, lerArquivoBackup } from '../utils/backup';
import {
  ensurePermissions,
  isNotificationsEnabled,
  setNotificationsEnabled,
  syncNotifications,
  cancelAllNotifications,
  getPermissionStatus,
  getScheduledNotifications,
  scheduleTestNotification,
  SUMMARY_HOUR,
  SUMMARY_MINUTE,
} from '../utils/notifications';

function triggerTime(trigger) {
  if (!trigger || typeof trigger !== 'object') return null;
  if (typeof trigger.date === 'number') return new Date(trigger.date);
  if (trigger.date instanceof Date) return trigger.date;
  if (typeof trigger.value === 'number') return new Date(trigger.value);
  return null;
}

function formatTrigger(trigger) {
  const d = triggerTime(trigger);
  if (!d || isNaN(d.getTime())) return `(${trigger?.type || '?'})`;
  return d.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function SettingsScreen() {
  const { agendamentos, clientes, servicos, restoreSnapshot } = useData();
  const { showToast } = useToast();
  const { user, signInWithGoogle, signOut } = useAuth();
  const { syncing, ultimaSync, ultimoErro, syncNow, configurado: syncConfigurado } = useSync();
  const [enabled, setEnabled] = useState(null);
  const [permGranted, setPermGranted] = useState(null);
  const [scheduled, setScheduled] = useState([]);
  const [testando, setTestando] = useState(false);
  const [exportando, setExportando] = useState(false);
  const [importando, setImportando] = useState(false);
  const [entrando, setEntrando] = useState(false);

  async function refresh() {
    setPermGranted(await getPermissionStatus());
    setScheduled(await getScheduledNotifications());
  }

  useEffect(() => {
    isNotificationsEnabled().then(setEnabled);
    refresh();
  }, []);

  async function toggle(value) {
    setEnabled(value);
    await setNotificationsEnabled(value);
    if (value) {
      const granted = await ensurePermissions();
      setPermGranted(granted);
      if (!granted) {
        setEnabled(false);
        await setNotificationsEnabled(false);
        showToast('Permissão de notificações negada', 'error');
        return;
      }
      await syncNotifications(agendamentos, clientes, servicos);
      showToast('Notificações ativadas');
    } else {
      await cancelAllNotifications();
      showToast('Notificações desativadas', 'info');
    }
    refresh();
  }

  async function handleReRequest() {
    const granted = await ensurePermissions();
    setPermGranted(granted);
    showToast(granted ? 'Permissão concedida' : 'Permissão negada', granted ? 'success' : 'error');
    refresh();
  }

  async function handleTest() {
    if (!permGranted) {
      showToast('Permissão de notificação negada', 'error');
      return;
    }
    setTestando(true);
    try {
      await scheduleTestNotification(10);
      showToast('Teste agendado para daqui a 10s');
    } finally {
      setTestando(false);
    }
  }

  async function handleExportar() {
    setExportando(true);
    try {
      const uri = await exportarBackup();
      showToast(uri ? 'Backup gerado' : 'Compartilhamento indisponível', uri ? 'success' : 'info');
    } catch (e) {
      showToast(`Falha ao exportar: ${e.message}`, 'error');
    } finally {
      setExportando(false);
    }
  }

  async function handleSalvar() {
    setExportando(true);
    try {
      const uri = await salvarBackupNoDispositivo();
      showToast(
        uri ? 'Backup salvo no aparelho' : 'Salvamento cancelado',
        uri ? 'success' : 'info'
      );
    } catch (e) {
      showToast(`Falha ao salvar: ${e.message}`, 'error');
    } finally {
      setExportando(false);
    }
  }

  async function handleImportar() {
    const result = await DocumentPicker.getDocumentAsync({
      type: 'application/json',
      copyToCacheDirectory: true,
    });
    if (result.canceled) return;
    const asset = result.assets[0];
    if (!asset) return;
    setImportando(true);
    try {
      const snapshot = await lerArquivoBackup(asset.uri);
      Alert.alert(
        'Importar backup',
        'Isso vai substituir todos os dados atuais do app pelos dados do arquivo. Continuar?',
        [
          { text: 'Cancelar', style: 'cancel' },
          {
            text: 'Importar',
            style: 'destructive',
            onPress: async () => {
              try {
                await aplicarBackup(snapshot);
                restoreSnapshot(snapshot.dados);
                showToast('Backup importado');
              } catch (e) {
                showToast(`Falha ao importar: ${e.message}`, 'error');
              } finally {
                setImportando(false);
              }
            },
          },
        ]
      );
    } catch (e) {
      showToast('Arquivo inválido', 'error');
      setImportando(false);
    }
  }

  async function handleLogin() {
    setEntrando(true);
    try {
      await signInWithGoogle();
      showToast('Conectado');
    } catch (e) {
      showToast(e?.message || 'Falha no login', 'error');
    } finally {
      setEntrando(false);
    }
  }

  async function handleSair() {
    await signOut();
    showToast('Sessão encerrada', 'info');
  }

  async function handleSyncAgora() {
    const ok = await syncNow();
    showToast(ok ? 'Sincronizado' : 'Falha na sincronização', ok ? 'success' : 'error');
  }

  const horarioResumo = `${String(SUMMARY_HOUR).padStart(2, '0')}:${String(SUMMARY_MINUTE).padStart(2, '0')}`;

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Card style={styles.card}>
          <View style={styles.row}>
            <View style={styles.iconWrap}>
              <Ionicons name="person-circle-outline" size={20} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>Conta e sincronização</Text>
              <Text style={styles.subtitle}>
                {syncConfigurado
                  ? user
                    ? 'Dados sincronizados com a nuvem.'
                    : 'Entre com o Google para sincronizar seus dados.'
                  : 'Configuração pendente.'}
              </Text>
            </View>
          </View>

          {!syncConfigurado ? (
            <View style={[styles.pendingBox, { marginTop: spacing.md }]}>
              <Text style={styles.pendingText}>
                Preencha SUPABASE_URL e SUPABASE_ANON_KEY em src/utils/supabase.js para ativar a
                sincronização em nuvem.
              </Text>
            </View>
          ) : user ? (
            <>
              <View style={styles.diagRow}>
                <Text style={styles.diagLabel}>Conta</Text>
                <Text style={[styles.diagValue, { maxWidth: 180 }]} numberOfLines={1}>
                  {user.email || user.id}
                </Text>
              </View>
              <View style={styles.diagRow}>
                <Text style={styles.diagLabel}>Última sincronização</Text>
                <Text style={styles.diagValue}>
                  {syncing
                    ? 'Sincronizando…'
                    : ultimaSync
                    ? new Date(ultimaSync).toLocaleString('pt-BR')
                    : '—'}
                </Text>
              </View>
              {ultimoErro ? (
                <View style={[styles.pendingBox, { backgroundColor: colors.dangerLight }]}>
                  <Text style={[styles.pendingText, { color: colors.danger }]} numberOfLines={2}>
                    Erro: {ultimoErro}
                  </Text>
                </View>
              ) : null}
              <View style={styles.diagActions}>
                <Button
                  title="Sincronizar"
                  variant="outline"
                  icon={<Ionicons name="sync-outline" size={18} color={colors.primary} />}
                  onPress={handleSyncAgora}
                  loading={syncing}
                  style={{ flex: 1 }}
                />
                <Button
                  title="Sair"
                  variant="danger"
                  onPress={handleSair}
                  style={{ flex: 1 }}
                />
              </View>
            </>
          ) : (
            <View style={{ marginTop: spacing.md }}>
              <Button
                title="Entrar com Google"
                icon={<Ionicons name="logo-google" size={18} color={colors.textInverse} />}
                onPress={handleLogin}
                loading={entrando}
              />
            </View>
          )}
        </Card>

        <Card style={styles.card}>
          <View style={styles.row}>
            <View style={styles.iconWrap}>
              <Ionicons name="notifications-outline" size={20} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>Notificações</Text>
              <Text style={styles.subtitle}>
                Resumo da agenda às {horarioResumo} (próximos 7 dias) e lembrete 1 hora antes de cada
                agendamento.
              </Text>
            </View>
            <Switch
              value={enabled === true}
              onValueChange={toggle}
              disabled={enabled === null}
              trackColor={{ false: colors.border, true: colors.primaryLight }}
              thumbColor={enabled === true ? colors.primary : '#fff'}
            />
          </View>
        </Card>

        <Card style={styles.card}>
          <Text style={styles.cardTitle}>Diagnóstico</Text>

          <View style={styles.diagRow}>
            <Text style={styles.diagLabel}>Permissão</Text>
            <Text
              style={[
                styles.diagValue,
                {
                  color:
                    permGranted === null ? colors.textSecondary : permGranted ? colors.success : colors.danger,
                },
              ]}
            >
              {permGranted === null ? 'Verificando…' : permGranted ? 'Permitida' : 'Negada'}
            </Text>
          </View>

          <View style={styles.diagRow}>
            <Text style={styles.diagLabel}>Agendadas agora</Text>
            <Text style={styles.diagValue}>{scheduled.length}</Text>
          </View>

          {scheduled.length > 0 ? (
            <View style={styles.scheduledList}>
              {scheduled.slice(0, 10).map((n) => (
                <View key={n.identifier} style={styles.scheduledItem}>
                  <Text numberOfLines={1} style={styles.scheduledTitle}>
                    {n.content?.title || 'Notificação'}
                  </Text>
                  <Text style={styles.scheduledTime}>{formatTrigger(n.trigger)}</Text>
                </View>
              ))}
              {scheduled.length > 10 ? (
                <Text style={styles.scheduledMore}>… e mais {scheduled.length - 10}</Text>
              ) : null}
            </View>
          ) : null}

          <View style={styles.diagActions}>
            <Button
              title="Requerer permissão"
              variant="outline"
              onPress={handleReRequest}
              style={{ flex: 1 }}
            />
            <Button
              title="Testar em 10s"
              onPress={handleTest}
              loading={testando}
              style={{ flex: 1 }}
            />
          </View>
        </Card>

        <Card style={styles.card}>
          <View style={styles.row}>
            <View style={styles.iconWrap}>
              <Ionicons name="cloud-download-outline" size={20} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>Backup de dados</Text>
              <Text style={styles.subtitle}>
                Exporte um arquivo com todos os seus dados ou importe um backup existente.
              </Text>
            </View>
          </View>

          <View style={styles.diagActions}>
            <Button
              title="Compartilhar"
              variant="outline"
              icon={<Ionicons name="share-social-outline" size={18} color={colors.primary} />}
              onPress={handleExportar}
              loading={exportando}
              style={{ flex: 1 }}
            />
            <Button
              title="Salvar no celular"
              icon={<Ionicons name="download-outline" size={18} color={colors.textInverse} />}
              onPress={handleSalvar}
              loading={exportando}
              style={{ flex: 1 }}
            />
          </View>
          <View style={styles.diagActions}>
            <Button
              title="Importar"
              variant="outline"
              icon={<Ionicons name="cloud-upload-outline" size={18} color={colors.primary} />}
              onPress={handleImportar}
              loading={importando}
              style={{ flex: 1 }}
            />
          </View>
        </Card>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.md, paddingBottom: 60 },
  card: { marginTop: spacing.sm },
  row: { flexDirection: 'row', alignItems: 'center' },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  title: { fontSize: 15, fontWeight: '700', color: colors.textPrimary },
  subtitle: { fontSize: 12, color: colors.textSecondary, marginTop: 3, lineHeight: 17 },
  cardTitle: { fontSize: 15, fontWeight: '700', color: colors.textPrimary, marginBottom: spacing.sm },
  diagRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  diagLabel: { fontSize: 13, color: colors.textSecondary },
  diagValue: { fontSize: 14, fontWeight: '700', color: colors.textPrimary },
  scheduledList: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.md,
    padding: spacing.sm,
    marginTop: spacing.sm,
  },
  scheduledItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  scheduledTitle: { flex: 1, fontSize: 12, color: colors.textPrimary, marginRight: spacing.sm },
  scheduledTime: { fontSize: 11, fontWeight: '600', color: colors.textSecondary },
  scheduledMore: { fontSize: 11, color: colors.textSecondary, marginTop: 4 },
  diagActions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md },
  pendingBox: {
    backgroundColor: colors.warningLight,
    borderRadius: radius.md,
    padding: spacing.sm + 2,
  },
  pendingText: { fontSize: 12, color: colors.warning, lineHeight: 17 },
});
