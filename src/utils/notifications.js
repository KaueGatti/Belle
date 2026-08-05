import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { STORAGE_KEYS, loadItem, saveItem } from './storage';
import { todayISO, formatDateShortWeekday } from './format';

export const SUMMARY_HOUR = 6;
export const SUMMARY_MINUTE = 0;
export const SUMMARY_DAYS_AHEAD = 7;
const REMINDER_MINUTES_BEFORE = 60;

const CHANNEL_ID = 'agendamentos';
const CHANNEL_NAME = 'Agendamentos';

export function initNotifications() {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
}

export async function ensureNotificationChannel() {
  if (Platform.OS !== 'android') return;
  try {
    await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
      name: CHANNEL_NAME,
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#A64D6B',
    });
  } catch (e) {
    console.warn('Falha ao criar canal de notificações', e);
  }
}

export async function ensurePermissions() {
  const current = await Notifications.getPermissionsAsync();
  if (
    current.granted ||
    (Platform.OS === 'ios' && current.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL)
  ) {
    return true;
  }
  const requested = await Notifications.requestPermissionsAsync();
  return (
    requested.granted ||
    (Platform.OS === 'ios' && requested.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL)
  );
}

export async function isNotificationsEnabled() {
  const value = await loadItem(STORAGE_KEYS.NOTIFICACOES_ENABLED, null);
  return value === null ? true : value === true;
}

export async function setNotificationsEnabled(enabled) {
  await saveItem(STORAGE_KEYS.NOTIFICACOES_ENABLED, Boolean(enabled));
}

function pad(n) {
  return String(n).padStart(2, '0');
}

function addDaysISO(iso, days) {
  const [y, m, d] = iso.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  date.setDate(date.getDate() + days);
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function serviceNames(servicos, agendamento) {
  if (Array.isArray(agendamento.servicos) && agendamento.servicos.length > 0) {
    return agendamento.servicos
      .map((id) => (servicos || []).find((s) => s.id === id)?.nome)
      .filter(Boolean)
      .join(' + ');
  }
  return agendamento.servico || '';
}

function clienteNome(clientes, id) {
  const c = (clientes || []).find((x) => x.id === id);
  return c ? c.nome : 'Cliente';
}

function buildDaySummary(agendamentos, clientes, servicos, dayISO) {
  const doDia = agendamentos
    .filter((a) => a.data === dayISO && a.status !== 'cancelado')
    .sort((a, b) => (a.hora || '').localeCompare(b.hora || ''));
  if (doDia.length === 0) return null;
  return doDia
    .map((a) => {
      const servico = serviceNames(servicos, a);
      return `${a.hora} - ${clienteNome(clientes, a.clienteId)}${servico ? ` (${servico})` : ''}`;
    })
    .join('\n');
}

// Cancela tudo e re-agenda: lembretes 1h antes + resumo da agenda às 06:00 dos próximos 7 dias.
export async function syncNotifications(agendamentos, clientes, servicos) {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();

    const perms = await Notifications.getPermissionsAsync();
    const granted =
      perms.granted ||
      (Platform.OS === 'ios' && perms.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL);
    if (!granted) return;

    const agora = Date.now();
    const hoje = todayISO();

    for (const a of agendamentos) {
      if (a.status === 'cancelado' || !a.data || !a.hora) continue;
      const trigger = new Date(`${a.data}T${a.hora}:00`);
      trigger.setMinutes(trigger.getMinutes() - REMINDER_MINUTES_BEFORE);
      if (trigger.getTime() <= agora) continue;
      await Notifications.scheduleNotificationAsync({
        content: {
          title: `${clienteNome(clientes, a.clienteId)} às ${a.hora}`,
          body: serviceNames(servicos, a) || 'Seu próximo atendimento começa em 1 hora',
          sound: 'default',
          ...(Platform.OS === 'android' ? { channelId: CHANNEL_ID } : {}),
          data: { type: 'lembrete', agendamentoId: a.id },
        },
        trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: trigger },
      });
    }

    for (let i = 0; i < SUMMARY_DAYS_AHEAD; i++) {
      const dia = addDaysISO(hoje, i);
      const body = buildDaySummary(agendamentos, clientes, servicos, dia);
      if (!body) continue;
      const trigger = new Date(
        `${dia}T${pad(SUMMARY_HOUR)}:${pad(SUMMARY_MINUTE)}:00`
      );
      if (trigger.getTime() <= agora) continue;
      await Notifications.scheduleNotificationAsync({
        content: {
          title: `Agenda ${formatDateShortWeekday(dia)}`,
          body,
          sound: 'default',
          ...(Platform.OS === 'android' ? { channelId: CHANNEL_ID } : {}),
          data: { type: 'resumo', data: dia },
        },
        trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: trigger },
      });
    }
  } catch (e) {
    console.warn('Falha ao sincronizar notificações', e);
  }
}

export async function cancelAllNotifications() {
  await Notifications.cancelAllScheduledNotificationsAsync();
}

export async function getPermissionStatus() {
  const p = await Notifications.getPermissionsAsync();
  return (
    p.granted ||
    (Platform.OS === 'ios' && p.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL)
  );
}

export async function getScheduledNotifications() {
  try {
    return (await Notifications.getAllScheduledNotificationsAsync()) || [];
  } catch (e) {
    console.warn('Falha ao listar notificações agendadas', e);
    return [];
  }
}

export async function scheduleTestNotification(seconds = 10) {
  const trigger = new Date(Date.now() + seconds * 1000);
  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Notificação de teste',
      body: 'Se você está vendo isto, as notificações estão funcionando!',
      sound: 'default',
      ...(Platform.OS === 'android' ? { channelId: CHANNEL_ID } : {}),
      data: { type: 'teste' },
    },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: trigger },
  });
}
